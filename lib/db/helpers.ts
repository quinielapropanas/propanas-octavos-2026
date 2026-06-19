// ═══════════════════════════════════════════════════════════
// DB Helpers — Key computation (F1/F6 from schema v4)
// ═══════════════════════════════════════════════════════════

export const OFFICIAL_CONTEXT_KEY = '__OFFICIAL__';

export function contextKey(type: 'OFFICIAL' | 'PARTICIPANT', userId?: string | null): string {
  if (type === 'OFFICIAL') return OFFICIAL_CONTEXT_KEY;
  if (!userId) throw new Error('userId required for PARTICIPANT context');
  return userId;
}

export function deadlineScopeKey(scope: 'GLOBAL' | 'PHASE' | 'MATCH', phase?: string | null, matchId?: string | null): string {
  if (scope === 'GLOBAL') return 'GLOBAL';
  if (scope === 'PHASE') return `PHASE:${phase}`;
  if (scope === 'MATCH') return `MATCH:${matchId}`;
  throw new Error(`Invalid scope: ${scope}`);
}

export function breakdownKey(matchId?: string | null, slotId?: string | null): string {
  if (matchId) return `M:${matchId}`;
  if (slotId) return `S:${slotId}`;
  return 'G';
}
