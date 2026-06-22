// ═══════════════════════════════════════════════════════════
// /api/admin/recalc-fast — Optimized rebuild (in-memory processing)
// No scorer evaluation, batch operations
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { propagateWinners } from '@/lib/domain/tournament/bracket-resolver';
import { evaluateAllConcepts, buildRanking } from '@/lib/domain/scoring/score-evaluator';
import type {
  MatchData, MatchResult, BracketSlotData, PredictionInput, TeamData,
  ScoringConfig, ScoreBreakdownResult, GroupStandingResult,
} from '@/lib/domain/types';

const POOL_ID = 'pool-propanas-octavos-2026';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  const start = Date.now();

  try {
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

    const teams: TeamData[] = teamsRaw.map(t => ({
      id: t.id, name: t.name, shortName: t.shortName,
      groupLetter: t.groupLetter ?? '', flagUrl: (t as any).flagAssetKey ?? null,
      fifaRanking: t.fifaRanking,
    })) as any;

    const allMatches: MatchData[] = matchesRaw.map(m => ({
      parentSlot1: null, parentSlot2: null,
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

    const matchBySlot = new Map<string, string>();
    for (const m of allMatches) {
      if (m.phase !== 'GROUP') matchBySlot.set(m.slotId, m.id);
    }

    // ── Build official bracket (R16 as base + propagate) ──
    const adminR16: BracketSlotData[] = officialBracketRaw
      .filter(s => s.round === 'R16' && s.homeTeamId && s.awayTeamId)
      .map(s => ({
        slotId: s.slotId, round: s.round as any,
        homeTeamId: s.homeTeamId, awayTeamId: s.awayTeamId,
        winnerTeamId: null, loserTeamId: null,
      }));

    const officialBracketSlots = propagateWinners(adminR16, officialResults, matchBySlot);

    // Persist propagated official bracket back to DB
    for (const slot of officialBracketSlots) {
      if (slot.round === 'R16') continue; // R16 already exists, skip
      await prisma.bracketSlot.upsert({
        where: { poolId_contextKey_slotId: { poolId: POOL_ID, contextKey: 'OFFICIAL', slotId: slot.slotId } },
        update: {
          homeTeamId: slot.homeTeamId, awayTeamId: slot.awayTeamId,
          round: slot.round as any, contextType: 'OFFICIAL',
        },
        create: {
          poolId: POOL_ID, contextType: 'OFFICIAL', contextKey: 'OFFICIAL',
          slotId: slot.slotId, round: slot.round as any,
          homeTeamId: slot.homeTeamId, awayTeamId: slot.awayTeamId,
        },
      });
    }
	
	// Also update matches table with team assignments
    for (const slot of officialBracketSlots) {
      if (slot.round === 'R16') continue;
      if (slot.homeTeamId && slot.awayTeamId) {
        await prisma.match.updateMany({
          where: { poolId: POOL_ID, slotId: slot.slotId },
          data: {
            homeTeamId: slot.homeTeamId,
            awayTeamId: slot.awayTeamId,
          },
        });
      }
    }
	
    // Also update R16 winners
    for (const slot of officialBracketSlots.filter(s => s.round === 'R16')) {
      await prisma.bracketSlot.update({
        where: { poolId_contextKey_slotId: { poolId: POOL_ID, contextKey: 'OFFICIAL', slotId: slot.slotId } },
        data: { winnerTeamId: slot.winnerTeamId, loserTeamId: slot.loserTeamId },
      });
    }

    // ── Score participants ──
    const allBreakdowns: ScoreBreakdownResult[] = [];

    for (const entry of entries) {
      const predictions = predictionsByEntry.get(entry.id);
      if (!predictions || predictions.size === 0) continue;

      // Get participant's R16 (copy from official)
      const participantR16: BracketSlotData[] = officialBracketRaw
        .filter(s => s.round === 'R16' && s.homeTeamId && s.awayTeamId)
        .map(s => ({
          slotId: s.slotId, round: s.round as any,
          homeTeamId: s.homeTeamId, awayTeamId: s.awayTeamId,
          winnerTeamId: null, loserTeamId: null,
        }));

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
      const participantBracket = propagateWinners(participantR16, participantKnockoutResults, matchBySlot);

      const breakdown = evaluateAllConcepts({
        userId: entry.id, config, predictions,
        participantGroupStandings: [],
        participantBracketSlots: participantBracket,
        participantTopScorer: null,
        officialResults,
        officialGroupStandings: [],
        officialBracketSlots,
        actualTopScorer: null,
        actualGoalAverage: null,
        matches: allMatches,
      });
      allBreakdowns.push(breakdown);
    }

    // ── Persist scores and rankings ──
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