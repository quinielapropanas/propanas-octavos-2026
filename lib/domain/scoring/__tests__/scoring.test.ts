// ═══════════════════════════════════════════════════════════
// Scoring Domain Tests
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { matchPairing, validateExclusionRules, shouldSkipConcepts3and4 } from '../pairing-matcher';
import { evaluateMatchConcepts } from '../match-scoring';
import { evaluateGroupConcepts, evaluateAdvanceConcepts, evaluateGlobalConcepts, calculateGoalAverage } from '../scoring-modules';
import { buildRanking } from '../score-evaluator';
import { CONCEPT } from '../../types';
import {
  DEFAULT_CONFIG, CONFIG_WITH_MARCADOR, OFFICIAL_SLOTS, PARTICIPANT_SLOTS,
} from '../../__fixtures__/sample-data';

// ─── Pairing Matcher (D19) ───────────────────────────────

describe('PairingMatcher', () => {
  it('matches same order', () => {
    const r = matchPairing('arg', 'bra', 'arg', 'bra',
      { matchId: 'x', homeGoals: 2, awayGoals: 1 },
      { matchId: 'x', homeGoals: 3, awayGoals: 0 });
    expect(r.matches).toBe(true);
    expect(r.predGoalsByTeam!.get('arg')).toBe(2);
    expect(r.realGoalsByTeam!.get('arg')).toBe(3);
  });

  it('matches reversed order (D19)', () => {
    const r = matchPairing('arg', 'bra', 'bra', 'arg',
      { matchId: 'x', homeGoals: 2, awayGoals: 1 },
      { matchId: 'x', homeGoals: 0, awayGoals: 3 });
    expect(r.matches).toBe(true);
    // arg predicted 2 goals, real 3 (away in real)
    expect(r.predGoalsByTeam!.get('arg')).toBe(2);
    expect(r.realGoalsByTeam!.get('arg')).toBe(3); // mapped correctly from away position
  });

  it('does not match different teams', () => {
    const r = matchPairing('arg', 'bra', 'arg', 'ger',
      { matchId: 'x', homeGoals: 1, awayGoals: 0 },
      { matchId: 'x', homeGoals: 1, awayGoals: 0 });
    expect(r.matches).toBe(false);
  });

  it('does not match when null teams', () => {
    const r = matchPairing(null, 'bra', 'arg', 'bra',
      { matchId: 'x', homeGoals: 1, awayGoals: 0 },
      { matchId: 'x', homeGoals: 1, awayGoals: 0 });
    expect(r.matches).toBe(false);
  });
});

// ─── Exclusion Guard (D3) ────────────────────────────────

describe('ExclusionGuard', () => {
  it('allows 1+3+4 active (2 inactive)', () => {
    expect(validateExclusionRules(DEFAULT_CONFIG.concepts)).toBeNull();
  });

  it('allows 1+2 active (3+4 inactive)', () => {
    expect(validateExclusionRules(CONFIG_WITH_MARCADOR.concepts)).toBeNull();
  });

  it('rejects 2+3 active', () => {
    const bad = DEFAULT_CONFIG.concepts.map(c =>
      c.conceptId === 2 ? { ...c, isActive: true } : c);
    expect(validateExclusionRules(bad)).not.toBeNull();
  });

  it('skips 3/4 when concept 2 scored', () => {
    expect(shouldSkipConcepts3and4(CONFIG_WITH_MARCADOR.concepts, true)).toBe(true);
    expect(shouldSkipConcepts3and4(CONFIG_WITH_MARCADOR.concepts, false)).toBe(false);
    expect(shouldSkipConcepts3and4(DEFAULT_CONFIG.concepts, true)).toBe(false); // c2 inactive
  });
});

// ─── Match Scoring (Concepts 1-4, 14) ────────────────────

describe('MatchScoring', () => {
  const makeInput = (predH: number, predA: number, realH: number, realA: number) => ({
    predGoalsByTeam: new Map([['t1', predH], ['t2', predA]]),
    realGoalsByTeam: new Map([['t1', realH], ['t2', realA]]),
    teamIds: ['t1', 't2'] as [string, string],
  });

  it('concept 1: resultado acertado - home win', () => {
    const scores = evaluateMatchConcepts(makeInput(2, 1, 3, 0), DEFAULT_CONFIG, 'm1');
    const c1 = scores.find(s => s.conceptId === CONCEPT.RESULTADO_ACERTADO)!;
    expect(c1.pointsAwarded).toBe(10); // both predict t1 win
  });

  it('concept 1: resultado acertado - draw', () => {
    const scores = evaluateMatchConcepts(makeInput(1, 1, 0, 0), DEFAULT_CONFIG, 'm1');
    const c1 = scores.find(s => s.conceptId === CONCEPT.RESULTADO_ACERTADO)!;
    expect(c1.pointsAwarded).toBe(10); // both draw
  });

  it('concept 1: resultado wrong', () => {
    const scores = evaluateMatchConcepts(makeInput(2, 1, 0, 1), DEFAULT_CONFIG, 'm1');
    const c1 = scores.find(s => s.conceptId === CONCEPT.RESULTADO_ACERTADO)!;
    expect(c1.pointsAwarded).toBe(0);
  });

  it('concept 3: goles equipo - one team correct', () => {
    const scores = evaluateMatchConcepts(makeInput(2, 1, 2, 0), DEFAULT_CONFIG, 'm1');
    const c3 = scores.find(s => s.conceptId === CONCEPT.GOLES_POR_EQUIPO)!;
    expect(c3.pointsAwarded).toBe(3); // t1 goals match
  });

  it('concept 4: diferencia correcta (absolute)', () => {
    const scores = evaluateMatchConcepts(makeInput(2, 1, 0, 1), DEFAULT_CONFIG, 'm1');
    const c4 = scores.find(s => s.conceptId === CONCEPT.DIFERENCIA_GOLES)!;
    expect(c4.pointsAwarded).toBe(4); // |2-1|=1 = |0-1|=1
  });

  it('concept 4: diferencia with non-absolute', () => {
    const cfg = { ...DEFAULT_CONFIG, absoluteGoalDifference: false };
    const scores = evaluateMatchConcepts(makeInput(2, 1, 0, 1), cfg, 'm1');
    const c4 = scores.find(s => s.conceptId === CONCEPT.DIFERENCIA_GOLES)!;
    expect(c4.pointsAwarded).toBe(0); // +1 ≠ -1
  });

  it('concept 2: marcador exacto with exclusion', () => {
    const scores = evaluateMatchConcepts(makeInput(2, 1, 2, 1), CONFIG_WITH_MARCADOR, 'm1');
    const c2 = scores.find(s => s.conceptId === CONCEPT.MARCADOR_ACERTADO)!;
    expect(c2.pointsAwarded).toBe(10);
    // concepts 3 and 4 should not appear (inactive in this config)
    expect(scores.find(s => s.conceptId === CONCEPT.GOLES_POR_EQUIPO)).toBeUndefined();
    expect(scores.find(s => s.conceptId === CONCEPT.DIFERENCIA_GOLES)).toBeUndefined();
  });

  it('concept 14: goleada', () => {
    const cfg = { ...DEFAULT_CONFIG, concepts: DEFAULT_CONFIG.concepts.map(c =>
      c.conceptId === 14 ? { ...c, isActive: true } : c) };
    const scores = evaluateMatchConcepts(makeInput(5, 0, 6, 1), cfg, 'm1');
    const c14 = scores.find(s => s.conceptId === CONCEPT.GOLEADA_ESCANDALOSA)!;
    expect(c14.pointsAwarded).toBe(5); // both diffs > 4
  });

  it('concept 14: no goleada', () => {
    const cfg = { ...DEFAULT_CONFIG, concepts: DEFAULT_CONFIG.concepts.map(c =>
      c.conceptId === 14 ? { ...c, isActive: true } : c) };
    const scores = evaluateMatchConcepts(makeInput(2, 0, 3, 0), cfg, 'm1');
    const c14 = scores.find(s => s.conceptId === CONCEPT.GOLEADA_ESCANDALOSA)!;
    expect(c14.pointsAwarded).toBe(0);
  });
});

// ─── Group Scoring (Concepts 5-6) ────────────────────────

describe('GroupScoring', () => {
  const officialStanding = {
    groupLetter: 'A', hasOverride: false,
    positions: [
      { teamId: 'mex', position: 1, played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 7, goalsAgainst: 1, goalDifference: 6, points: 9, fairPlayScore: 0, tiebreakExplanation: '' },
      { teamId: 'kor', position: 2, played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 3, goalsAgainst: 4, goalDifference: -1, points: 4, fairPlayScore: 0, tiebreakExplanation: '' },
      { teamId: 'rsa', position: 3, played: 3, won: 1, drawn: 0, lost: 2, goalsFor: 1, goalsAgainst: 4, goalDifference: -3, points: 3, fairPlayScore: 0, tiebreakExplanation: '' },
      { teamId: 'cze', position: 4, played: 3, won: 0, drawn: 1, lost: 2, goalsFor: 2, goalsAgainst: 4, goalDifference: -2, points: 1, fairPlayScore: 0, tiebreakExplanation: '' },
    ],
  };

  it('concept 5: clasificación acertada', () => {
    const participant = { ...officialStanding }; // same standings = perfect prediction
    const scores = evaluateGroupConcepts(participant, officialStanding, DEFAULT_CONFIG);
    const c5s = scores.filter(s => s.conceptId === CONCEPT.CLASIFICACION_SEGUNDA_FASE);
    const correct = c5s.filter(s => s.pointsAwarded > 0);
    expect(correct).toHaveLength(2); // MEX and KOR classified
  });

  it('concept 6: posición correcta', () => {
    const participant = { ...officialStanding };
    const scores = evaluateGroupConcepts(participant, officialStanding, DEFAULT_CONFIG);
    const c6s = scores.filter(s => s.conceptId === CONCEPT.POSICION_CORRECTA);
    const correct = c6s.filter(s => s.pointsAwarded > 0);
    expect(correct).toHaveLength(4); // all 4 positions correct
  });
});

// ─── Advance Scoring (Concepts 7-13, G1) ─────────────────

describe('AdvanceScoring', () => {
  it('concept 13: campeón acertado', () => {
    const participant = [{ slotId: 'F-01', round: 'FINAL' as const, homeTeamId: 'fra', awayTeamId: 'arg', winnerTeamId: 'fra', loserTeamId: 'arg' }];
    const official = [{ slotId: 'F-01', round: 'FINAL' as const, homeTeamId: 'arg', awayTeamId: 'fra', winnerTeamId: 'fra', loserTeamId: 'arg' }];
    const scores = evaluateAdvanceConcepts(participant, official, DEFAULT_CONFIG);
    const campeon = scores.find(s => s.conceptId === CONCEPT.CAMPEON);
    expect(campeon?.pointsAwarded).toBe(40);
  });

  it('concept 12: subcampeón = F-01 loser (G1)', () => {
    const scores = evaluateAdvanceConcepts(PARTICIPANT_SLOTS, OFFICIAL_SLOTS, DEFAULT_CONFIG);
    const sub = scores.find(s => s.conceptId === CONCEPT.SUBCAMPEON);
    // Official: arg loses final. Participant: fra loses final. Not same → 0
    expect(sub?.pointsAwarded).toBe(0);
  });

  it('concept 11: tercer lugar = 3RD-01 winner (G1)', () => {
    const scores = evaluateAdvanceConcepts(PARTICIPANT_SLOTS, OFFICIAL_SLOTS, DEFAULT_CONFIG);
    const third = scores.find(s => s.conceptId === CONCEPT.TERCER_LUGAR);
    // Both predict GER wins 3RD-01
    expect(third?.pointsAwarded).toBe(20);
  });
});

// ─── Global Scoring (Concepts 15-17) ─────────────────────

describe('GlobalScoring', () => {
  it('concept 15: goleador name match', () => {
    const scores = evaluateGlobalConcepts(
      { playerName: 'Mbappé', goals: 7 },
      { playerName: 'Mbappé', goals: 8 },
      null, null, DEFAULT_CONFIG);
    const c15 = scores.find(s => s.conceptId === CONCEPT.GOLEADOR_NOMBRE);
    expect(c15?.pointsAwarded).toBe(10);
  });

  it('concept 15: name normalization (accents, case)', () => {
    const scores = evaluateGlobalConcepts(
      { playerName: 'MBAPPE', goals: 7 },
      { playerName: 'Mbappé', goals: 8 },
      null, null, DEFAULT_CONFIG);
    expect(scores.find(s => s.conceptId === CONCEPT.GOLEADOR_NOMBRE)?.pointsAwarded).toBe(10);
  });

  it('concept 16: goles exactos', () => {
    const scores = evaluateGlobalConcepts(
      { playerName: 'X', goals: 8 },
      { playerName: 'Y', goals: 8 },
      null, null, DEFAULT_CONFIG);
    expect(scores.find(s => s.conceptId === CONCEPT.GOLEADOR_GOLES)?.pointsAwarded).toBe(10);
  });

  it('concept 17: gol promedio within 5% → full points', () => {
    const scores = evaluateGlobalConcepts(null, null, 2.7, 2.75, DEFAULT_CONFIG);
    const c17 = scores.find(s => s.conceptId === CONCEPT.GOL_PROMEDIO);
    expect(c17?.pointsAwarded).toBe(20); // diff ~1.8% < 5%
  });

  it('concept 17: gol promedio 10-20% → 50% points', () => {
    const scores = evaluateGlobalConcepts(null, null, 3.2, 2.5, DEFAULT_CONFIG);
    const c17 = scores.find(s => s.conceptId === CONCEPT.GOL_PROMEDIO);
    // diff = 0.7/2.5 = 28% → outside 20% band → 25% of 20 = 5pts
    expect(c17?.pointsAwarded).toBe(5);
  });

  it('calculateGoalAverage: D4 over completed only', () => {
    const avg = calculateGoalAverage([
      { homeGoals: 2, awayGoals: 1 }, // 3
      { homeGoals: 0, awayGoals: 0 }, // 0
      { homeGoals: 3, awayGoals: 2 }, // 5
    ]);
    expect(avg).toBeCloseTo(8 / 3); // 2.667, NOT divided by 104
  });

  it('calculateGoalAverage: empty → null', () => {
    expect(calculateGoalAverage([])).toBeNull();
  });
});

// ─── Ranking Builder ─────────────────────────────────────

describe('RankingBuilder', () => {
  it('sorts by total points descending', () => {
    const ranking = buildRanking([
      { userId: 'u1', scores: [], totalPoints: 50, phase1Points: 30, phase2Points: 20 },
      { userId: 'u2', scores: [], totalPoints: 80, phase1Points: 40, phase2Points: 40 },
      { userId: 'u3', scores: [], totalPoints: 65, phase1Points: 35, phase2Points: 30 },
    ]);
    expect(ranking[0].userId).toBe('u2');
    expect(ranking[0].position).toBe(1);
    expect(ranking[1].userId).toBe('u3');
    expect(ranking[1].position).toBe(2);
    expect(ranking[2].userId).toBe('u1');
    expect(ranking[2].position).toBe(3);
  });

  it('handles ties (same position)', () => {
    const ranking = buildRanking([
      { userId: 'u1', scores: [], totalPoints: 50, phase1Points: 30, phase2Points: 20 },
      { userId: 'u2', scores: [], totalPoints: 50, phase1Points: 25, phase2Points: 25 },
      { userId: 'u3', scores: [], totalPoints: 40, phase1Points: 20, phase2Points: 20 },
    ]);
    expect(ranking[0].position).toBe(1);
    expect(ranking[1].position).toBe(1); // tied
    expect(ranking[2].position).toBe(3); // skips 2
  });

  it('aggregates concept totals', () => {
    const ranking = buildRanking([{
      userId: 'u1', totalPoints: 30, phase1Points: 20, phase2Points: 10,
      scores: [
        { conceptId: 1, pointsAwarded: 10, explanation: '' },
        { conceptId: 1, pointsAwarded: 10, explanation: '' },
        { conceptId: 3, pointsAwarded: 3, explanation: '' },
        { conceptId: 5, pointsAwarded: 15, explanation: '' },
      ],
    }]);
    expect(ranking[0].conceptTotals[1]).toBe(20);
    expect(ranking[0].conceptTotals[3]).toBe(3);
    expect(ranking[0].conceptTotals[5]).toBe(15);
  });
});
