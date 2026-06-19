// ═══════════════════════════════════════════════════════════
// Golden Master Test — Group Standings
// Validates that calculateAllGroupStandings produces exact
// standings for all 12 groups from the reference dataset.
// ═══════════════════════════════════════════════════════════

import {
  GROUP_MATCH_RESULTS,
  EXPECTED_STANDINGS,
} from '../../__fixtures__/golden-master-2026';

// Import the function under test
// Adapt this import to match your actual module path
import { calculateGroupStandings } from '../group-calculator';

// Helper: convert golden master format to the format expected by calculateGroupStandings
function buildMatchInputs(groupLetter: string) {
  return GROUP_MATCH_RESULTS[groupLetter].map(m => ({
    homeTeamId: m.home,
    awayTeamId: m.away,
    homeGoals: m.homeGoals,
    awayGoals: m.awayGoals,
  }));
}

describe('Golden Master — Group Standings', () => {
  const groups = Object.keys(EXPECTED_STANDINGS);

  test.each(groups)('Group %s standings match expected order', (group) => {
    const matches = buildMatchInputs(group);
    const standings = calculateGroupStandings(matches);

    const actualOrder = standings.map(s => s.teamId);
    const expectedOrder = EXPECTED_STANDINGS[group];

    expect(actualOrder).toEqual(expectedOrder);
  });

  test.each(groups)('Group %s has exactly 4 teams', (group) => {
    const matches = buildMatchInputs(group);
    const standings = calculateGroupStandings(matches);
    expect(standings).toHaveLength(4);
  });

  test.each(groups)('Group %s: all teams played 3 matches', (group) => {
    const matches = buildMatchInputs(group);
    const standings = calculateGroupStandings(matches);
    standings.forEach(team => {
      expect(team.played).toBe(3);
      expect(team.won + team.drawn + team.lost).toBe(3);
    });
  });

  test('Group A: México is 1st with 7 points', () => {
    const standings = calculateGroupStandings(buildMatchInputs('A'));
    expect(standings[0].teamId).toBe('MEX');
    expect(standings[0].points).toBe(7);
    expect(standings[0].won).toBe(2);
    expect(standings[0].drawn).toBe(1);
  });

  test('Group A: República Checa is 4th with 0 points', () => {
    const standings = calculateGroupStandings(buildMatchInputs('A'));
    expect(standings[3].teamId).toBe('CZE');
    expect(standings[3].points).toBe(0);
  });

  test('Group D: Paraguay 1st, Turquía 2nd (both 5 pts, GD tiebreak)', () => {
    const standings = calculateGroupStandings(buildMatchInputs('D'));
    expect(standings[0].teamId).toBe('PAR');
    expect(standings[1].teamId).toBe('TUR');
    expect(standings[0].points).toBe(5);
    expect(standings[1].points).toBe(5);
    expect(standings[0].goalDifference).toBeGreaterThan(standings[1].goalDifference);
  });

  test('Group F: Túnez is 3rd (same points as Japón, different GD)', () => {
    const standings = calculateGroupStandings(buildMatchInputs('F'));
    expect(standings[0].teamId).toBe('NED');
    expect(standings[1].teamId).toBe('JPN');
    expect(standings[2].teamId).toBe('TUN');
  });

  test('Group K: Colombia 1st with 9 points (perfect record)', () => {
    const standings = calculateGroupStandings(buildMatchInputs('K'));
    expect(standings[0].teamId).toBe('COL');
    expect(standings[0].points).toBe(9);
    expect(standings[0].won).toBe(3);
  });
});
