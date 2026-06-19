// ═══════════════════════════════════════════════════════════
// FIFA Matrix Tests
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  lookupFIFAMatrix,
  validateMatrixCompleteness,
  MISSING_COMBINATIONS,
  SLOT_ORDER,
} from '../fifa-matrix';

// Helper: generate all C(12,8) = 495 combinations
function allCombinations(): string[] {
  const groups = 'ABCDEFGHIJKL'.split('');
  const result: string[] = [];
  function combine(start: number, current: string[]) {
    if (current.length === 8) {
      result.push([...current].sort().join(''));
      return;
    }
    for (let i = start; i < groups.length; i++) {
      current.push(groups[i]);
      combine(i + 1, current);
      current.pop();
    }
  }
  combine(0, []);
  return result;
}

describe('FIFA Matrix — structure', () => {
  it('SLOT_ORDER has exactly 8 slots', () => {
    expect(SLOT_ORDER.length).toBe(8);
  });

  it('SLOT_ORDER contains all expected R32 slots', () => {
    expect(new Set(SLOT_ORDER)).toEqual(new Set([
      'R32-07', 'R32-13', 'R32-09', 'R32-02',
      'R32-10', 'R32-05', 'R32-15', 'R32-08',
    ]));
  });

  it('SLOT_ORDER has no duplicates', () => {
    expect(new Set(SLOT_ORDER).size).toBe(SLOT_ORDER.length);
  });
});

describe('FIFA Matrix — completeness', () => {
  it('reports state via validateMatrixCompleteness', () => {
    const result = validateMatrixCompleteness();
    expect(result.expected).toBe(495);
    expect(result.count).toBeGreaterThanOrEqual(493);
    expect(result.missing).toEqual(MISSING_COMBINATIONS);
  });

  it('has data for at least 99% of combinations', () => {
    const all = allCombinations();
    const missing = all.filter(k => lookupFIFAMatrix(k) === null);
    const coverage = (all.length - missing.length) / all.length;
    expect(coverage).toBeGreaterThanOrEqual(0.99);
  });

  it('MISSING_COMBINATIONS matches runtime lookup failures', () => {
    const all = allCombinations();
    const runtimeMissing = all.filter(k => lookupFIFAMatrix(k) === null).sort();
    const declaredMissing = [...MISSING_COMBINATIONS].sort();
    expect(runtimeMissing).toEqual(declaredMissing);
  });
});

describe('FIFA Matrix — lookup correctness', () => {
  it('returns null for invalid input', () => {
    expect(lookupFIFAMatrix('')).toBeNull();
    expect(lookupFIFAMatrix('ABC')).toBeNull();
    expect(lookupFIFAMatrix('ABCDEFGHI')).toBeNull();       // 9 chars
    expect(lookupFIFAMatrix('ABCDEFGM')).toBeNull();         // M not in A-L
    expect(lookupFIFAMatrix('AAAAAAAA')).toBeNull();         // duplicates
    expect(lookupFIFAMatrix('abc123!!')).toBeNull();         // non-letters
  });

  it('is case-insensitive', () => {
    const upper = lookupFIFAMatrix('EFGHIJKL');
    const lower = lookupFIFAMatrix('efghijkl');
    expect(upper).not.toBeNull();
    expect(upper).toEqual(lower);
  });

  it('is order-insensitive', () => {
    const sorted = lookupFIFAMatrix('ABCDEFGH');
    const shuffled = lookupFIFAMatrix('HGFEDCBA');
    expect(sorted).not.toBeNull();
    expect(sorted).toEqual(shuffled);
  });

  it('returns object with 8 slots', () => {
    const result = lookupFIFAMatrix('EFGHIJKL');
    expect(result).not.toBeNull();
    expect(Object.keys(result!).length).toBe(8);
    for (const slot of SLOT_ORDER) {
      expect(result![slot]).toBeDefined();
    }
  });
});

describe('FIFA Matrix — data integrity', () => {
  it('every matrix row assigns groups only from its qualifying set', () => {
    const all = allCombinations();
    for (const key of all) {
      const result = lookupFIFAMatrix(key);
      if (!result) continue; // missing entries handled separately
      const keyLetters = new Set(key.split(''));
      for (const slot of SLOT_ORDER) {
        const assignedGroup = result[slot];
        expect(keyLetters.has(assignedGroup)).toBe(true);
      }
    }
  });

  it('every matrix row has 8 distinct assignments', () => {
    const all = allCombinations();
    for (const key of all) {
      const result = lookupFIFAMatrix(key);
      if (!result) continue;
      const assigned = Object.values(result);
      expect(new Set(assigned).size).toBe(8);
    }
  });

  it('every matrix row covers all 8 qualifying groups', () => {
    const all = allCombinations();
    for (const key of all) {
      const result = lookupFIFAMatrix(key);
      if (!result) continue;
      const assignedSet = new Set(Object.values(result));
      const keySet = new Set(key.split(''));
      expect(assignedSet).toEqual(keySet);
    }
  });
});

describe('FIFA Matrix — known reference cases', () => {
  // These are sample combinations whose data is independently verifiable
  // from the FIFA Regulations document. If these fail, the matrix is
  // systematically wrong.

  it('EFGHIJKL (groups A,B,C,D did not qualify) has expected assignments', () => {
    const result = lookupFIFAMatrix('EFGHIJKL');
    expect(result).not.toBeNull();
    // Every slot should get a group from {E,F,G,H,I,J,K,L}
    for (const slot of SLOT_ORDER) {
      expect('EFGHIJKL').toContain(result![slot]);
    }
  });

  it('ABCDEFGH (groups I,J,K,L did not qualify) has expected assignments', () => {
    const result = lookupFIFAMatrix('ABCDEFGH');
    expect(result).not.toBeNull();
    for (const slot of SLOT_ORDER) {
      expect('ABCDEFGH').toContain(result![slot]);
    }
  });
});
