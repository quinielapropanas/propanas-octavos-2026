// ═══════════════════════════════════════════════════════════
// Seed Helpers — Key computation utilities
// These functions MUST be used by app layer when writing to
// tables that use computed keys (F1/F6 from schema v4).
// ═══════════════════════════════════════════════════════════

/** Sentinel value for official context in derived tables */
export const OFFICIAL_CONTEXT_KEY = '__OFFICIAL__';

/** Compute contextKey for derived tables (group_standings, best_thirds, bracket_slots) */
export function contextKey(contextType: 'OFFICIAL' | 'PARTICIPANT', userId?: string | null): string {
  if (contextType === 'OFFICIAL') return OFFICIAL_CONTEXT_KEY;
  if (!userId) throw new Error('userId required for PARTICIPANT context');
  return userId;
}

/** Compute scopeKey for pool_deadlines (F6) */
export function deadlineScopeKey(
  scope: 'GLOBAL' | 'PHASE' | 'MATCH',
  phase?: string | null,
  matchId?: string | null,
): string {
  switch (scope) {
    case 'GLOBAL': return 'GLOBAL';
    case 'PHASE':
      if (!phase) throw new Error('phase required for PHASE scope');
      return `PHASE:${phase}`;
    case 'MATCH':
      if (!matchId) throw new Error('matchId required for MATCH scope');
      return `MATCH:${matchId}`;
  }
}

/** Compute breakdownKey for score_breakdowns (F1) */
export function breakdownKey(matchId?: string | null, slotId?: string | null): string {
  if (matchId) return `M:${matchId}`;
  if (slotId) return `S:${slotId}`;
  return 'G'; // global concepts (15-17)
}
