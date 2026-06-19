// ═══════════════════════════════════════════════════════════
// Data Provider — Prisma implementation of RecalcDataProvider
// ═══════════════════════════════════════════════════════════

import { prisma } from './client';
import type { RecalcDataProvider, RecalcPersister } from '../domain/recalculator/recalculator';
import type {
  ScoringConfig, TeamData, MatchData, MatchResult,
  GroupOverridePayload, BestThirdsResult, PredictionInput,
  TopScorerPredictionData, TopScorerActual,
  GroupStandingResult, BracketSlotData, ScoreBreakdownResult,
  RankingEntry,
} from '../domain/types';
import { lookupFIFAMatrix } from '../domain/tournament/fifa-matrix';
import { breakdownKey, contextKey, OFFICIAL_CONTEXT_KEY } from './helpers';

// ─── Data Provider ───────────────────────────────────────

export const dataProvider: RecalcDataProvider = {
  async getPoolConfig(poolId) {
    const [concepts, flags] = await Promise.all([
      prisma.poolScoringConcept.findMany({ where: { poolId } }),
      prisma.poolBehaviorFlags.findFirst({ where: { poolId } }),
    ]);
    return {
      concepts: concepts.map(c => ({
        conceptId: c.conceptId, name: c.name, points: c.points, isActive: c.isActive,
      })),
      knockoutMatchScoringEnabled: flags?.knockoutMatchScoringEnabled ?? true,
      penaltiesCountForScore: flags?.penaltiesCountForScore ?? false,
      absoluteGoalDifference: flags?.absoluteGoalDifference ?? true,
      goleadaThreshold: flags?.goleadaThreshold ?? 4,
      golPromedioBandas: (flags?.golPromedioBandas as any) ?? [],
    };
  },

  async getTeams(poolId) {
    const teams = await prisma.team.findMany({ where: { poolId } });
    return teams.map(t => ({
      id: t.id, name: t.name, shortName: t.shortName,
      isoCode: t.isoCode ?? '', groupLetter: t.groupLetter,
      fifaRanking: t.fifaRanking ?? 999,
    }));
  },

  async getAllMatches(poolId) {
    const matches = await prisma.match.findMany({ where: { poolId }, orderBy: { matchNumber: 'asc' } });
    return matches.map(m => ({
      id: m.id, matchNumber: m.matchNumber, phase: m.phase as any,
      groupLetter: m.groupLetter, slotId: m.slotId,
      homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId,
      homeOrigin: m.homeOrigin, awayOrigin: m.awayOrigin,
      parentSlot1: m.parentSlot1, parentSlot2: m.parentSlot2,
    }));
  },

  async getOfficialResults(poolId) {
    const results = await prisma.officialResult.findMany({ where: { poolId } });
    const map = new Map<string, MatchResult>();
    for (const r of results) {
      map.set(r.matchId, {
        matchId: r.matchId, homeGoals: r.homeGoals, awayGoals: r.awayGoals,
        homePenalties: r.homePenalties, awayPenalties: r.awayPenalties,
      });
    }
    return map;
  },

  async getGroupOverrides(poolId) {
    const overrides = await prisma.override.findMany({
      where: { poolId, type: 'GROUP_STANDING', supersededById: null },
    });
    const map = new Map<string, GroupOverridePayload>();
    for (const o of overrides) {
      if (o.targetGroup) map.set(o.targetGroup, o.payload as any);
    }
    return map;
  },

  async getBestThirdsOverride(poolId) {
    const override = await prisma.override.findFirst({
      where: { poolId, type: 'BEST_THIRDS', supersededById: null },
    });
    return override ? (override.payload as any as BestThirdsResult) : null;
  },

  async getParticipantIds(poolId) {
    const adminMembers = await prisma.poolMembership.findMany({
      where: { poolId, role: 'ADMIN' },
      select: { userId: true },
    });
    const adminIds = adminMembers.map(m => m.userId);

    const entries = await prisma.entry.findMany({
      where: { poolId, userId: { notIn: adminIds } },
      select: { id: true, userId: true },
    });
    return entries.map(e => `${e.id}::${e.userId}`);
  },

  async getParticipantPredictions(poolId, participantKey) {
    const [entryId, userId] = participantKey.includes('::')
      ? participantKey.split('::')
      : [undefined, participantKey];

    const predictions = await prisma.prediction.findMany({
      where: {
        poolId,
        ...(entryId ? { entryId } : { userId }),
        status: 'VALID',
      },
    });
    const map = new Map<string, PredictionInput>();
    for (const p of predictions) {
      if (p.homeGoals != null && p.awayGoals != null) {
        map.set(p.matchId, {
          matchId: p.matchId, homeGoals: p.homeGoals, awayGoals: p.awayGoals,
          homePenalties: p.homePenalties, awayPenalties: p.awayPenalties,
        });
      }
    }
    return map;
  },

  async getParticipantTopScorer(poolId, userId) {
    const ts = await prisma.topScorerPrediction.findFirst({
      where: { poolId, userId },
    });
    return ts ? { playerName: ts.playerName, goals: ts.goals } : null;
  },

  async getActualTopScorer(poolId) {
    const data = await prisma.officialTournamentData.findUnique({ where: { poolId } });
    if (!data?.topScorerName || !data.topScorerGoals) return null;
    return { playerName: data.topScorerName, goals: data.topScorerGoals };
  },

  async getActualGoalAverage(poolId) {
    const data = await prisma.officialTournamentData.findUnique({ where: { poolId } });
    if (!data?.realGoalAverage) return null;
    return Number(data.realGoalAverage);
  },

  async getParticipantBracketSlots(poolId, contextKey) {
    const slots = await prisma.bracketSlot.findMany({
      where: { poolId, contextType: 'PARTICIPANT', contextKey },
    });
    return slots.map(s => ({
      slotId: s.slotId,
      round: s.round as any,
      homeTeamId: s.homeTeamId,
      awayTeamId: s.awayTeamId,
      winnerTeamId: s.winnerTeamId,
      loserTeamId: s.loserTeamId,
    }));
  },
  
async getOfficialBracketSlots(poolId: string): Promise<BracketSlotData[]> {
    const slots = await prisma.bracketSlot.findMany({
      where: { poolId, contextType: 'OFFICIAL', contextKey: 'OFFICIAL' },
    });
    return slots.map(s => ({
      slotId: s.slotId,
      round: s.round as any,
      homeTeamId: s.homeTeamId,
      awayTeamId: s.awayTeamId,
      winnerTeamId: s.winnerTeamId,
      loserTeamId: s.loserTeamId,
    }));
  },

  fifaMatrixLookup(key) {
    const row = lookupFIFAMatrix(key);
    if (!row) return null;
    const hosts = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L'];
    const result: Record<string, string> = {};
    hosts.forEach((host, i) => { result[host] = row[i]; });
    return result;
  },
};

// ─── Persister ───────────────────────────────────────────

export const dataPersister: RecalcPersister = {
  async persistGroupStandings(poolId, ctxKey, standings) {
    const contextType = ctxKey === OFFICIAL_CONTEXT_KEY ? 'OFFICIAL' : 'PARTICIPANT';
    for (const s of standings) {
      await prisma.groupStanding.upsert({
        where: { poolId_contextKey_groupLetter: { poolId, contextKey: ctxKey, groupLetter: s.groupLetter } },
        update: { positions: s.positions as any, hasOverride: s.hasOverride, calculatedAt: new Date(), contextType },
        create: { poolId, contextType, contextKey: ctxKey, groupLetter: s.groupLetter,
          positions: s.positions as any, hasOverride: s.hasOverride },
      });
    }
  },

  async persistBestThirds(poolId, ctxKey, result) {
    const contextType = ctxKey === OFFICIAL_CONTEXT_KEY ? 'OFFICIAL' : 'PARTICIPANT';
    await prisma.bestThirds.upsert({
      where: { poolId_contextKey: { poolId, contextKey: ctxKey } },
      update: { ranking: result.ranking as any, combinationKey: result.combinationKey,
        hasOverride: result.hasOverride, calculatedAt: new Date(), contextType },
      create: { poolId, contextType, contextKey: ctxKey,
        ranking: result.ranking as any, combinationKey: result.combinationKey,
        hasOverride: result.hasOverride },
    });
  },

  async persistBracketSlots(poolId, ctxKey, slots) {
    const contextType = ctxKey === OFFICIAL_CONTEXT_KEY ? 'OFFICIAL' : 'PARTICIPANT';
    for (const s of slots) {
      await prisma.bracketSlot.upsert({
        where: { poolId_contextKey_slotId: { poolId, contextKey: ctxKey, slotId: s.slotId } },
        update: { round: s.round as any, homeTeamId: s.homeTeamId, awayTeamId: s.awayTeamId,
          winnerTeamId: s.winnerTeamId, loserTeamId: s.loserTeamId,
          calculatedAt: new Date(), contextType },
        create: { poolId, contextType, contextKey: ctxKey, slotId: s.slotId,
          round: s.round as any, homeTeamId: s.homeTeamId, awayTeamId: s.awayTeamId,
          winnerTeamId: s.winnerTeamId, loserTeamId: s.loserTeamId },
      });

      // If official context, update the matches table with resolved team IDs
      if (ctxKey === OFFICIAL_CONTEXT_KEY && s.slotId) {
        await prisma.match.updateMany({
          where: { poolId, slotId: s.slotId },
          data: {
            homeTeamId: s.homeTeamId,
            awayTeamId: s.awayTeamId,
          },
        });
      }
    }
  },

  async persistScoreBreakdowns(poolId, userId, result) {
    try {
      await prisma.scoreBreakdown.deleteMany({ where: { poolId, userId } });
    } catch {}

    const data = result.scores.map(s => ({
      poolId, userId,
      conceptId: s.conceptId,
      breakdownKey: breakdownKey(s.matchId, s.slotId),
      matchId: s.matchId ?? null,
      slotId: s.slotId ?? null,
      pointsAwarded: s.pointsAwarded,
      explanation: s.explanation,
    }));
    if (data.length > 0) {
      await prisma.scoreBreakdown.createMany({ data, skipDuplicates: true });
    }
  },

  async persistRankings(poolId, rankings) {
    for (const r of rankings) {
      const key = r.userId;
      await prisma.ranking.upsert({
        where: { poolId_userId: { poolId, userId: key } },
        update: {
          totalPoints: r.totalPoints, phase1Points: r.phase1Points, phase2Points: r.phase2Points,
          position: r.position, conceptTotals: r.conceptTotals as any,
          matchesPredicted: r.matchesPredicted, calculatedAt: new Date(),
        },
        create: {
          poolId, userId: key,
          totalPoints: r.totalPoints, phase1Points: r.phase1Points, phase2Points: r.phase2Points,
          position: r.position, conceptTotals: r.conceptTotals as any,
          matchesPredicted: r.matchesPredicted,
        },
      });
    }
  },
};
