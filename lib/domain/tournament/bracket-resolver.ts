// ═══════════════════════════════════════════════════════════
// Bracket Resolver — Adapted for OCTAVOS only (starts at R16)
// ═══════════════════════════════════════════════════════════

import type {
  MatchData, MatchResult, BracketSlotData, GroupStandingResult,
  BestThirdsResult, KnockoutRound, CascadeImpact,
} from '../types';
import { getDefinitiveWinner } from '../types';

export interface SlotDefinition {
  slotId: string;
  matchNumber: number;
  round: KnockoutRound;
  parentSlot1: string | null;
  parentSlot2: string | null;
  usesParentLoser?: boolean;
  homeOrigin?: string;
  awayOrigin?: string;
}

// Bracket starts at R16 — teams are assigned directly by admin after R32 ends
export const BRACKET_STRUCTURE: SlotDefinition[] = [
  // R16 (8 matches) — starting round
  { slotId: 'R16-01', matchNumber: 89, round: 'R16', parentSlot1: null, parentSlot2: null },
  { slotId: 'R16-02', matchNumber: 90, round: 'R16', parentSlot1: null, parentSlot2: null },
  { slotId: 'R16-03', matchNumber: 91, round: 'R16', parentSlot1: null, parentSlot2: null },
  { slotId: 'R16-04', matchNumber: 92, round: 'R16', parentSlot1: null, parentSlot2: null },
  { slotId: 'R16-05', matchNumber: 93, round: 'R16', parentSlot1: null, parentSlot2: null },
  { slotId: 'R16-06', matchNumber: 94, round: 'R16', parentSlot1: null, parentSlot2: null },
  { slotId: 'R16-07', matchNumber: 95, round: 'R16', parentSlot1: null, parentSlot2: null },
  { slotId: 'R16-08', matchNumber: 96, round: 'R16', parentSlot1: null, parentSlot2: null },
  // QF
  { slotId: 'QF-01', matchNumber: 97, round: 'QF', parentSlot1: 'R16-01', parentSlot2: 'R16-02' },
  { slotId: 'QF-02', matchNumber: 98, round: 'QF', parentSlot1: 'R16-05', parentSlot2: 'R16-06' },
  { slotId: 'QF-03', matchNumber: 99, round: 'QF', parentSlot1: 'R16-03', parentSlot2: 'R16-04' },
  { slotId: 'QF-04', matchNumber: 100, round: 'QF', parentSlot1: 'R16-07', parentSlot2: 'R16-08' },
  // SF
  { slotId: 'SF-01', matchNumber: 101, round: 'SF', parentSlot1: 'QF-01', parentSlot2: 'QF-02' },
  { slotId: 'SF-02', matchNumber: 102, round: 'SF', parentSlot1: 'QF-03', parentSlot2: 'QF-04' },
  // Third place
  { slotId: '3RD-01', matchNumber: 103, round: 'THIRD', parentSlot1: 'SF-01', parentSlot2: 'SF-02', usesParentLoser: true },
  // Final
  { slotId: 'F-01', matchNumber: 104, round: 'FINAL', parentSlot1: 'SF-01', parentSlot2: 'SF-02' },
];

// R32 is not used in octavos quiniela — kept as stub for compatibility
export function resolveR32Slots(
  groupStandings: GroupStandingResult[],
  bestThirds: BestThirdsResult,
  fifaMatrixLookup: (key: string) => Record<string, string> | null,
): BracketSlotData[] {
  return []; // No R32 in octavos quiniela
}

// ─── Winner Propagation (starts from R16) ────────────────

export function propagateWinners(
  initialSlots: BracketSlotData[],
  knockoutResults: Map<string, MatchResult>,
  matchBySlot: Map<string, string>,
): BracketSlotData[] {
  const allSlots = new Map<string, BracketSlotData>();
  for (const s of initialSlots) allSlots.set(s.slotId, { ...s });

  const roundOrder: KnockoutRound[] = ['R16', 'QF', 'SF', 'THIRD', 'FINAL'];

  for (const round of roundOrder) {
    for (const def of BRACKET_STRUCTURE.filter(d => d.round === round)) {
      if (round === 'R16') {
        const slot = allSlots.get(def.slotId);
        const matchId = matchBySlot.get(def.slotId);
        if (slot && matchId && slot.homeTeamId && slot.awayTeamId) {
          const result = knockoutResults.get(matchId);
          if (result) {
            const w = getDefinitiveWinner(result);
            if (w === 'home') { slot.winnerTeamId = slot.homeTeamId; slot.loserTeamId = slot.awayTeamId; }
            else if (w === 'away') { slot.winnerTeamId = slot.awayTeamId; slot.loserTeamId = slot.homeTeamId; }
          }
        }
        continue;
      }

      const p1 = def.parentSlot1 ? allSlots.get(def.parentSlot1) : null;
      const p2 = def.parentSlot2 ? allSlots.get(def.parentSlot2) : null;

      const homeTeamId = def.usesParentLoser ? (p1?.loserTeamId ?? null) : (p1?.winnerTeamId ?? null);
      const awayTeamId = def.usesParentLoser ? (p2?.loserTeamId ?? null) : (p2?.winnerTeamId ?? null);

      const slot: BracketSlotData = {
        slotId: def.slotId, round: def.round,
        homeTeamId, awayTeamId, winnerTeamId: null, loserTeamId: null,
      };

      const matchId = matchBySlot.get(def.slotId);
      if (matchId && homeTeamId && awayTeamId) {
        const result = knockoutResults.get(matchId);
        if (result) {
          const w = getDefinitiveWinner(result);
          if (w === 'home') { slot.winnerTeamId = homeTeamId; slot.loserTeamId = awayTeamId; }
          else if (w === 'away') { slot.winnerTeamId = awayTeamId; slot.loserTeamId = homeTeamId; }
        }
      }
      allSlots.set(def.slotId, slot);
    }
  }
  return Array.from(allSlots.values());
}

export function analyzeCascadeImpact(changedSlotId: string): CascadeImpact {
  const affected: string[] = [];
  const queue = [changedSlotId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const def of BRACKET_STRUCTURE) {
      if ((def.parentSlot1 === current || def.parentSlot2 === current) && !visited.has(def.slotId)) {
        affected.push(def.slotId);
        queue.push(def.slotId);
      }
    }
  }

  return {
    affectedMatchIds: affected.map(s => String(BRACKET_STRUCTURE.find(d => d.slotId === s)?.matchNumber ?? '')),
    affectedSlotIds: affected,
    description: affected.length > 0
      ? `Change in ${changedSlotId} affects ${affected.length} downstream slots: ${affected.join(', ')}`
      : `Change in ${changedSlotId} has no downstream impact`,
  };
}