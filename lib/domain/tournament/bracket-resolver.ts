// ═══════════════════════════════════════════════════════════
// Bracket Resolver — Slot structure + propagation + cascade
// ═══════════════════════════════════════════════════════════

import type {
  MatchData, MatchResult, BracketSlotData, GroupStandingResult,
  BestThirdsResult, KnockoutRound, CascadeImpact,
} from '../types';
import { getDefinitiveWinner } from '../types';

// ─── Fixed bracket structure (32 slots) ──────────────────

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

export const BRACKET_STRUCTURE: SlotDefinition[] = [
  // R32
  { slotId: 'R32-01', matchNumber: 73,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '2A', awayOrigin: '2B' },
  { slotId: 'R32-02', matchNumber: 74,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1E', awayOrigin: '3ABCDF' },
  { slotId: 'R32-03', matchNumber: 75,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1F', awayOrigin: '2C' },
  { slotId: 'R32-04', matchNumber: 76,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1C', awayOrigin: '2F' },
  { slotId: 'R32-05', matchNumber: 77,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1I', awayOrigin: '3CDFGH' },
  { slotId: 'R32-06', matchNumber: 78,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '2E', awayOrigin: '2I' },
  { slotId: 'R32-07', matchNumber: 79,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1A', awayOrigin: '3CEFHI' },
  { slotId: 'R32-08', matchNumber: 80,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1L', awayOrigin: '3EHIJK' },
  { slotId: 'R32-09', matchNumber: 81,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1D', awayOrigin: '3BEFIJ' },
  { slotId: 'R32-10', matchNumber: 82,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1G', awayOrigin: '3AEHIJ' },
  { slotId: 'R32-11', matchNumber: 83,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '2K', awayOrigin: '2L' },
  { slotId: 'R32-12', matchNumber: 84,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1H', awayOrigin: '2J' },
  { slotId: 'R32-13', matchNumber: 85,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1B', awayOrigin: '3EFGIJ' },
  { slotId: 'R32-14', matchNumber: 86,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1J', awayOrigin: '2H' },
  { slotId: 'R32-15', matchNumber: 87,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '1K', awayOrigin: '3DEIJL' },
  { slotId: 'R32-16', matchNumber: 88,  round: 'R32', parentSlot1: null, parentSlot2: null, homeOrigin: '2D', awayOrigin: '2G' },
  // R16
  { slotId: 'R16-01', matchNumber: 89,  round: 'R16', parentSlot1: 'R32-02', parentSlot2: 'R32-05' },
  { slotId: 'R16-02', matchNumber: 90,  round: 'R16', parentSlot1: 'R32-01', parentSlot2: 'R32-03' },
  { slotId: 'R16-03', matchNumber: 91,  round: 'R16', parentSlot1: 'R32-04', parentSlot2: 'R32-06' },
  { slotId: 'R16-04', matchNumber: 92,  round: 'R16', parentSlot1: 'R32-07', parentSlot2: 'R32-08' },
  { slotId: 'R16-05', matchNumber: 93,  round: 'R16', parentSlot1: 'R32-11', parentSlot2: 'R32-12' },
  { slotId: 'R16-06', matchNumber: 94,  round: 'R16', parentSlot1: 'R32-09', parentSlot2: 'R32-10' },
  { slotId: 'R16-07', matchNumber: 95,  round: 'R16', parentSlot1: 'R32-14', parentSlot2: 'R32-16' },
  { slotId: 'R16-08', matchNumber: 96,  round: 'R16', parentSlot1: 'R32-13', parentSlot2: 'R32-15' },
  // QF
  { slotId: 'QF-01', matchNumber: 97,  round: 'QF', parentSlot1: 'R16-01', parentSlot2: 'R16-02' },
  { slotId: 'QF-02', matchNumber: 98,  round: 'QF', parentSlot1: 'R16-05', parentSlot2: 'R16-06' },
  { slotId: 'QF-03', matchNumber: 99,  round: 'QF', parentSlot1: 'R16-03', parentSlot2: 'R16-04' },
  { slotId: 'QF-04', matchNumber: 100, round: 'QF', parentSlot1: 'R16-07', parentSlot2: 'R16-08' },
  // SF
  { slotId: 'SF-01', matchNumber: 101, round: 'SF', parentSlot1: 'QF-01', parentSlot2: 'QF-02' },
  { slotId: 'SF-02', matchNumber: 102, round: 'SF', parentSlot1: 'QF-03', parentSlot2: 'QF-04' },
  // Third place — USES LOSERS (N6)
  { slotId: '3RD-01', matchNumber: 103, round: 'THIRD', parentSlot1: 'SF-01', parentSlot2: 'SF-02', usesParentLoser: true },
  // Final
  { slotId: 'F-01', matchNumber: 104, round: 'FINAL', parentSlot1: 'SF-01', parentSlot2: 'SF-02' },
];

// ─── R32 Resolution ──────────────────────────────────────

export function resolveR32Slots(
  groupStandings: GroupStandingResult[],
  bestThirds: BestThirdsResult,
  fifaMatrixLookup: (key: string) => Record<string, string> | null,
): BracketSlotData[] {
  const originToTeam = new Map<string, string>();
  for (const standing of groupStandings) {
    for (const pos of standing.positions) {
      originToTeam.set(`${pos.position}${standing.groupLetter}`, pos.teamId);
    }
  }

  const thirdByGroup = new Map<string, string>();
  for (const t of bestThirds.ranking.filter(t => t.qualified)) {
    thirdByGroup.set(t.groupOrigin, t.teamId);
  }

  const matrix = fifaMatrixLookup(bestThirds.combinationKey);

  return BRACKET_STRUCTURE.filter(s => s.round === 'R32').map(def => {
    let homeTeamId: string | null = null;
    let awayTeamId: string | null = null;

    if (def.homeOrigin?.match(/^[12][A-L]$/)) {
      homeTeamId = originToTeam.get(def.homeOrigin) ?? null;
    }
    if (def.awayOrigin?.match(/^[12][A-L]$/)) {
      awayTeamId = originToTeam.get(def.awayOrigin) ?? null;
    }
    if (def.awayOrigin?.startsWith('3') && matrix) {
      const group = matrix[def.slotId];
      if (group) awayTeamId = thirdByGroup.get(group) ?? null;
    }

    return {
      slotId: def.slotId, round: def.round,
      homeTeamId, awayTeamId, winnerTeamId: null, loserTeamId: null,
    };
  });
}

// ─── Winner Propagation ──────────────────────────────────

export function propagateWinners(
  r32Slots: BracketSlotData[],
  knockoutResults: Map<string, MatchResult>,
  matchBySlot: Map<string, string>, // slotId → matchId
): BracketSlotData[] {
  const allSlots = new Map<string, BracketSlotData>();
  for (const s of r32Slots) allSlots.set(s.slotId, { ...s });

  const roundOrder: KnockoutRound[] = ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'];

  for (const round of roundOrder) {
    for (const def of BRACKET_STRUCTURE.filter(d => d.round === round)) {
      if (round === 'R32') {
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

// ─── Cascade Analyzer (D2) ───────────────────────────────

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
