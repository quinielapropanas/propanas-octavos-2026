// ═══════════════════════════════════════════════════════════
// Tournament Domain Tests
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { calculateGroupStandings } from '../group-calculator';
import { rankBestThirds } from '../best-thirds';
import { analyzeCascadeImpact, BRACKET_STRUCTURE } from '../bracket-resolver';
import { TEAMS_A, MATCHES_A, RESULTS_CLEAR, RESULTS_TIE } from '../../__fixtures__/sample-data';

describe('GroupCalculator', () => {
  describe('basic standings', () => {
    it('calculates correct standings with clear winner', () => {
      const result = calculateGroupStandings('A', TEAMS_A, MATCHES_A, RESULTS_CLEAR);
      expect(result.groupLetter).toBe('A');
      expect(result.hasOverride).toBe(false);
      expect(result.positions).toHaveLength(4);

      // MEX: 3W = 9pts, GF=7, GA=1, GD=+6
      expect(result.positions[0].teamId).toBe('mex');
      expect(result.positions[0].points).toBe(9);
      expect(result.positions[0].position).toBe(1);
      expect(result.positions[0].won).toBe(3);

      // KOR: 1W1D1L = 4pts
      expect(result.positions[1].teamId).toBe('kor');
      expect(result.positions[1].points).toBe(4);

      // RSA: 1W2L = 3pts
      expect(result.positions[2].points).toBe(3);

      // CZE: 0W1D2L = 1pt
      expect(result.positions[3].points).toBe(1);
    });

    it('generates tiebreak explanations', () => {
      const result = calculateGroupStandings('A', TEAMS_A, MATCHES_A, RESULTS_CLEAR);
      expect(result.positions[0].tiebreakExplanation).toBe('Resolved by total points');
    });
  });

  describe('D21 multi-level tiebreak', () => {
    it('resolves tie using head-to-head when points are equal', () => {
      const result = calculateGroupStandings('A', TEAMS_A, MATCHES_A, RESULTS_TIE);
      // KOR and CZE both have 6 points
      // KOR beat CZE 2-0 in h2h → KOR should be above CZE
      const kor = result.positions.find(p => p.teamId === 'kor')!;
      const cze = result.positions.find(p => p.teamId === 'cze')!;
      expect(kor.position).toBeLessThan(cze.position);
      expect(kor.tiebreakExplanation).toContain('H2H');
    });

    it('handles override correctly', () => {
      const result = calculateGroupStandings('A', TEAMS_A, MATCHES_A, RESULTS_CLEAR, undefined, {
        positions: [
          { teamId: 'rsa', position: 1 },
          { teamId: 'mex', position: 2 },
          { teamId: 'cze', position: 3 },
          { teamId: 'kor', position: 4 },
        ],
      });
      expect(result.hasOverride).toBe(true);
      expect(result.positions[0].teamId).toBe('rsa');
      expect(result.positions[0].position).toBe(1);
      expect(result.positions[0].tiebreakExplanation).toContain('admin override');
    });
  });

  describe('incomplete group', () => {
    it('handles partial results', () => {
      const partial = new Map([['m1', { matchId: 'm1', homeGoals: 1, awayGoals: 0 }]]);
      const result = calculateGroupStandings('A', TEAMS_A, MATCHES_A, partial);
      expect(result.positions).toHaveLength(4);
      const mex = result.positions.find(p => p.teamId === 'mex')!;
      expect(mex.points).toBe(3);
      expect(mex.played).toBe(1);
    });
  });
});

describe('BestThirds', () => {
  it('ranks 12 thirds and qualifies top 8', () => {
    // Create 12 group standings with known 3rd place teams
    const standings = Array.from({ length: 12 }, (_, i) => {
      const letter = String.fromCharCode(65 + i); // A-L
      return {
        groupLetter: letter,
        hasOverride: false,
        positions: [
          { teamId: `t${letter}1`, position: 1, played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 6, goalsAgainst: 0, goalDifference: 6, points: 9, fairPlayScore: 0, tiebreakExplanation: '' },
          { teamId: `t${letter}2`, position: 2, played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 4, goalsAgainst: 2, goalDifference: 2, points: 6, fairPlayScore: 0, tiebreakExplanation: '' },
          { teamId: `t${letter}3`, position: 3, played: 3, won: 1, drawn: 0, lost: 2, goalsFor: 3 - i * 0.1, goalsAgainst: 3, goalDifference: -i * 0.1, points: i < 8 ? 4 : 3, fairPlayScore: i, tiebreakExplanation: '' },
          { teamId: `t${letter}4`, position: 4, played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 0, goalsAgainst: 9, goalDifference: -9, points: 0, fairPlayScore: 0, tiebreakExplanation: '' },
        ],
      };
    });

    const result = rankBestThirds(standings);
    expect(result.ranking).toHaveLength(12);
    expect(result.ranking.filter(t => t.qualified)).toHaveLength(8);
    expect(result.combinationKey).toHaveLength(8);

    // First ranked should have more points
    expect(result.ranking[0].rank).toBe(1);
    expect(result.ranking[0].qualified).toBe(true);
    expect(result.ranking[11].rank).toBe(12);
    expect(result.ranking[11].qualified).toBe(false);
  });

  it('generates sorted combination key', () => {
    const standings = 'ABCDEFGHIJKL'.split('').map(letter => ({
      groupLetter: letter, hasOverride: false,
      positions: [
        { teamId: `1${letter}`, position: 1, played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 6, goalsAgainst: 0, goalDifference: 6, points: 9, fairPlayScore: 0, tiebreakExplanation: '' },
        { teamId: `2${letter}`, position: 2, played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 4, goalsAgainst: 2, goalDifference: 2, points: 6, fairPlayScore: 0, tiebreakExplanation: '' },
        { teamId: `3${letter}`, position: 3, played: 3, won: 1, drawn: 0, lost: 2, goalsFor: 2, goalsAgainst: 4, goalDifference: -2, points: 3, fairPlayScore: 0, tiebreakExplanation: '' },
        { teamId: `4${letter}`, position: 4, played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 0, goalsAgainst: 6, goalDifference: -6, points: 0, fairPlayScore: 0, tiebreakExplanation: '' },
      ],
    }));

    const result = rankBestThirds(standings);
    // Key should be sorted alphabetically
    const keyChars = result.combinationKey.split('');
    expect(keyChars).toEqual([...keyChars].sort());
  });
});

describe('CascadeAnalyzer', () => {
  it('finds all downstream slots from R32', () => {
    const impact = analyzeCascadeImpact('R32-01');
    // R32-01 → R16-02 → QF-01 → SF-01 → F-01 + 3RD-01
    expect(impact.affectedSlotIds).toContain('R16-02');
    expect(impact.affectedSlotIds).toContain('QF-01');
    expect(impact.affectedSlotIds).toContain('SF-01');
    expect(impact.affectedSlotIds).toContain('F-01');
    expect(impact.affectedSlotIds).toContain('3RD-01');
    expect(impact.affectedSlotIds.length).toBeGreaterThanOrEqual(5);
  });

  it('F-01 has no downstream', () => {
    const impact = analyzeCascadeImpact('F-01');
    expect(impact.affectedSlotIds).toHaveLength(0);
  });

  it('SF affects both F-01 and 3RD-01', () => {
    const impact = analyzeCascadeImpact('SF-01');
    expect(impact.affectedSlotIds).toContain('F-01');
    expect(impact.affectedSlotIds).toContain('3RD-01');
  });
});

describe('BracketStructure', () => {
  it('has exactly 32 slots', () => {
    expect(BRACKET_STRUCTURE).toHaveLength(32);
  });

  it('has correct round counts', () => {
    const counts = { R32: 0, R16: 0, QF: 0, SF: 0, THIRD: 0, FINAL: 0 };
    for (const s of BRACKET_STRUCTURE) counts[s.round]++;
    expect(counts).toEqual({ R32: 16, R16: 8, QF: 4, SF: 2, THIRD: 1, FINAL: 1 });
  });

  it('3RD-01 uses parent losers', () => {
    const third = BRACKET_STRUCTURE.find(s => s.slotId === '3RD-01')!;
    expect(third.usesParentLoser).toBe(true);
    expect(third.parentSlot1).toBe('SF-01');
    expect(third.parentSlot2).toBe('SF-02');
  });

  it('all non-R32 slots have parent references', () => {
    for (const s of BRACKET_STRUCTURE.filter(d => d.round !== 'R32')) {
      expect(s.parentSlot1).toBeTruthy();
      expect(s.parentSlot2).toBeTruthy();
    }
  });

  it('match numbers are sequential 73-104', () => {
    const nums = BRACKET_STRUCTURE.map(s => s.matchNumber).sort((a, b) => a - b);
    expect(nums[0]).toBe(73);
    expect(nums[nums.length - 1]).toBe(104);
    expect(new Set(nums).size).toBe(32);
  });
});
