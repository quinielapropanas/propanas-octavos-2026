// ═══════════════════════════════════════════════════════════
// Score Evaluator — Orchestrator for all 17 concepts
// ═══════════════════════════════════════════════════════════

import type {
  ConceptScore, ScoringConfig, MatchData, MatchResult,
  BracketSlotData, GroupStandingResult, TopScorerPredictionData,
  TopScorerActual, ScoreBreakdownResult, PredictionInput,
  RankingEntry,
} from '../types';
import { CONCEPT } from '../types';
import { matchPairing } from './pairing-matcher';
import { evaluateMatchConcepts } from './match-scoring';
import { evaluateGroupConcepts, evaluateAdvanceConcepts, evaluateGlobalConcepts, calculateGoalAverage } from './scoring-modules';

export interface EvaluatorInput {
  userId: string;
  config: ScoringConfig;
  predictions: Map<string, PredictionInput>;
  participantGroupStandings: GroupStandingResult[];
  participantBracketSlots: BracketSlotData[];
  participantTopScorer: TopScorerPredictionData | null;
  officialResults: Map<string, MatchResult>;
  officialGroupStandings: GroupStandingResult[];
  officialBracketSlots: BracketSlotData[];
  actualTopScorer: TopScorerActual | null;
  actualGoalAverage: number | null;
  matches: MatchData[];
}

export function evaluateAllConcepts(input: EvaluatorInput): ScoreBreakdownResult {
  const allScores: ConceptScore[] = [];
  const matchMap = new Map(input.matches.map(m => [m.id, m]));

  // Phase 1: Match concepts (1-4, 14)
  for (const [matchId, officialResult] of input.officialResults) {
    const prediction = input.predictions.get(matchId);
    if (!prediction) continue;
    const match = matchMap.get(matchId);
    if (!match) continue;

    const isKnockout = match.phase !== 'GROUP';

if (isKnockout) {
      if (!input.config.knockoutMatchScoringEnabled) continue;

      const pSlot = input.participantBracketSlots.find(s => s.slotId === match.slotId);
      const oSlot = input.officialBracketSlots.find(s => s.slotId === match.slotId);
      if (!pSlot || !oSlot) continue;
      if (!oSlot.homeTeamId || !oSlot.awayTeamId) continue;

      const predHomeTeamId = pSlot.homeTeamId;
      const predAwayTeamId = pSlot.awayTeamId;

      if (!predHomeTeamId || !predAwayTeamId) continue;

      // Check if teams match in THIS slot first
      const predTeams = new Set([predHomeTeamId, predAwayTeamId]);
      const realTeams = new Set([oSlot.homeTeamId, oSlot.awayTeamId]);
      let teamsMatch = predTeams.size === 2 && realTeams.size === 2
        && realTeams.has(predHomeTeamId) && realTeams.has(predAwayTeamId);

      // If teams don't match in same slot, search for same pair in ANY slot of the same round
      let matchedOfficialResult = officialResult;
      let matchedOSlot = oSlot;
      if (!teamsMatch) {
        const sameRoundOfficialSlots = input.officialBracketSlots.filter(s => s.round === oSlot.round);
        for (const altSlot of sameRoundOfficialSlots) {
          if (!altSlot.homeTeamId || !altSlot.awayTeamId) continue;
          const altTeams = new Set([altSlot.homeTeamId, altSlot.awayTeamId]);
          if (altTeams.has(predHomeTeamId) && altTeams.has(predAwayTeamId)) {
            // Found the same pair in another slot — get its official result
            const altMatch = input.matches.find(m => m.slotId === altSlot.slotId && m.phase !== 'GROUP');
            if (altMatch) {
              const altResult = input.officialResults.get(altMatch.id);
              if (altResult) {
                teamsMatch = true;
                matchedOfficialResult = altResult;
                matchedOSlot = altSlot;
                break;
              }
            }
          }
        }
      }

      if (!teamsMatch) {
        allScores.push({
          conceptId: CONCEPT.RESULTADO_ACERTADO, matchId,
          pointsAwarded: 0,
          explanation: `Emparejamiento no coincide en ${match.slotId}`,
        });
        continue;
      }

      // Map goals by teamId (order-independent)
      const predGoalsByTeam = new Map<string, number>([
        [predHomeTeamId, prediction.homeGoals],
        [predAwayTeamId, prediction.awayGoals],
      ]);

      const realGoalsByTeam = new Map<string, number>([
        [matchedOSlot.homeTeamId!, matchedOfficialResult.homeGoals],
        [matchedOSlot.awayTeamId!, matchedOfficialResult.awayGoals],
      ]);

      const predPenaltiesByTeam = new Map<string, number | null>([
        [predHomeTeamId, prediction.homePenalties ?? null],
        [predAwayTeamId, prediction.awayPenalties ?? null],
      ]);
      const realPenaltiesByTeam = new Map<string, number | null>([
        [matchedOSlot.homeTeamId!, matchedOfficialResult.homePenalties ?? null],
        [matchedOSlot.awayTeamId!, matchedOfficialResult.awayPenalties ?? null],
      ]);

      allScores.push(...evaluateMatchConcepts({
        predGoalsByTeam,
        realGoalsByTeam,
        teamIds: [matchedOSlot.homeTeamId!, matchedOSlot.awayTeamId!],
        predPenaltiesByTeam,
        realPenaltiesByTeam,
      }, input.config, matchId));
    } else {
      // Group: direct evaluation
      if (!match.homeTeamId || !match.awayTeamId) continue;
      allScores.push(...evaluateMatchConcepts({
        predGoalsByTeam: new Map([[match.homeTeamId, prediction.homeGoals], [match.awayTeamId, prediction.awayGoals]]),
        realGoalsByTeam: new Map([[match.homeTeamId, officialResult.homeGoals], [match.awayTeamId, officialResult.awayGoals]]),
        teamIds: [match.homeTeamId, match.awayTeamId],
      }, input.config, matchId));
    }
	}

// Phase 2: Group concepts (5-6) — only when ALL 6 matches in a group have official results
  // Build sets of classified third-place teams
  const officialClassifiedThirds = new Set<string>();
  const participantClassifiedThirds = new Set<string>();

  // Extract official best thirds from bracket slots (R32 away teams that came from 3rd place)
  for (const slot of input.officialBracketSlots) {
    if (slot.round === 'R32' && slot.awayTeamId) {
      // Check if this away team is a 3rd place team (not in top 2 of any group)
      const isTop2 = input.officialGroupStandings.some(gs =>
        gs.positions.some(p => p.teamId === slot.awayTeamId && p.position <= 2)
      );
      if (!isTop2) officialClassifiedThirds.add(slot.awayTeamId);
    }
  }

  for (const slot of input.participantBracketSlots) {
    if (slot.round === 'R32' && slot.awayTeamId) {
      const isTop2 = input.participantGroupStandings.some(gs =>
        gs.positions.some(p => p.teamId === slot.awayTeamId && p.position <= 2)
      );
      if (!isTop2) participantClassifiedThirds.add(slot.awayTeamId);
    }
  }

  for (const official of input.officialGroupStandings) {
    const groupMatches = input.matches.filter(
      m => m.phase === 'GROUP' && m.groupLetter === official.groupLetter
    );
    const groupResultCount = groupMatches.filter(m => input.officialResults.has(m.id)).length;

    // Only evaluate classification when ALL 6 group matches are played
    if (groupResultCount < 6) continue;

    const participant = input.participantGroupStandings.find(s => s.groupLetter === official.groupLetter);
    if (participant) {
      allScores.push(...evaluateGroupConcepts(
        participant, official, input.config,
        officialClassifiedThirds, participantClassifiedThirds,
      ));
    }
  }

  // Phase 3: Advance concepts (7-13) — only evaluate slots that have official results
  // Filter official bracket slots to only those with a winner determined
  const resolvedOfficialSlots = input.officialBracketSlots.filter(s => s.winnerTeamId != null);
  if (resolvedOfficialSlots.length > 0) {
    allScores.push(...evaluateAdvanceConcepts(input.participantBracketSlots, resolvedOfficialSlots, input.config));
  }
  
  // Phase 4: Global concepts (15-17)
  const participantAvg = calculateGoalAverage(
    Array.from(input.predictions.values()).map(p => ({ homeGoals: p.homeGoals, awayGoals: p.awayGoals }))
  );
  allScores.push(...evaluateGlobalConcepts(
    input.participantTopScorer, input.actualTopScorer,
    participantAvg, input.actualGoalAverage, input.config,
  ));

  // Aggregate
  const totalPoints = allScores.reduce((s, c) => s + c.pointsAwarded, 0);
  const groupMatchIds = new Set(input.matches.filter(m => m.phase === 'GROUP').map(m => m.id));
  const phase1 = allScores.filter(s => s.matchId && groupMatchIds.has(s.matchId)).reduce((s, c) => s + c.pointsAwarded, 0);

  return {
    userId: input.userId, scores: allScores,
    totalPoints, phase1Points: phase1, phase2Points: totalPoints - phase1,
  };
}

// ═══════════════════════════════════════════════════════════
// Ranking Builder
// ═══════════════════════════════════════════════════════════

export function buildRanking(
  breakdowns: ScoreBreakdownResult[],
  entryNames?: Map<string, string>,
): RankingEntry[] {
  const entries: RankingEntry[] = breakdowns.map(bd => {
    const conceptTotals: Record<number, number> = {};
    for (const s of bd.scores) {
      conceptTotals[s.conceptId] = (conceptTotals[s.conceptId] || 0) + s.pointsAwarded;
    }
    return {
      userId: bd.userId, totalPoints: bd.totalPoints,
      phase1Points: bd.phase1Points, phase2Points: bd.phase2Points,
      position: 0, conceptTotals, matchesPredicted: 0,
    };
  });

  // Sort: points desc, then alphabetical by entry name
  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    const nameA = entryNames?.get(a.userId) ?? a.userId;
    const nameB = entryNames?.get(b.userId) ?? b.userId;
    return nameA.localeCompare(nameB);
  });

 // Block positions: same points = same position, next block = next position
  let currentPosition = 0;
  let previousPoints: number | null = null;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].totalPoints !== previousPoints) {
      currentPosition += 1;
      previousPoints = entries[i].totalPoints;
    }
    entries[i].position = currentPosition;
  }
  return entries;
}