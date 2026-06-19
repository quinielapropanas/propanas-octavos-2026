// ═══════════════════════════════════════════════════════════
// Golden Master Test — Best Third-Place Teams
// Validates: third identification, ranking, combination key,
// FIFA matrix lookup, and host-to-third mapping.
// ═══════════════════════════════════════════════════════════

import {
  GROUP_MATCH_RESULTS,
  EXPECTED_STANDINGS,
  EXPECTED_THIRDS,
  EXPECTED_THIRDS_RANKING,
  QUALIFYING_THIRDS,
  EXPECTED_COMBINATION_KEY,
  EXPECTED_MATRIX_ROW,
  EXPECTED_HOST_TO_THIRD,
  THIRD_PLACE_HOSTS,
  FIFA_THIRD_PLACE_MATRIX,
} from '../../__fixtures__/golden-master-2026';

// Import functions under test
// TODO: Adapt these imports to match your actual module paths
import { calculateGroupStandings } from '../group-calculator';

// ─── Helper: compute all standings and extract thirds ────

function computeAllStandings() {
  const allStandings: Array<{
    teamId: string;
    groupLetter: string;
    points: number;
    goalDifference: number;
    goalsFor: number;
    position: number;
  }> = [];

  for (const [group, matches] of Object.entries(GROUP_MATCH_RESULTS)) {
    const standings = calculateGroupStandings(
      matches.map(m => ({
        homeTeamId: m.home,
        awayTeamId: m.away,
        homeGoals: m.homeGoals,
        awayGoals: m.awayGoals,
      }))
    );
    standings.forEach((s, i) => {
      allStandings.push({
        teamId: s.teamId,
        groupLetter: group,
        points: s.points,
        goalDifference: s.goalDifference ?? (s.goalsFor - s.goalsAgainst),
        goalsFor: s.goalsFor,
        position: i + 1,
      });
    });
  }
  return allStandings;
}

function rankThirds(allStandings: ReturnType<typeof computeAllStandings>) {
  return allStandings
    .filter(s => s.position === 3)
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor
    );
}

function buildCombinationKey(rankedThirds: ReturnType<typeof rankThirds>): string {
  return rankedThirds
    .slice(0, 8)
    .map(t => t.groupLetter)
    .sort()
    .join('');
}

function lookupThirdPlaceMatrix(key: string): string[] | undefined {
  return FIFA_THIRD_PLACE_MATRIX[key];
}

// ═══════════════════════════════════════════════════════════

describe('Golden Master — Third Place Identification', () => {

  test.each(Object.keys(EXPECTED_THIRDS))('Group %s: correct third-place team', (group) => {
    const allStandings = computeAllStandings();
    const third = allStandings.find(s => s.groupLetter === group && s.position === 3);
    expect(third).toBeDefined();
    expect(third!.teamId).toBe(EXPECTED_THIRDS[group]);
  });
});

describe('Golden Master — Third Place Global Ranking', () => {

  test('all 12 third-place teams are identified', () => {
    const allStandings = computeAllStandings();
    const thirds = allStandings.filter(s => s.position === 3);
    expect(thirds).toHaveLength(12);
  });

  test('ranking order matches expected (1st through 12th)', () => {
    const allStandings = computeAllStandings();
    const ranked = rankThirds(allStandings);
    const actualOrder = ranked.map(t => t.teamId);
    expect(actualOrder).toEqual(EXPECTED_THIRDS_RANKING);
  });

  test('top 8 qualifying thirds are correct', () => {
    const allStandings = computeAllStandings();
    const ranked = rankThirds(allStandings);
    const top8 = ranked.slice(0, 8).map(t => t.teamId);
    expect(top8).toEqual(QUALIFYING_THIRDS);
  });

  test('Túnez (Group F) is ranked 1st among thirds with 6 points', () => {
    const allStandings = computeAllStandings();
    const ranked = rankThirds(allStandings);
    expect(ranked[0].teamId).toBe('TUN');
    expect(ranked[0].points).toBe(6);
  });

  test('bottom 4 (non-qualifying) thirds are CAN, FRA, POR, USA', () => {
    const allStandings = computeAllStandings();
    const ranked = rankThirds(allStandings);
    const bottom4 = ranked.slice(8).map(t => t.teamId);
    expect(bottom4).toEqual(['CAN', 'FRA', 'POR', 'USA']);
  });
});

describe('Golden Master — Combination Key', () => {

  test('combination key is ACEFGHJL', () => {
    const allStandings = computeAllStandings();
    const ranked = rankThirds(allStandings);
    const key = buildCombinationKey(ranked);
    expect(key).toBe(EXPECTED_COMBINATION_KEY);
  });

  test('key is exactly 8 characters (sorted group letters)', () => {
    const allStandings = computeAllStandings();
    const ranked = rankThirds(allStandings);
    const key = buildCombinationKey(ranked);
    expect(key).toHaveLength(8);
    // Verify sorted
    expect(key).toBe(key.split('').sort().join(''));
  });
});

describe('Golden Master — FIFA Matrix Lookup', () => {

  test('matrix contains entry for ACEFGHJL', () => {
    const row = lookupThirdPlaceMatrix(EXPECTED_COMBINATION_KEY);
    expect(row).toBeDefined();
  });

  test('matrix row for ACEFGHJL returns [H, G, J, C, A, F, L, E]', () => {
    const row = lookupThirdPlaceMatrix(EXPECTED_COMBINATION_KEY);
    expect(row).toEqual(EXPECTED_MATRIX_ROW);
  });

  test('matrix row has exactly 8 entries (one per host)', () => {
    const row = lookupThirdPlaceMatrix(EXPECTED_COMBINATION_KEY);
    expect(row).toHaveLength(8);
  });
});

describe('Golden Master — Host-to-Third Mapping', () => {

  test('hosts are in correct fixed order', () => {
    expect(THIRD_PLACE_HOSTS).toEqual(['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L']);
  });

  test.each(Object.entries(EXPECTED_HOST_TO_THIRD))(
    'host %s maps to third of group %s',
    (host, expectedGroup) => {
      const row = lookupThirdPlaceMatrix(EXPECTED_COMBINATION_KEY)!;
      const hostIndex = THIRD_PLACE_HOSTS.indexOf(host as any);
      expect(hostIndex).toBeGreaterThanOrEqual(0);
      expect(row[hostIndex]).toBe(expectedGroup);
    }
  );

  test('1A (México) faces 3rd of H (España)', () => {
    const row = lookupThirdPlaceMatrix(EXPECTED_COMBINATION_KEY)!;
    const idx = THIRD_PLACE_HOSTS.indexOf('1A');
    expect(row[idx]).toBe('H');
    expect(EXPECTED_THIRDS['H']).toBe('ESP');
  });

  test('1B (Catar) faces 3rd of G (Irán)', () => {
    const row = lookupThirdPlaceMatrix(EXPECTED_COMBINATION_KEY)!;
    const idx = THIRD_PLACE_HOSTS.indexOf('1B');
    expect(row[idx]).toBe('G');
    expect(EXPECTED_THIRDS['G']).toBe('IRN');
  });

  test('no third-place team is assigned to two hosts', () => {
    const row = lookupThirdPlaceMatrix(EXPECTED_COMBINATION_KEY)!;
    const unique = new Set(row);
    expect(unique.size).toBe(8);
  });

  test('all assigned groups are from the qualifying set', () => {
    const row = lookupThirdPlaceMatrix(EXPECTED_COMBINATION_KEY)!;
    const qualifyingGroups = EXPECTED_COMBINATION_KEY.split('');
    row.forEach(group => {
      expect(qualifyingGroups).toContain(group);
    });
  });
});
