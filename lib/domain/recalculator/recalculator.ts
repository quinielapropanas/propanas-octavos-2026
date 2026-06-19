// ═══════════════════════════════════════════════════════════
// Recalculator — Incremental (D8) + Full Rebuild
// Pure orchestration logic. DB access injected via interface.
// ═══════════════════════════════════════════════════════════

import type {
  MatchData, MatchResult, ScoringConfig, GroupStandingResult,
  BestThirdsResult, BracketSlotData, ScoreBreakdownResult,
  RankingEntry, PredictionInput, TopScorerPredictionData,
  TopScorerActual, TeamData, RecalcScope, GroupOverridePayload,
} from '../types';
import { CONCEPT } from '../types';
import { calculateGroupStandings } from '../tournament/group-calculator';
import { rankBestThirds } from '../tournament/best-thirds';
import { resolveR32Slots, propagateWinners, BRACKET_STRUCTURE } from '../tournament/bracket-resolver';
import { evaluateAllConcepts, buildRanking } from '../scoring/score-evaluator';
import type { EvaluatorInput } from '../scoring/score-evaluator';
import { prisma } from '../../db/client';

// ─── Data Provider Interface ─────────────────────────────
// Injected by the app layer to decouple domain from DB.

export interface RecalcDataProvider {
  getPoolConfig(poolId: string): Promise<ScoringConfig>;
  getTeams(poolId: string): Promise<TeamData[]>;
  getAllMatches(poolId: string): Promise<MatchData[]>;
  getOfficialResults(poolId: string): Promise<Map<string, MatchResult>>;
  getGroupOverrides(poolId: string): Promise<Map<string, GroupOverridePayload>>;
  getBestThirdsOverride(poolId: string): Promise<BestThirdsResult | null>;
  getParticipantIds(poolId: string): Promise<string[]>;
  getParticipantPredictions(poolId: string, userId: string): Promise<Map<string, PredictionInput>>;
  getParticipantTopScorer(poolId: string, userId: string): Promise<TopScorerPredictionData | null>;
  getActualTopScorer(poolId: string): Promise<TopScorerActual | null>;
  getActualGoalAverage(poolId: string): Promise<number | null>;
  getParticipantBracketSlots(poolId: string, contextKey: string): Promise<BracketSlotData[]>;
  getOfficialBracketSlots(poolId: string): Promise<BracketSlotData[]>;
  fifaMatrixLookup(combinationKey: string): Record<string, string> | null;
}

export interface RecalcPersister {
  persistGroupStandings(poolId: string, contextKey: string, standings: GroupStandingResult[]): Promise<void>;
  persistBestThirds(poolId: string, contextKey: string, result: BestThirdsResult): Promise<void>;
  persistBracketSlots(poolId: string, contextKey: string, slots: BracketSlotData[]): Promise<void>;
  persistScoreBreakdowns(poolId: string, userId: string, scores: ScoreBreakdownResult): Promise<void>;
  persistRankings(poolId: string, rankings: RankingEntry[]): Promise<void>;
}

export interface RecalcResult {
  groupsRecalculated: string[];
  bracketSlotsUpdated: number;
  participantsScored: number;
  elapsedMs: number;
}

const OFFICIAL_KEY = '__OFFICIAL__';

// ─── Incremental Recalculation ───────────────────────────

/**
 * Recalculates only what's affected by a single match result.
 * Idempotent: running twice produces same output (D8).
 */
export async function incrementalRecalc(
  poolId: string,
  matchId: string,
  provider: RecalcDataProvider,
  persister: RecalcPersister,
): Promise<RecalcResult> {
  const start = Date.now();
  const allMatches = await provider.getAllMatches(poolId);
  const match = allMatches.find(m => m.id === matchId);
  if (!match) throw new Error(`Match ${matchId} not found`);

  const scope = determineRecalcScope(match, allMatches);
  return executeRecalc(poolId, scope, provider, persister, start);
}

/**
 * Full rebuild: recalculates everything from source of truth.
 * Idempotent. Used for auditing, recovery, or after overrides (D8).
 */
export async function fullRebuild(
  poolId: string,
  provider: RecalcDataProvider,
  persister: RecalcPersister,
): Promise<RecalcResult> {
  const start = Date.now();
  const allMatches = await provider.getAllMatches(poolId);

  const scope: RecalcScope = {
    groups: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
    bestThirds: true,
    bracketSlots: BRACKET_STRUCTURE.map(s => s.slotId),
    scoringAll: true,
    conceptIds: Object.values(CONCEPT),
  };

  return executeRecalc(poolId, scope, provider, persister, start);
}

// ─── Scope Determination ─────────────────────────────────

export function determineRecalcScope(match: MatchData, allMatches: MatchData[]): RecalcScope {
  const scope: RecalcScope = {
    groups: [],
    bestThirds: false,
    bracketSlots: [],
    scoringAll: false,
    conceptIds: [],
  };

  if (match.phase === 'GROUP') {
    scope.groups.push(match.groupLetter!);
    scope.bestThirds = true;
    scope.bracketSlots.push(...BRACKET_STRUCTURE.filter(s => s.round === 'R32').map(s => s.slotId));
    scope.conceptIds.push(
      CONCEPT.RESULTADO_ACERTADO, CONCEPT.MARCADOR_ACERTADO,
      CONCEPT.GOLES_POR_EQUIPO, CONCEPT.DIFERENCIA_GOLES,
      CONCEPT.GOLEADA_ESCANDALOSA,
      CONCEPT.CLASIFICACION_SEGUNDA_FASE, CONCEPT.POSICION_CORRECTA,
    );
    scope.scoringAll = true;
  } else {
    scope.bracketSlots.push(match.slotId);
    // Find downstream slots
    const queue = [match.slotId];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const def of BRACKET_STRUCTURE) {
        if ((def.parentSlot1 === current || def.parentSlot2 === current) && !visited.has(def.slotId)) {
          scope.bracketSlots.push(def.slotId);
          queue.push(def.slotId);
        }
      }
    }
    scope.conceptIds.push(
      CONCEPT.RESULTADO_ACERTADO, CONCEPT.MARCADOR_ACERTADO,
      CONCEPT.GOLES_POR_EQUIPO, CONCEPT.DIFERENCIA_GOLES,
      CONCEPT.AVANZA_R16, CONCEPT.AVANZA_QF, CONCEPT.AVANZA_SF,
      CONCEPT.AVANZA_FINAL, CONCEPT.TERCER_LUGAR, CONCEPT.SUBCAMPEON, CONCEPT.CAMPEON,
    );
    scope.scoringAll = true;
  }

  return scope;
}

// ─── Core Execution ──────────────────────────────────────

async function executeRecalc(
  poolId: string,
  scope: RecalcScope,
  provider: RecalcDataProvider,
  persister: RecalcPersister,
  startMs: number,
): Promise<RecalcResult> {
  const [config, teams, allMatches, officialResults, groupOverrides] = await Promise.all([
    provider.getPoolConfig(poolId),
    provider.getTeams(poolId),
    provider.getAllMatches(poolId),
    provider.getOfficialResults(poolId),
    provider.getGroupOverrides(poolId),
  ]);

  // ── Step 1: Recalculate official group standings ──
  const officialStandings: GroupStandingResult[] = [];
  for (const groupLetter of scope.groups) {
    const override = groupOverrides.get(groupLetter) ?? null;
    const standing = calculateGroupStandings(groupLetter, teams, allMatches, officialResults, undefined, override);
    officialStandings.push(standing);
  }

  // If we only recalculated some groups, we still need all 12 for best thirds
  if (scope.bestThirds && scope.groups.length < 12) {
    const allGroups = 'ABCDEFGHIJKL'.split('');
    for (const g of allGroups) {
      if (!scope.groups.includes(g)) {
        const override = groupOverrides.get(g) ?? null;
        officialStandings.push(
          calculateGroupStandings(g, teams, allMatches, officialResults, undefined, override)
        );
      }
    }
  }

  // ── Step 2: Recalculate best thirds ──
  // Use admin-confirmed best thirds if available, otherwise calculate
  let officialBestThirds: BestThirdsResult | null = null;
  if (scope.bestThirds) {
    const overrideThirds = await provider.getBestThirdsOverride(poolId);
    officialBestThirds = overrideThirds ?? rankBestThirds(officialStandings);
  }

// ── Step 3: Recalculate official bracket ──
  let officialBracketSlots: BracketSlotData[] = [];

  // Read admin-confirmed R32 slots (contextKey = 'OFFICIAL')
  const adminR32Slots = await provider.getOfficialBracketSlots(poolId);
  const confirmedR32 = adminR32Slots.filter(s => s.round === 'R32' && s.homeTeamId && s.awayTeamId);

  if (confirmedR32.length >= 16) {
    // Admin confirmed all R32 — propagate winners using official results
    const matchBySlot = new Map<string, string>();
    for (const m of allMatches) {
      if (m.phase !== 'GROUP') matchBySlot.set(m.slotId, m.id);
    }
    officialBracketSlots = propagateWinners(confirmedR32, officialResults, matchBySlot);
  } else if (scope.bracketSlots.length > 0 && officialBestThirds) {
    // No admin R32 — generate from scratch (fallback)
    const r32 = resolveR32Slots(officialStandings, officialBestThirds, provider.fifaMatrixLookup);
    const matchBySlot = new Map<string, string>();
    for (const m of allMatches) {
      if (m.phase !== 'GROUP') matchBySlot.set(m.slotId, m.id);
    }
    officialBracketSlots = propagateWinners(r32, officialResults, matchBySlot);
  }

  // Persist official derived state
  if (officialStandings.length > 0) {
    await persister.persistGroupStandings(poolId, OFFICIAL_KEY,
      officialStandings.filter(s => scope.groups.includes(s.groupLetter)));
  }
  if (officialBestThirds) {
    await persister.persistBestThirds(poolId, OFFICIAL_KEY, officialBestThirds);
  }
  if (officialBracketSlots.length > 0) {
    // Persist R16+ to admin's contextKey so everything stays together
    // Update R32 with winners, persist R16+ as new
    for (const slot of officialBracketSlots) {
      await prisma.bracketSlot.upsert({
        where: { poolId_contextKey_slotId: { poolId, contextKey: 'OFFICIAL', slotId: slot.slotId } },
        update: {
          round: slot.round as any,
          homeTeamId: slot.homeTeamId,
          awayTeamId: slot.awayTeamId,
          winnerTeamId: slot.winnerTeamId,
          loserTeamId: slot.loserTeamId,
          calculatedAt: new Date(),
          contextType: 'OFFICIAL',
        },
        create: {
          poolId, contextType: 'OFFICIAL', contextKey: 'OFFICIAL',
          slotId: slot.slotId, round: slot.round as any,
          homeTeamId: slot.homeTeamId, awayTeamId: slot.awayTeamId,
          winnerTeamId: slot.winnerTeamId, loserTeamId: slot.loserTeamId,
        },
      });

      // Update matches table with resolved team IDs
      await prisma.match.updateMany({
        where: { poolId, slotId: slot.slotId },
        data: { homeTeamId: slot.homeTeamId, awayTeamId: slot.awayTeamId },
      });
    }
  }

  // ── Step 4: Score all participants ──
  let participantsScored = 0;
  if (scope.scoringAll) {
    const participantIds = await provider.getParticipantIds(poolId);
    const [actualTopScorer, actualGoalAvg] = await Promise.all([
      provider.getActualTopScorer(poolId),
      provider.getActualGoalAverage(poolId),
    ]);

    const allBreakdowns: ScoreBreakdownResult[] = [];

   for (const participantKey of participantIds) {
      // Extract entryId and userId from the composite key
      const [entryId, userId] = participantKey.includes('::')
        ? participantKey.split('::')
        : [undefined, participantKey];

      const [predictions, topScorer] = await Promise.all([
        provider.getParticipantPredictions(poolId, participantKey),
        provider.getParticipantTopScorer(poolId, userId),
      ]);

      // Skip participants with no predictions
      if (predictions.size === 0) continue;

      // Use entryId as contextKey for bracket/standings (each entry is independent)
      const contextKey = entryId ?? userId;

      // Build participant's own standings and bracket
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
      const participantR32 = resolveR32Slots(participantStandings, participantThirds, provider.fifaMatrixLookup);
      const matchBySlot = new Map<string, string>();
      for (const m of allMatches) {
        if (m.phase !== 'GROUP') matchBySlot.set(m.slotId, m.id);
      }

      // Build participant knockout results from predictions
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

	// Read ORIGINAL bracket slots BEFORE overwriting (for correct scoring)
      const originalBracketSlots = await provider.getParticipantBracketSlots(poolId, contextKey);

      // Persist participant derived state using entryId as contextKey
      await persister.persistGroupStandings(poolId, contextKey, participantStandings);
      await persister.persistBestThirds(poolId, contextKey, participantThirds);
      // Read existing bracket BEFORE overwriting
      const existingBracket = await provider.getParticipantBracketSlots(poolId, contextKey);

      let bracketForScoring: BracketSlotData[];
      if (existingBracket.length > 0) {
        // Existing bracket has correct teams — propagate winners using participant predictions
        const matchBySlotForScoring = new Map<string, string>();
        for (const m of allMatches) {
          if (m.phase !== 'GROUP') matchBySlotForScoring.set(m.slotId, m.id);
        }
        bracketForScoring = propagateWinners(
          existingBracket.filter(s => s.round === 'R32'),
          participantKnockoutResults,
          matchBySlotForScoring,
        );
      } else {
        await persister.persistBracketSlots(poolId, contextKey, participantBracket);
        bracketForScoring = participantBracket;
      }

      // Evaluate scoring
      const evaluatorInput: EvaluatorInput = {
        userId: contextKey, config,
        predictions,
        participantGroupStandings: participantStandings,
        participantBracketSlots: bracketForScoring,
        participantTopScorer: topScorer,
        officialResults,
        officialGroupStandings: officialStandings,
        officialBracketSlots,
        actualTopScorer,
        actualGoalAverage: actualGoalAvg,
        matches: allMatches,
      };

      const breakdown = evaluateAllConcepts(evaluatorInput);
      allBreakdowns.push(breakdown);

      await persister.persistScoreBreakdowns(poolId, contextKey, breakdown);
      participantsScored++;
    }

    // Build and persist rankings
    const rankings = buildRanking(allBreakdowns);
    await persister.persistRankings(poolId, rankings);
  }

  return {
    groupsRecalculated: scope.groups,
    bracketSlotsUpdated: officialBracketSlots.length,
    participantsScored,
    elapsedMs: Date.now() - startMs,
  };
}
