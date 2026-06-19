// ═══════════════════════════════════════════════════════════
// Participant Bracket Generator (CORRECTED)
//
// Uses FIFA official bracket structure + third-place matrix
// to produce deterministic, correct R32 matchups.
//
// Validated against golden master (Quiniela_IHO.xlsx).
// ═══════════════════════════════════════════════════════════

import { prisma } from '@/lib/db/client';
import { lookupFIFAMatrix } from './tournament/fifa-matrix';

interface TeamStanding {
  teamId: string;
  shortName: string;
  groupLetter: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

// ─── R32 Structure (FIFA official) ───────────────────────
// 'THIRD' means "a third-place team assigned via FIFA matrix"
const R32_STRUCTURE: Record<string, { home: string; away: string }> = {
  'R32-01': { home: '2A', away: '2B' },
  'R32-02': { home: '1E', away: 'THIRD' },   // host 1E
  'R32-03': { home: '1F', away: '2C' },
  'R32-04': { home: '1C', away: '2F' },
  'R32-05': { home: '1I', away: 'THIRD' },   // host 1I
  'R32-06': { home: '2E', away: '2I' },
  'R32-07': { home: '1A', away: 'THIRD' },   // host 1A
  'R32-08': { home: '1L', away: 'THIRD' },   // host 1L
  'R32-09': { home: '1D', away: 'THIRD' },   // host 1D
  'R32-10': { home: '1G', away: 'THIRD' },   // host 1G
  'R32-11': { home: '2K', away: '2L' },
  'R32-12': { home: '1H', away: '2J' },
  'R32-13': { home: '1B', away: 'THIRD' },   // host 1B
  'R32-14': { home: '1J', away: '2H' },
  'R32-15': { home: '1K', away: 'THIRD' },   // host 1K
  'R32-16': { home: '2D', away: '2G' },
};

// ─── Bracket Progression (FIFA official) ─────────────────
const BRACKET_PROGRESSION: Record<string, Array<{ slotId: string; homeFrom: string; awayFrom: string }>> = {
  R32: [
    { slotId: 'R16-01', homeFrom: 'R32-02', awayFrom: 'R32-05' },
    { slotId: 'R16-02', homeFrom: 'R32-01', awayFrom: 'R32-03' },
    { slotId: 'R16-03', homeFrom: 'R32-04', awayFrom: 'R32-06' },
    { slotId: 'R16-04', homeFrom: 'R32-07', awayFrom: 'R32-08' },
    { slotId: 'R16-05', homeFrom: 'R32-11', awayFrom: 'R32-12' },
    { slotId: 'R16-06', homeFrom: 'R32-09', awayFrom: 'R32-10' },
    { slotId: 'R16-07', homeFrom: 'R32-14', awayFrom: 'R32-16' },
    { slotId: 'R16-08', homeFrom: 'R32-13', awayFrom: 'R32-15' },
  ],
  R16: [
    { slotId: 'QF-01', homeFrom: 'R16-01', awayFrom: 'R16-02' },
    { slotId: 'QF-02', homeFrom: 'R16-05', awayFrom: 'R16-06' },
    { slotId: 'QF-03', homeFrom: 'R16-03', awayFrom: 'R16-04' },
    { slotId: 'QF-04', homeFrom: 'R16-07', awayFrom: 'R16-08' },
  ],
  QF: [
    { slotId: 'SF-01', homeFrom: 'QF-01', awayFrom: 'QF-02' },
    { slotId: 'SF-02', homeFrom: 'QF-03', awayFrom: 'QF-04' },
  ],
  SF: [
    { slotId: '3RD-01', homeFrom: 'SF-01', awayFrom: 'SF-02' },
    { slotId: 'F-01', homeFrom: 'SF-01', awayFrom: 'SF-02' },
  ],
};

// ─── Third-place hosts (fixed order per FIFA rules) ──────
const THIRD_PLACE_HOSTS = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L'];

// Which R32 slot corresponds to each host (for third-place assignment)
const HOST_TO_R32_SLOT: Record<string, string> = {
  '1A': 'R32-07',
  '1B': 'R32-13',
  '1D': 'R32-09',
  '1E': 'R32-02',
  '1G': 'R32-10',
  '1I': 'R32-05',
  '1K': 'R32-15',
  '1L': 'R32-08',
};



// ═══════════════════════════════════════════════════════════
// MAIN: Generate R32 from group predictions
// ═══════════════════════════════════════════════════════════

export async function generateParticipantBracket(
  poolId: string,
  userId: string,
  entryId?: string,
): Promise<{ generated: boolean; slotsCreated: number }> {

  // 1. Check if all 72 group predictions are complete
const allGroupPredictions = await prisma.prediction.findMany({
    where: {
      poolId, userId, status: 'VALID',
      ...(entryId ? { entryId } : {}),
      homeGoals: { not: null },
      match: { phase: 'GROUP' },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      match: {
        select: {
          id: true, groupLetter: true,
          homeTeamId: true, awayTeamId: true,
          homeTeam: { select: { id: true, shortName: true, groupLetter: true } },
          awayTeam: { select: { id: true, shortName: true, groupLetter: true } },
        },
      },
    },
  });

  // Deduplicate: keep only the latest prediction per match
  const seen = new Set<string>();
  const groupPredictions = allGroupPredictions.filter(p => {
    if (seen.has(p.matchId)) return false;
    seen.add(p.matchId);
    return true;
  });

  if (groupPredictions.length < 72) {
    return { generated: false, slotsCreated: 0 };
  }

  // 2. Calculate standings for each group
  const allStandings = calculateAllGroupStandings(groupPredictions);

  // 3. Build team lookup: "1A" → teamId, "2B" → teamId, etc.
  const teamLookup = new Map<string, string>();
  for (const s of allStandings) {
    teamLookup.set(`${s.position}${s.groupLetter}`, s.teamId);
  }

  // 4. Determine best third-place teams
  const thirdPlaceTeams = allStandings
    .filter(s => s.position === 3)
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor
    );

  // Check if user already confirmed a custom order
  const confirmedThirds = await prisma.bestThirds.findFirst({
    where: { poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId },
  });

  let qualifyingThirds: TeamStanding[];
  let combinationKey: string;

  if (confirmedThirds && (confirmedThirds as any).confirmed) {
    // Use the confirmed order
    const confirmedRanking = confirmedThirds.ranking as any[];
    const confirmedTop8 = confirmedRanking.filter((r: any) => r.qualifies);

    // Map confirmed ranking back to TeamStanding objects
    qualifyingThirds = confirmedTop8.map((r: any) => {
      const standing = thirdPlaceTeams.find(t => t.teamId === r.teamId);
      return standing ?? {
        teamId: r.teamId, shortName: '', groupLetter: r.groupLetter,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: r.goalsFor ?? 0, goalsAgainst: 0,
        goalDifference: r.goalDifference ?? 0, points: r.points ?? 0, position: 3,
      };
    });

    combinationKey = qualifyingThirds
      .map(t => t.groupLetter)
      .sort()
      .join('');
  } else {
    // Use calculated order
    qualifyingThirds = thirdPlaceTeams.slice(0, 8);
    combinationKey = qualifyingThirds
      .map(t => t.groupLetter)
      .sort()
      .join('');
  }
  
  // 5. Get third-place assignment from FIFA matrix
  const thirdToTeamId = new Map<string, string>(); // groupLetter → teamId
  for (const t of qualifyingThirds) {
    thirdToTeamId.set(t.groupLetter, t.teamId);
  }

  // Lookup matrix row for this combination
 const matrixRow = lookupFIFAMatrix(combinationKey);

  // Build host → third teamId mapping
  const hostToThirdTeamId = new Map<string, string>(); // "1A" → teamId

  if (matrixRow) {
    // Deterministic: use official FIFA Annexe C matrix
    THIRD_PLACE_HOSTS.forEach((host, i) => {
      const thirdGroup = matrixRow[i];
      const teamId = thirdToTeamId.get(thirdGroup);
      if (teamId) hostToThirdTeamId.set(host, teamId);
    });
    console.log(`[bracket-generator] Annexe C: key="${combinationKey}", assignment=[${matrixRow.join(',')}]`);
  } else {
    console.error(`[bracket-generator] CRITICAL: No Annexe C entry for key "${combinationKey}". This should never happen with 495 combinations.`);
  }

  // 6. Resolve R32 slots
  const r32Slots: Array<{
    slotId: string;
    homeTeamId: string | null;
    awayTeamId: string | null;
  }> = [];

  for (const [slotId, structure] of Object.entries(R32_STRUCTURE)) {
    const homeTeamId = teamLookup.get(structure.home) ?? null;
    let awayTeamId: string | null = null;

    if (structure.away === 'THIRD') {
      awayTeamId = hostToThirdTeamId.get(structure.home) ?? null;
    } else {
      awayTeamId = teamLookup.get(structure.away) ?? null;
    }

    r32Slots.push({ slotId, homeTeamId, awayTeamId });
  }

  // 7. Save data to database

  // Delete existing participant bracket + standings
  await prisma.bracketSlot.deleteMany({
    where: { poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId },
  });
  await prisma.groupStanding.deleteMany({
    where: { poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId },
  });

  // Save group standings
  const groupLetters = [...new Set(allStandings.map(s => s.groupLetter))];
  for (const letter of groupLetters) {
    const groupRows = allStandings.filter(s => s.groupLetter === letter);
    await prisma.groupStanding.upsert({
      where: {
        poolId_contextKey_groupLetter: {
          poolId, contextKey: entryId ?? userId, groupLetter: letter,
        },
      },
      update: {
        contextType: 'PARTICIPANT',
        positions: groupRows.map(r => ({
          teamId: r.teamId, position: r.position,
          played: r.played, won: r.won, drawn: r.drawn, lost: r.lost,
          goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst,
          goalDifference: r.goalDifference, points: r.points,
        })),
      },
      create: {
        poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId,
        groupLetter: letter,
        positions: groupRows.map(r => ({
          teamId: r.teamId, position: r.position,
          played: r.played, won: r.won, drawn: r.drawn, lost: r.lost,
          goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst,
          goalDifference: r.goalDifference, points: r.points,
        })),
      },
    });
  }

  // Save best thirds (upsert to avoid unique constraint)
  await prisma.bestThirds.upsert({
    where: {
      poolId_contextKey: { poolId, contextKey: entryId ?? userId },
    },
    update: {
      contextType: 'PARTICIPANT',
      combinationKey,
      ranking: thirdPlaceTeams.map((t, i) => ({
        groupLetter: t.groupLetter, teamId: t.teamId,
        points: t.points, goalDifference: t.goalDifference,
        goalsFor: t.goalsFor, qualifies: i < 8,
      })),
    },
    create: {
      poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId,
      combinationKey,
      ranking: thirdPlaceTeams.map((t, i) => ({
        groupLetter: t.groupLetter, teamId: t.teamId,
        points: t.points, goalDifference: t.goalDifference,
        goalsFor: t.goalsFor, qualifies: i < 8,
      })),
    },
  });

  // Save R32 bracket slots (upsert to avoid unique constraint)
  for (const slot of r32Slots) {
    await prisma.bracketSlot.upsert({
      where: {
        poolId_contextKey_slotId: {
          poolId, contextKey: entryId ?? userId, slotId: slot.slotId,
        },
      },
      update: {
        homeTeamId: slot.homeTeamId,
        awayTeamId: slot.awayTeamId,
      },
      create: {
        poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId,
        slotId: slot.slotId, round: 'R32',
        homeTeamId: slot.homeTeamId, awayTeamId: slot.awayTeamId,
      },
    });
  }

  return { generated: true, slotsCreated: r32Slots.length };
}

// ═══════════════════════════════════════════════════════════
// Advance bracket round (R32→R16→QF→SF→3RD+FINAL)
// ═══════════════════════════════════════════════════════════

export async function advanceBracketRound(
  poolId: string,
  userId: string,
  entryId?: string,
): Promise<{ advanced: boolean; round: string; slotsCreated: number }> {

  const rounds: Array<{ round: string; count: number; nextRound: string; nextCount: number }> = [
    { round: 'R32', count: 16, nextRound: 'R16', nextCount: 8 },
    { round: 'R16', count: 8, nextRound: 'QF', nextCount: 4 },
    { round: 'QF', count: 4, nextRound: 'SF', nextCount: 2 },
    { round: 'SF', count: 2, nextRound: 'THIRD', nextCount: 1 },
  ];

  for (const { round, count, nextRound, nextCount } of rounds) {
   const currentPredictions = await prisma.prediction.findMany({
      where: {
        poolId, userId, status: 'VALID',
        ...(entryId ? { entryId } : {}),
        homeGoals: { not: null },
        match: { phase: round  as any},
      },
    });

    if (currentPredictions.length < count) continue;

    // For SF→THIRD, check if BOTH 3RD-01 and F-01 exist
    const checkRounds = round === 'SF' ? ['THIRD', 'FINAL'] : [nextRound];
    const existingNext = await prisma.bracketSlot.count({
      where: {
        poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId,
        round: { in: checkRounds as any },
      },
    });

    const expectedCount = round === 'SF' ? 2 : nextCount;
    if (existingNext >= expectedCount) continue;

    const currentSlots = await prisma.bracketSlot.findMany({
      where: { poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId, round: round as any },
      orderBy: { slotId: 'asc' },
    });

    const slotPredictions = await prisma.prediction.findMany({
      where: {
        poolId, userId, status: 'VALID',
        ...(entryId ? { entryId } : {}),
        homeGoals: { not: null },
        match: { phase: round as any, poolId },
      },
      include: { match: { select: { slotId: true } } },
    });

    // Map slotId → winner teamId
    const winners = new Map<string, string>();
    const losers = new Map<string, string>();
    for (const pred of slotPredictions) {
      const slot = currentSlots.find(s => s.slotId === pred.match.slotId);
      if (!slot || !slot.homeTeamId || !slot.awayTeamId) continue;

      let winnerId: string;
      let loserId: string;
      if (pred.homeGoals! > pred.awayGoals!) {
        winnerId = slot.homeTeamId;
        loserId = slot.awayTeamId;
      } else if (pred.awayGoals! > pred.homeGoals!) {
        winnerId = slot.awayTeamId;
        loserId = slot.homeTeamId;
      } else {
        winnerId = (pred.homePenalties ?? 0) > (pred.awayPenalties ?? 0)
          ? slot.homeTeamId : slot.awayTeamId;
        loserId = winnerId === slot.homeTeamId ? slot.awayTeamId : slot.homeTeamId;
      }
      winners.set(slot.slotId, winnerId);
      losers.set(slot.slotId, loserId);
    }

    // Generate next round slots
    const progression = BRACKET_PROGRESSION[round] ?? [];
    const nextSlots: Array<{ slotId: string; round: string; homeTeamId: string | null; awayTeamId: string | null }> = [];

    for (const prog of progression) {
      let homeTeamId: string | null = null;
      let awayTeamId: string | null = null;

      if (round === 'SF') {
        if (prog.slotId === '3RD-01') {
          // Third place match: losers of semifinals
          homeTeamId = losers.get(prog.homeFrom) ?? null;
          awayTeamId = losers.get(prog.awayFrom) ?? null;
        } else {
          // Final: winners of semifinals
          homeTeamId = winners.get(prog.homeFrom) ?? null;
          awayTeamId = winners.get(prog.awayFrom) ?? null;
        }
      } else {
        homeTeamId = winners.get(prog.homeFrom) ?? null;
        awayTeamId = winners.get(prog.awayFrom) ?? null;
      }

      const slotRound = prog.slotId === '3RD-01' ? 'THIRD'
        : prog.slotId === 'F-01' ? 'FINAL'
        : nextRound;

      nextSlots.push({ slotId: prog.slotId, round: slotRound, homeTeamId, awayTeamId });
    }

    for (const slot of nextSlots) {
      await prisma.bracketSlot.upsert({
        where: {
          poolId_contextKey_slotId: {
            poolId, contextKey: entryId ?? userId, slotId: slot.slotId,
          },
        },
        update: { homeTeamId: slot.homeTeamId, awayTeamId: slot.awayTeamId },
        create: {
          poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId,
          slotId: slot.slotId, round: slot.round as any,
          homeTeamId: slot.homeTeamId, awayTeamId: slot.awayTeamId,
        },
      });
    }

    return { advanced: true, round: nextRound, slotsCreated: nextSlots.length };
  }

  return { advanced: false, round: '', slotsCreated: 0 };
}

// ═══════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════

function calculateAllGroupStandings(predictions: any[]): TeamStanding[] {
  const groups = new Map<string, Map<string, TeamStanding>>();
  // Store individual match results for h2h tiebreak
  const matchResults: Array<{ groupLetter: string; homeId: string; awayId: string; homeGoals: number; awayGoals: number }> = [];

  for (const pred of predictions) {
    const match = pred.match;
    const letter = match.groupLetter;
    if (!groups.has(letter)) groups.set(letter, new Map());
    const group = groups.get(letter)!;

    for (const team of [match.homeTeam, match.awayTeam]) {
      if (team && !group.has(team.id)) {
        group.set(team.id, {
          teamId: team.id, shortName: team.shortName, groupLetter: letter,
          played: 0, won: 0, drawn: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, position: 0,
        });
      }
    }
  }

  for (const pred of predictions) {
    const match = pred.match;
    const letter = match.groupLetter;
    const group = groups.get(letter)!;
    const home = group.get(match.homeTeamId);
    const away = group.get(match.awayTeamId);
    if (!home || !away) continue;

    const hg = pred.homeGoals as number;
    const ag = pred.awayGoals as number;

    // Store for h2h lookup
    matchResults.push({ groupLetter: letter, homeId: match.homeTeamId, awayId: match.awayTeamId, homeGoals: hg, awayGoals: ag });

    home.played++; away.played++;
    home.goalsFor += hg; home.goalsAgainst += ag;
    away.goalsFor += ag; away.goalsAgainst += hg;

    if (hg > ag) {
      home.won++; home.points += 3;
      away.lost++;
    } else if (hg < ag) {
      away.won++; away.points += 3;
      home.lost++;
    } else {
      home.drawn++; away.drawn++;
      home.points += 1; away.points += 1;
    }
  }

  // Head-to-head comparison between two teams
  function getH2HPoints(teamA: string, teamB: string, group: string): { a: number; b: number } {
    let aPoints = 0, bPoints = 0;
    for (const m of matchResults) {
      if (m.groupLetter !== group) continue;
      if (m.homeId === teamA && m.awayId === teamB) {
        if (m.homeGoals > m.awayGoals) aPoints += 3;
        else if (m.homeGoals === m.awayGoals) { aPoints += 1; bPoints += 1; }
        else bPoints += 3;
      } else if (m.homeId === teamB && m.awayId === teamA) {
        if (m.homeGoals > m.awayGoals) bPoints += 3;
        else if (m.homeGoals === m.awayGoals) { aPoints += 1; bPoints += 1; }
        else aPoints += 3;
      }
    }
    return { a: aPoints, b: bPoints };
  }

  const allStandings: TeamStanding[] = [];
  for (const [letter, group] of groups) {
    const sorted = Array.from(group.values())
      .map(t => ({ ...t, goalDifference: t.goalsFor - t.goalsAgainst }));

   // Sort with h2h tiebreak
   sorted.sort((a, b) => {
      // 1. Points
      if (b.points !== a.points) return b.points - a.points;
      // 2. Head-to-head (FIFA: before goal difference)
      const h2h = getH2HPoints(a.teamId, b.teamId, letter);
      if (h2h.a !== h2h.b) return h2h.b - h2h.a;
      // 3. Goal difference
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      // 4. Goals scored
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      // 5. Alphabetical fallback
      return a.shortName.localeCompare(b.shortName);
    });

    sorted.forEach((t, i) => { t.position = i + 1; });
    allStandings.push(...sorted);
  }

  return allStandings;
}

/** Fallback for when the FIFA matrix doesn't have the combination key */
function backtrackThirdAssignment(
  qualifyingThirds: TeamStanding[],
  hostToThirdTeamId: Map<string, string>,
) {
  // Map of which groups can face each host (from the original R32 structure)
  const hostConstraints: Record<string, string[]> = {
    '1A': ['C', 'E', 'F', 'H', 'I'],
    '1B': ['E', 'F', 'G', 'I', 'J'],
    '1D': ['B', 'E', 'F', 'I', 'J'],
    '1E': ['A', 'B', 'C', 'D', 'F'],
    '1G': ['A', 'E', 'H', 'I', 'J'],
    '1I': ['C', 'D', 'F', 'G', 'H'],
    '1K': ['D', 'E', 'I', 'J', 'L'],
    '1L': ['E', 'H', 'I', 'J', 'K'],
  };

  const qualifyingGroups = new Set(qualifyingThirds.map(t => t.groupLetter));
  const usedGroups = new Set<string>();

  // Sort hosts by most constrained first
  const sortedHosts = [...THIRD_PLACE_HOSTS].sort((a, b) => {
    const aOpts = hostConstraints[a].filter(g => qualifyingGroups.has(g)).length;
    const bOpts = hostConstraints[b].filter(g => qualifyingGroups.has(g)).length;
    return aOpts - bOpts;
  });

  function solve(idx: number): boolean {
    if (idx >= sortedHosts.length) return true;
    const host = sortedHosts[idx];
    const possible = hostConstraints[host].filter(g => qualifyingGroups.has(g) && !usedGroups.has(g));

    for (const group of possible) {
      usedGroups.add(group);
      const third = qualifyingThirds.find(t => t.groupLetter === group);
      if (third) {
        hostToThirdTeamId.set(host, third.teamId);
        if (solve(idx + 1)) return true;
        hostToThirdTeamId.delete(host);
      }
      usedGroups.delete(group);
    }
    return false;
  }

  solve(0);
}
