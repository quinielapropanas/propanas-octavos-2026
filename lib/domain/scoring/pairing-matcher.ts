// ═══════════════════════════════════════════════════════════
// Pairing Matcher — D19 reversible team matching
// ═══════════════════════════════════════════════════════════

import type { MatchResult, PairingMatchOutput } from '../types';

/**
 * Checks if predicted pairing matches real pairing.
 * Order-independent: {ARG,BRA} matches {BRA,ARG} (D19).
 * Maps goals by team_id, not visual position.
 */
export function matchPairing(
  predHomeTeamId: string | null,
  predAwayTeamId: string | null,
  realHomeTeamId: string | null,
  realAwayTeamId: string | null,
  predResult: MatchResult,
  realResult: MatchResult,
): PairingMatchOutput {
  if (!predHomeTeamId || !predAwayTeamId || !realHomeTeamId || !realAwayTeamId) {
    return { matches: false };
  }

  const predPair = new Set([predHomeTeamId, predAwayTeamId]);
  const realPair = new Set([realHomeTeamId, realAwayTeamId]);

  if (predPair.size !== 2 || realPair.size !== 2) return { matches: false };
  if (!realPair.has(predHomeTeamId) || !realPair.has(predAwayTeamId)) return { matches: false };

  const predGoalsByTeam = new Map<string, number>([
    [predHomeTeamId, predResult.homeGoals], [predAwayTeamId, predResult.awayGoals],
  ]);
  const realGoalsByTeam = new Map<string, number>([
    [realHomeTeamId, realResult.homeGoals], [realAwayTeamId, realResult.awayGoals],
  ]);
  const predPenaltiesByTeam = new Map<string, number | null>([
    [predHomeTeamId, predResult.homePenalties ?? null],
    [predAwayTeamId, predResult.awayPenalties ?? null],
  ]);
  const realPenaltiesByTeam = new Map<string, number | null>([
    [realHomeTeamId, realResult.homePenalties ?? null],
    [realAwayTeamId, realResult.awayPenalties ?? null],
  ]);

  return { matches: true, predGoalsByTeam, realGoalsByTeam, predPenaltiesByTeam, realPenaltiesByTeam };
}

// ═══════════════════════════════════════════════════════════
// Exclusion Guard — D3 mutual exclusion concepts 2/3/4
// ═══════════════════════════════════════════════════════════

import type { ScoringConceptConfig } from '../types';
import { CONCEPT } from '../types';
export function validateExclusionRules(concepts: ScoringConceptConfig[]): string | null {
  return null;
}

export function shouldSkipConcepts3and4(
  concepts: ScoringConceptConfig[],
  concept2Scored: boolean,
): boolean {
  const c2Active = concepts.find(c => c.conceptId === CONCEPT.MARCADOR_ACERTADO)?.isActive ?? false;
  return c2Active && concept2Scored;
}
