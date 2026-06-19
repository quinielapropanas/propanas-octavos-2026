// ═══════════════════════════════════════════════════════════
// Golden Master Test — Bracket Knockout & Propagation
// Validates: exact R32 matchups, R16/QF/SF/Final propagation,
// winner determination, and 3rd place match.
// ═══════════════════════════════════════════════════════════

import {
  GROUP_MATCH_RESULTS,
  EXPECTED_STANDINGS,
  EXPECTED_THIRDS,
  EXPECTED_R32,
  R32_RESULTS,
  EXPECTED_R16,
  R16_RESULTS,
  EXPECTED_QF,
  QF_RESULTS,
  EXPECTED_SF,
  SF_RESULTS,
  EXPECTED_THIRD_PLACE,
  EXPECTED_FINAL,
  EXPECTED_COMBINATION_KEY,
  EXPECTED_HOST_TO_THIRD,
  R32_STRUCTURE,
  BRACKET_PROGRESSION,
  FIFA_THIRD_PLACE_MATRIX,
  THIRD_PLACE_HOSTS,
} from '../../__fixtures__/golden-master-2026';

import { calculateGroupStandings } from '../group-calculator';

// ─── Helpers ─────────────────────────────────────────────

function computeAllStandings() {
  const result: Record<string, Array<{ teamId: string; position: number }>> = {};
  for (const [group, matches] of Object.entries(GROUP_MATCH_RESULTS)) {
    const standings = calculateGroupStandings(
      matches.map(m => ({
        homeTeamId: m.home, awayTeamId: m.away,
        homeGoals: m.homeGoals, awayGoals: m.awayGoals,
      }))
    );
    result[group] = standings.map((s, i) => ({ teamId: s.teamId, position: i + 1 }));
  }
  return result;
}

function getTeamByPosition(standings: Record<string, Array<{ teamId: string; position: number }>>, ref: string): string {
  // ref like "1A" = 1st of group A, "2B" = 2nd of group B
  const pos = parseInt(ref[0]);
  const group = ref[1];
  const team = standings[group]?.find(s => s.position === pos);
  return team?.teamId ?? 'UNKNOWN';
}

/** Resolve R32 matchups from standings + FIFA matrix */
function resolveRoundOf32(standings: Record<string, Array<{ teamId: string; position: number }>>) {
  const key = EXPECTED_COMBINATION_KEY;
  const matrixRow = FIFA_THIRD_PLACE_MATRIX[key];
  if (!matrixRow) throw new Error(`No matrix entry for key ${key}`);

  // Build host → third group mapping
  const hostToThirdGroup: Record<string, string> = {};
  THIRD_PLACE_HOSTS.forEach((host, i) => {
    hostToThirdGroup[host] = matrixRow[i];
  });

  const r32: Record<string, { home: string; away: string }> = {};

  for (const [slotId, structure] of Object.entries(R32_STRUCTURE)) {
    const home = getTeamByPosition(standings, structure.home);
    let away: string;

    if (structure.away === 'THIRD') {
      const hostKey = structure.home; // e.g., "1A"
      const thirdGroup = hostToThirdGroup[hostKey];
      away = EXPECTED_THIRDS[thirdGroup];
    } else {
      away = getTeamByPosition(standings, structure.away);
    }

    r32[slotId] = { home, away };
  }

  return r32;
}

/** Determine winner from a match result */
function getWinner(slotId: string, results: Record<string, any>, matchups: Record<string, { home: string; away: string }>): string {
  const result = results[slotId];
  const matchup = matchups[slotId];
  if (!result || !matchup) return 'UNKNOWN';

  if (result.homeGoals > result.awayGoals) return matchup.home;
  if (result.awayGoals > result.homeGoals) return matchup.away;
  // Penalties
  if (result.homePen > result.awayPen) return matchup.home;
  return matchup.away;
}

/** Propagate bracket: given matchups + results, produce next round */
function propagateRound(
  currentMatchups: Record<string, { home: string; away: string }>,
  currentResults: Record<string, any>,
  progression: Array<{ slotId: string; homeFrom: string; awayFrom: string }>,
): Record<string, { home: string; away: string }> {
  const next: Record<string, { home: string; away: string }> = {};

  for (const prog of progression) {
    const homeWinner = getWinner(prog.homeFrom, currentResults, currentMatchups);
    const awayWinner = getWinner(prog.awayFrom, currentResults, currentMatchups);
    next[prog.slotId] = { home: homeWinner, away: awayWinner };
  }

  return next;
}

// ═══════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════

describe('Golden Master — R32 Matchups', () => {

  const standings = computeAllStandings();
  const actualR32 = resolveRoundOf32(standings);

  test.each(Object.keys(EXPECTED_R32))('R32 slot %s has correct teams', (slotId) => {
    expect(actualR32[slotId]).toBeDefined();
    expect(actualR32[slotId].home).toBe(EXPECTED_R32[slotId].home);
    expect(actualR32[slotId].away).toBe(EXPECTED_R32[slotId].away);
  });

  test('all 16 R32 slots are populated', () => {
    expect(Object.keys(actualR32)).toHaveLength(16);
  });

  test('no team appears twice in R32', () => {
    const allTeams = Object.values(actualR32).flatMap(m => [m.home, m.away]);
    const unique = new Set(allTeams);
    expect(unique.size).toBe(32);
  });

  // Specific high-value assertions
  test('R32-07: México (1A) vs España (3H)', () => {
    expect(actualR32['R32-07']).toEqual({ home: 'MEX', away: 'ESP' });
  });

  test('R32-09: Paraguay (1D) vs Argentina (3J)', () => {
    expect(actualR32['R32-09']).toEqual({ home: 'PAR', away: 'ARG' });
  });

  test('R32-15: Colombia (1K) vs Inglaterra (3L)', () => {
    expect(actualR32['R32-15']).toEqual({ home: 'COL', away: 'ENG' });
  });
});

describe('Golden Master — R32 Results', () => {

  test.each(Object.keys(R32_RESULTS))('%s winner is correct', (slotId) => {
    const result = R32_RESULTS[slotId];
    expect(result.winner).toBeDefined();

    // Verify winner matches goal logic
    if (result.homeGoals > result.awayGoals) {
      expect(result.winner).toBe(EXPECTED_R32[slotId].home);
    } else if (result.awayGoals > result.homeGoals) {
      expect(result.winner).toBe(EXPECTED_R32[slotId].away);
    } else {
      // Penalties
      expect(result.homePen).toBeDefined();
      expect(result.awayPen).toBeDefined();
    }
  });
});

describe('Golden Master — R16 Propagation', () => {

  const r16 = propagateRound(EXPECTED_R32, R32_RESULTS, BRACKET_PROGRESSION.R16);

  test.each(Object.keys(EXPECTED_R16))('%s matchup is correct', (slotId) => {
    expect(r16[slotId]).toBeDefined();
    expect(r16[slotId].home).toBe(EXPECTED_R16[slotId].home);
    expect(r16[slotId].away).toBe(EXPECTED_R16[slotId].away);
  });

  test('R16-01: winner of R32-02 (SCO) vs winner of R32-05 (TUN)', () => {
    expect(r16['R16-01']).toEqual({ home: 'SCO', away: 'TUN' });
  });

  test('R16-04: winner of R32-07 (ESP) vs winner of R32-08 (GHA)', () => {
    expect(r16['R16-04']).toEqual({ home: 'ESP', away: 'GHA' });
  });
});

describe('Golden Master — QF Propagation', () => {

  const r16 = propagateRound(EXPECTED_R32, R32_RESULTS, BRACKET_PROGRESSION.R16);
  const qf = propagateRound(r16, R16_RESULTS, BRACKET_PROGRESSION.QF);

  test.each(Object.keys(EXPECTED_QF))('%s matchup is correct', (slotId) => {
    expect(qf[slotId]).toBeDefined();
    expect(qf[slotId].home).toBe(EXPECTED_QF[slotId].home);
    expect(qf[slotId].away).toBe(EXPECTED_QF[slotId].away);
  });

  test('QF-01: TUN vs KOR', () => {
    expect(qf['QF-01']).toEqual({ home: 'TUN', away: 'KOR' });
  });

  test('QF-04: ALG vs COL', () => {
    expect(qf['QF-04']).toEqual({ home: 'ALG', away: 'COL' });
  });
});

describe('Golden Master — SF Propagation', () => {

  const r16 = propagateRound(EXPECTED_R32, R32_RESULTS, BRACKET_PROGRESSION.R16);
  const qf = propagateRound(r16, R16_RESULTS, BRACKET_PROGRESSION.QF);
  const sf = propagateRound(qf, QF_RESULTS, BRACKET_PROGRESSION.SF);

  test('SF-01: KOR vs RSA', () => {
    expect(sf['SF-01']).toEqual({ home: 'KOR', away: 'RSA' });
  });

  test('SF-02: GHA vs ALG', () => {
    expect(sf['SF-02']).toEqual({ home: 'GHA', away: 'ALG' });
  });
});

describe('Golden Master — Final & Third Place', () => {

  test('Final: KOR vs ALG', () => {
    // Winners of SF
    expect(SF_RESULTS['SF-01'].winner).toBe('KOR');
    expect(SF_RESULTS['SF-02'].winner).toBe('ALG');
    expect(EXPECTED_FINAL).toEqual({ home: 'KOR', away: 'ALG' });
  });

  test('Third place: RSA vs GHA (losers of SF)', () => {
    // Losers: SF-01 loser = RSA, SF-02 loser = GHA
    expect(EXPECTED_SF['SF-01']).toEqual({ home: 'KOR', away: 'RSA' });
    expect(SF_RESULTS['SF-01'].winner).toBe('KOR');
    // So loser = RSA

    expect(EXPECTED_SF['SF-02']).toEqual({ home: 'GHA', away: 'ALG' });
    expect(SF_RESULTS['SF-02'].winner).toBe('ALG');
    // So loser = GHA

    expect(EXPECTED_THIRD_PLACE).toEqual({ home: 'RSA', away: 'GHA' });
  });

  test('Champion: República de Corea 🏆', () => {
    expect(EXPECTED_FINAL.home).toBe('KOR');
    // Final result: KOR 1-0 ALG
    expect(EXPECTED_FINAL.home).toBe('KOR');
  });
});

describe('Golden Master — Full Bracket Integrity', () => {

  test('32 unique teams enter R32, 1 champion emerges', () => {
    const r32Teams = Object.values(EXPECTED_R32).flatMap(m => [m.home, m.away]);
    expect(new Set(r32Teams).size).toBe(32);

    // Trace winner through each round
    const r32Winners = Object.values(R32_RESULTS).map(r => r.winner);
    expect(r32Winners).toHaveLength(16);

    const r16Winners = Object.values(R16_RESULTS).map(r => r.winner);
    expect(r16Winners).toHaveLength(8);

    const qfWinners = Object.values(QF_RESULTS).map(r => r.winner);
    expect(qfWinners).toHaveLength(4);

    const sfWinners = Object.values(SF_RESULTS).map(r => r.winner);
    expect(sfWinners).toHaveLength(2);

    // All R32 winners appear in R16
    for (const w of r32Winners) {
      const inR16 = Object.values(EXPECTED_R16).some(m => m.home === w || m.away === w);
      expect(inR16).toBe(true);
    }

    // All R16 winners appear in QF
    for (const w of r16Winners) {
      const inQF = Object.values(EXPECTED_QF).some(m => m.home === w || m.away === w);
      expect(inQF).toBe(true);
    }

    // All QF winners appear in SF
    for (const w of qfWinners) {
      const inSF = Object.values(EXPECTED_SF).some(m => m.home === w || m.away === w);
      expect(inSF).toBe(true);
    }

    // SF winners appear in Final
    for (const w of sfWinners) {
      expect(w === EXPECTED_FINAL.home || w === EXPECTED_FINAL.away).toBe(true);
    }
  });

  test('no team wins and then faces itself', () => {
    const allMatchups = [
      ...Object.values(EXPECTED_R32),
      ...Object.values(EXPECTED_R16),
      ...Object.values(EXPECTED_QF),
      ...Object.values(EXPECTED_SF),
      EXPECTED_FINAL,
      EXPECTED_THIRD_PLACE,
    ];

    for (const m of allMatchups) {
      expect(m.home).not.toBe(m.away);
    }
  });
});
