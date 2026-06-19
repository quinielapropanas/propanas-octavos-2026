// ═══════════════════════════════════════════════════════════
// /api/admin/recalc-fast — Optimized rebuild (in-memory processing)
// No scorer evaluation, batch operations
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { calculateGroupStandings } from '@/lib/domain/tournament/group-calculator';
import { rankBestThirds } from '@/lib/domain/tournament/best-thirds';
import { resolveR32Slots, propagateWinners } from '@/lib/domain/tournament/bracket-resolver';
import { evaluateAllConcepts, buildRanking } from '@/lib/domain/scoring/score-evaluator';
import { lookupFIFAMatrix } from '@/lib/domain/tournament/fifa-matrix';
import type {
  MatchData, MatchResult, GroupStandingResult,
  BracketSlotData, PredictionInput, TeamData,
  ScoringConfig, ScoreBreakdownResult,
} from '@/lib/domain/types';

const POOL_ID = 'pool-propanas-octavos-2026';

function fifaMatrixLookup(key: string): Record<string, string> | null {
  const row = lookupFIFAMatrix(key);
  if (!row) return null;
  const hosts = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L'];
  const result: Record<string, string> = {};
  hosts.forEach((host, i) => { result[host] = row[i]; });
  return result;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  const start = Date.now();

  try {
    // ── Load all data in parallel ──
    const [
      poolConfig, teamsRaw, matchesRaw, officialResultsRaw,
      officialBracketRaw, allEntries, allPredictionsRaw, behaviorFlags,
      adminMembers,
    ] = await Promise.all([
      prisma.poolScoringConcept.findMany({ where: { poolId: POOL_ID } }),
      prisma.team.findMany({ where: { poolId: POOL_ID } }),
      prisma.match.findMany({ where: { poolId: POOL_ID } }),
      prisma.officialResult.findMany({ where: { poolId: POOL_ID } }),
      prisma.bracketSlot.findMany({
        where: { poolId: POOL_ID, contextType: 'OFFICIAL', contextKey: 'OFFICIAL' },
      }),
      prisma.entry.findMany({ where: { poolId: POOL_ID } }),
      prisma.prediction.findMany({
        where: { poolId: POOL_ID, status: 'VALID', homeGoals: { not: null } },
      }),
      prisma.poolBehaviorFlags.findFirst({ where: { poolId: POOL_ID } }),
      prisma.poolMembership.findMany({
        where: { poolId: POOL_ID, role: 'ADMIN' },
        select: { userId: true },
      }),
    ]);

    const adminIds = adminMembers.map(m => m.userId);
    const entries = allEntries.filter(e => !adminIds.includes(e.userId));

    // ── Build in-memory structures ──
    const teams: TeamData[] = teamsRaw.map(t => ({
      id: t.id, name: t.name, shortName: t.shortName,
     groupLetter: t.groupLetter ?? '', flagUrl: (t as any).flagAssetKey ?? null,
      fifaRanking: t.fifaRanking,
    })) as any;

    const allMatches: MatchData[] = matchesRaw.map(m => ({
	  parentSlot1: null,
      parentSlot2: null,
      id: m.id, matchNumber: m.matchNumber, phase: m.phase,
      groupLetter: m.groupLetter, slotId: m.slotId,
      homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId,
      homeOrigin: m.homeOrigin, awayOrigin: m.awayOrigin,
      scheduledAt: m.scheduledAt, venue: m.venue,
    }));

    const officialResults = new Map<string, MatchResult>();
    for (const r of officialResultsRaw) {
      officialResults.set(r.matchId, {
        matchId: r.matchId, homeGoals: r.homeGoals, awayGoals: r.awayGoals,
        homePenalties: r.homePenalties, awayPenalties: r.awayPenalties,
      });
    }

    const config: ScoringConfig = {
      concepts: poolConfig.map(c => ({
        conceptId: c.conceptId, name: c.name, points: c.points, isActive: c.isActive,
      })),
      knockoutMatchScoringEnabled: behaviorFlags?.knockoutMatchScoringEnabled ?? false,
      penaltiesCountForScore: behaviorFlags?.penaltiesCountForScore ?? false,
      absoluteGoalDifference: behaviorFlags?.absoluteGoalDifference ?? true,
      goleadaThreshold: behaviorFlags?.goleadaThreshold ?? 4,
      golPromedioBandas: (behaviorFlags?.golPromedioBandas as any) ?? [],
    };

    const predictionsByEntry = new Map<string, Map<string, PredictionInput>>();
    for (const p of allPredictionsRaw) {
      if (p.homeGoals == null) continue;
      if (!predictionsByEntry.has(p.entryId)) predictionsByEntry.set(p.entryId, new Map());
      predictionsByEntry.get(p.entryId)!.set(p.matchId, {
		matchId: p.matchId,
        homeGoals: p.homeGoals, awayGoals: p.awayGoals!,
        homePenalties: p.homePenalties, awayPenalties: p.awayPenalties,
      });
    }

    // ── Calculate official standings & bracket ──
    const officialStandings: GroupStandingResult[] = [];
    for (const g of 'ABCDEFGHIJKL'.split('')) {
      officialStandings.push(calculateGroupStandings(g, teams, allMatches, officialResults));
    }

    const officialBestThirds = rankBestThirds(officialStandings);

    const matchBySlot = new Map<string, string>();
    for (const m of allMatches) {
      if (m.phase !== 'GROUP') matchBySlot.set(m.slotId, m.id);
    }

    const adminR32: BracketSlotData[] = officialBracketRaw
      .filter(s => s.round === 'R32' && s.homeTeamId && s.awayTeamId)
      .map(s => ({
        slotId: s.slotId, round: s.round as any,
        homeTeamId: s.homeTeamId, awayTeamId: s.awayTeamId,
        winnerTeamId: null, loserTeamId: null,
      }));

    let officialBracketSlots: BracketSlotData[] = [];
    if (adminR32.length >= 16) {
      officialBracketSlots = propagateWinners(adminR32, officialResults, matchBySlot);
    } else {
      const r32 = resolveR32Slots(officialStandings, officialBestThirds, fifaMatrixLookup);
      officialBracketSlots = propagateWinners(r32, officialResults, matchBySlot);
    }

    // ── Score all participants in memory ──
    const allBreakdowns: ScoreBreakdownResult[] = [];

    for (const entry of entries) {
      const predictions = predictionsByEntry.get(entry.id);
      if (!predictions || predictions.size === 0) continue;

      const participantStandings: GroupStandingResult[] = [];
      for (const g of 'ABCDEFGHIJKL'.split('')) {
        const predResults = new Map<string, MatchResult>();
        for (const m of allMatches.filter(mm => mm.groupLetter === g && mm.phase === 'GROUP')) {
          const pred = predictions.get(m.id);
          if (pred) {
            predResults.set(m.id, {
              matchId: m.id, homeGoals: pred.homeGoals, awayGoals: pred.awayGoals,
            });
          }
        }
        participantStandings.push(calculateGroupStandings(g, teams, allMatches, predResults));
      }

      const participantThirds = rankBestThirds(participantStandings);
      const participantR32 = resolveR32Slots(participantStandings, participantThirds, fifaMatrixLookup);

      const participantKnockoutResults = new Map<string, MatchResult>();
      for (const m of allMatches.filter(mm => mm.phase !== 'GROUP')) {
        const pred = predictions.get(m.id);
        if (pred) {
          participantKnockoutResults.set(m.id, {
            matchId: m.id, homeGoals: pred.homeGoals, awayGoals: pred.awayGoals,
            homePenalties: pred.homePenalties, awayPenalties: pred.awayPenalties,
          });
        }
      }
      const participantBracket = propagateWinners(participantR32, participantKnockoutResults, matchBySlot);

      const breakdown = evaluateAllConcepts({
        userId: entry.id, config, predictions,
        participantGroupStandings: participantStandings,
        participantBracketSlots: participantBracket,
        participantTopScorer: null,
        officialResults,
        officialGroupStandings: officialStandings,
        officialBracketSlots,
        actualTopScorer: null,
        actualGoalAverage: null,
        matches: allMatches,
      });
      allBreakdowns.push(breakdown);
    }

    // ── Batch persist ──
    const BATCH = 10;
    for (let i = 0; i < allBreakdowns.length; i += BATCH) {
      const batch = allBreakdowns.slice(i, i + BATCH);
      await Promise.all(batch.map(async (bd) => {
        await prisma.scoreBreakdown.deleteMany({
          where: { poolId: POOL_ID, userId: bd.userId },
        });
        if (bd.scores.length > 0) {
          await prisma.scoreBreakdown.createMany({
            data: bd.scores.map(s => ({
              poolId: POOL_ID, userId: bd.userId,
              conceptId: s.conceptId,
              breakdownKey: s.matchId ?? s.slotId ?? `${s.conceptId}-${Math.random()}`,
              matchId: s.matchId ?? null, slotId: s.slotId ?? null,
              pointsAwarded: s.pointsAwarded,
              explanation: s.explanation ?? '',
            })),
          });
        }
      }));
    }

    // Build and persist rankings
    const entryNames = new Map(entries.map(e => [e.id, e.displayName ?? '']));
    const rankings = buildRanking(allBreakdowns, entryNames);
    await prisma.ranking.deleteMany({ where: { poolId: POOL_ID } });
    if (rankings.length > 0) {
      await prisma.ranking.createMany({
        data: rankings.map(r => ({
          poolId: POOL_ID, userId: r.userId,
          position: r.position, totalPoints: r.totalPoints,
          phase1Points: r.phase1Points, phase2Points: r.phase2Points,
          matchesPredicted: r.matchesPredicted ?? 0,
          conceptTotals: r.conceptTotals as any,
        })),
      });
    }

    const elapsed = Date.now() - start;

    return NextResponse.json({
      success: true,
      participantsScored: allBreakdowns.length,
      elapsedMs: elapsed,
    });

  } catch (err: any) {
    return NextResponse.json({
      error: err?.message ?? 'Unknown error',
      stack: err?.stack,
    }, { status: 500 });
  }
}