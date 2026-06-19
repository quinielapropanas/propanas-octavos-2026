// ═══════════════════════════════════════════════════════════
// Recalculator Tests
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { determineRecalcScope } from '../recalculator';
import { CONCEPT } from '../../types';
import type { MatchData } from '../../types';

const makeMatch = (overrides: Partial<MatchData>): MatchData => ({
  id: 'test-match', matchNumber: 1, phase: 'GROUP', groupLetter: 'A',
  slotId: 'GRP-A-01', homeTeamId: 'mex', awayTeamId: 'rsa',
  homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null,
  ...overrides,
});

describe('determineRecalcScope', () => {
  const allMatches: MatchData[] = [];

  it('group match → recalculates that group + best thirds + all R32', () => {
    const match = makeMatch({ phase: 'GROUP', groupLetter: 'C' });
    const scope = determineRecalcScope(match, allMatches);

    expect(scope.groups).toContain('C');
    expect(scope.bestThirds).toBe(true);
    expect(scope.bracketSlots.length).toBe(16); // all R32 slots
    expect(scope.scoringAll).toBe(true);
    expect(scope.conceptIds).toContain(CONCEPT.RESULTADO_ACERTADO);
    expect(scope.conceptIds).toContain(CONCEPT.CLASIFICACION_SEGUNDA_FASE);
  });

  it('knockout match → recalculates that slot + downstream', () => {
    const match = makeMatch({
      phase: 'QF', groupLetter: null, slotId: 'QF-01', matchNumber: 97,
    });
    const scope = determineRecalcScope(match, allMatches);

    expect(scope.groups).toHaveLength(0);
    expect(scope.bestThirds).toBe(false);
    expect(scope.bracketSlots).toContain('QF-01');
    expect(scope.bracketSlots).toContain('SF-01');
    expect(scope.bracketSlots).toContain('F-01');
    expect(scope.bracketSlots).toContain('3RD-01');
    expect(scope.scoringAll).toBe(true);
    expect(scope.conceptIds).toContain(CONCEPT.CAMPEON);
  });

  it('final match → only F-01 slot (no downstream)', () => {
    const match = makeMatch({
      phase: 'FINAL', groupLetter: null, slotId: 'F-01', matchNumber: 104,
    });
    const scope = determineRecalcScope(match, allMatches);

    expect(scope.bracketSlots).toContain('F-01');
    // F-01 has no downstream
    expect(scope.bracketSlots).not.toContain('3RD-01');
  });

  it('SF match → affects both F-01 and 3RD-01', () => {
    const match = makeMatch({
      phase: 'SF', groupLetter: null, slotId: 'SF-01', matchNumber: 101,
    });
    const scope = determineRecalcScope(match, allMatches);

    expect(scope.bracketSlots).toContain('SF-01');
    expect(scope.bracketSlots).toContain('F-01');
    expect(scope.bracketSlots).toContain('3RD-01');
  });
});
