// ═══════════════════════════════════════════════════════════
// Group Calculator — D21 multi-level FIFA tiebreak
// Pure function. No side effects.
// ═══════════════════════════════════════════════════════════

import type {
  TeamData, MatchData, MatchResult, TeamStandingRow,
  GroupStandingResult, GroupOverridePayload, FairPlayData,
} from '../types';
import { calculateFairPlayScore } from '../types';

interface GroupMatchResult extends MatchResult {
  homeTeamId: string;
  awayTeamId: string;
}

interface TeamStats {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  fairPlayScore: number;
  fifaRanking: number;
}

/**
 * Calculate group standings with D21 multi-level FIFA tiebreak.
 */
export function calculateGroupStandings(
  groupLetter: string,
  teams: TeamData[],
  matches: MatchData[],
  results: Map<string, MatchResult>,
  fairPlayData?: Map<string, { home: FairPlayData | null; away: FairPlayData | null }>,
  override?: GroupOverridePayload | null,
): GroupStandingResult {
  if (override) {
    return applyOverride(groupLetter, teams, matches, results, override);
  }

  const groupTeams = teams.filter(t => t.groupLetter === groupLetter);
  const groupMatches = matches.filter(m => m.groupLetter === groupLetter && m.phase === 'GROUP');

  // Build match results with team IDs
  const groupResults: GroupMatchResult[] = [];
  for (const match of groupMatches) {
    const result = results.get(match.id);
    if (!result || !match.homeTeamId || !match.awayTeamId) continue;
    groupResults.push({ ...result, homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId });
  }

  // Calculate base stats
  const statsMap = new Map<string, TeamStats>();
  for (const team of groupTeams) {
    statsMap.set(team.id, {
      teamId: team.id, played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
      points: 0, fairPlayScore: 0, fifaRanking: team.fifaRanking,
    });
  }

  for (const mr of groupResults) {
    const home = statsMap.get(mr.homeTeamId);
    const away = statsMap.get(mr.awayTeamId);
    if (!home || !away) continue;

    home.played++; away.played++;
    home.goalsFor += mr.homeGoals; home.goalsAgainst += mr.awayGoals;
    away.goalsFor += mr.awayGoals; away.goalsAgainst += mr.homeGoals;

    if (mr.homeGoals > mr.awayGoals) {
      home.won++; home.points += 3; away.lost++;
    } else if (mr.awayGoals > mr.homeGoals) {
      away.won++; away.points += 3; home.lost++;
    } else {
      home.drawn++; home.points += 1; away.drawn++; away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    const fp = fairPlayData?.get(mr.matchId);
    if (fp) {
      home.fairPlayScore += calculateFairPlayScore(fp.home);
      away.fairPlayScore += calculateFairPlayScore(fp.away);
    }
  }

  const allTeams = Array.from(statsMap.values());
  const sorted = resolvePositions(allTeams, groupResults);

  return {
    groupLetter,
    positions: sorted.map((entry, idx) => ({
      teamId: entry.team.teamId,
      position: idx + 1,
      played: entry.team.played,
      won: entry.team.won,
      drawn: entry.team.drawn,
      lost: entry.team.lost,
      goalsFor: entry.team.goalsFor,
      goalsAgainst: entry.team.goalsAgainst,
      goalDifference: entry.team.goalDifference,
      points: entry.team.points,
      fairPlayScore: entry.team.fairPlayScore,
      tiebreakExplanation: entry.explanation,
    })),
    hasOverride: false,
  };
}

// ─── D21 Multi-Level Tiebreak ────────────────────────────

interface ResolvedEntry {
  team: TeamStats;
  explanation: string;
}

function resolvePositions(teams: TeamStats[], allResults: GroupMatchResult[]): ResolvedEntry[] {
  teams.sort((a, b) => b.points - a.points);

  const result: ResolvedEntry[] = [];
  let i = 0;

  while (i < teams.length) {
    const samePoints: TeamStats[] = [teams[i]];
    let j = i + 1;
    while (j < teams.length && teams[j].points === teams[i].points) {
      samePoints.push(teams[j]);
      j++;
    }

    if (samePoints.length === 1) {
      result.push({ team: samePoints[0], explanation: 'Resolved by total points' });
    } else {
      result.push(...resolveTiedGroup(samePoints, allResults));
    }
    i = j;
  }

  return result;
}

function resolveTiedGroup(tiedTeams: TeamStats[], allResults: GroupMatchResult[]): ResolvedEntry[] {
  if (tiedTeams.length <= 1) {
    return tiedTeams.map(t => ({ team: t, explanation: 'No tiebreak needed' }));
  }

  const tiedIds = new Set(tiedTeams.map(t => t.teamId));

  // ── Level 2: Head-to-head among tied teams ──
  const h2hStats = new Map<string, TeamStats>();
  for (const t of tiedTeams) {
    h2hStats.set(t.teamId, {
      ...t, played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
    });
  }

  for (const mr of allResults) {
    if (!tiedIds.has(mr.homeTeamId) || !tiedIds.has(mr.awayTeamId)) continue;
    const home = h2hStats.get(mr.homeTeamId)!;
    const away = h2hStats.get(mr.awayTeamId)!;
    home.played++; away.played++;
    home.goalsFor += mr.homeGoals; home.goalsAgainst += mr.awayGoals;
    away.goalsFor += mr.awayGoals; away.goalsAgainst += mr.homeGoals;
    if (mr.homeGoals > mr.awayGoals) { home.won++; home.points += 3; away.lost++; }
    else if (mr.awayGoals > mr.homeGoals) { away.won++; away.points += 3; home.lost++; }
    else { home.drawn++; home.points += 1; away.drawn++; away.points += 1; }
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  const h2h = Array.from(h2hStats.values());

  // 2a) H2H points
  const byH2hPts = tryResolve(h2h, tiedTeams, t => h2hStats.get(t.teamId)!.points,
    (t, v) => `H2H points: ${v}`, true, allResults);
  if (byH2hPts) return byH2hPts;

  // 2b) H2H goal difference
  const byH2hGD = tryResolve(h2h, tiedTeams, t => h2hStats.get(t.teamId)!.goalDifference,
    (t, v) => `H2H goal diff: ${v > 0 ? '+' : ''}${v}`, true, allResults);
  if (byH2hGD) return byH2hGD;

  // 2c) H2H goals scored
  const byH2hGF = tryResolve(h2h, tiedTeams, t => h2hStats.get(t.teamId)!.goalsFor,
    (t, v) => `H2H goals for: ${v}`, true, allResults);
  if (byH2hGF) return byH2hGF;

  // ── Level 3: Overall group stats ──

  // 3d) Overall goal difference
  const byGD = tryResolveSimple(tiedTeams, t => t.goalDifference,
    (t, v) => `Overall goal diff: ${v > 0 ? '+' : ''}${v}`);
  if (byGD) return byGD;

  // 3e) Overall goals scored
  const byGF = tryResolveSimple(tiedTeams, t => t.goalsFor,
    (t, v) => `Overall goals for: ${v}`);
  if (byGF) return byGF;

  // 3f) Fair play (lower = better)
  tiedTeams.sort((a, b) => a.fairPlayScore - b.fairPlayScore);
  if (allDistinct(tiedTeams.map(t => t.fairPlayScore))) {
    return tiedTeams.map(t => ({
      team: t, explanation: `Fair play score: ${t.fairPlayScore}`,
    }));
  }

  // 3g) FIFA ranking (lower number = better)
  tiedTeams.sort((a, b) => a.fifaRanking - b.fifaRanking);
  if (allDistinct(tiedTeams.map(t => t.fifaRanking))) {
    return tiedTeams.map(t => ({
      team: t, explanation: `FIFA ranking: #${t.fifaRanking}`,
    }));
  }

  return tiedTeams.map(t => ({
    team: t, explanation: 'Unresolved — requires admin override',
  }));
}

// Try to resolve and handle partial resolution with recursion
function tryResolve(
  _h2h: TeamStats[], tiedTeams: TeamStats[],
  getValue: (t: TeamStats) => number,
  makeExpl: (t: TeamStats, v: number) => string,
  descending: boolean,
  allResults: GroupMatchResult[],
): ResolvedEntry[] | null {
  const sorted = [...tiedTeams].sort((a, b) =>
    descending ? getValue(b) - getValue(a) : getValue(a) - getValue(b));
  const values = sorted.map(getValue);

  if (allDistinct(values)) {
    return sorted.map(t => ({ team: t, explanation: makeExpl(t, getValue(t)) }));
  }

  // Check partial resolution
  const groups = groupByValue(sorted, getValue, descending);
  if (groups.length > 1) {
    const result: ResolvedEntry[] = [];
    for (const sub of groups) {
      if (sub.length === 1) {
        result.push({ team: sub[0], explanation: makeExpl(sub[0], getValue(sub[0])) });
      } else {
        result.push(...resolveTiedGroup(sub, allResults));
      }
    }
    return result;
  }

  return null;
}

function tryResolveSimple(
  tiedTeams: TeamStats[],
  getValue: (t: TeamStats) => number,
  makeExpl: (t: TeamStats, v: number) => string,
): ResolvedEntry[] | null {
  const sorted = [...tiedTeams].sort((a, b) => getValue(b) - getValue(a));
  if (allDistinct(sorted.map(getValue))) {
    return sorted.map(t => ({ team: t, explanation: makeExpl(t, getValue(t)) }));
  }
  return null;
}

function allDistinct(values: number[]): boolean {
  return new Set(values).size === values.length;
}

function groupByValue(items: TeamStats[], getValue: (t: TeamStats) => number, descending: boolean): TeamStats[][] {
  const sorted = [...items].sort((a, b) => descending ? getValue(b) - getValue(a) : getValue(a) - getValue(b));
  const groups: TeamStats[][] = [];
  let current: TeamStats[] = [];
  let currentVal: number | null = null;
  for (const item of sorted) {
    const val = getValue(item);
    if (currentVal !== null && val !== currentVal) { groups.push(current); current = []; }
    current.push(item);
    currentVal = val;
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

function applyOverride(
  groupLetter: string, teams: TeamData[], matches: MatchData[],
  results: Map<string, MatchResult>, override: GroupOverridePayload,
): GroupStandingResult {
  // Calculate real stats but use override positions
  const base = calculateGroupStandings(groupLetter, teams, matches, results);
  const positions = override.positions.map(op => {
    const existing = base.positions.find(p => p.teamId === op.teamId);
    return {
      ...(existing || { teamId: op.teamId, played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, fairPlayScore: 0 }),
      position: op.position,
      tiebreakExplanation: 'Position set by admin override',
    };
  });
  positions.sort((a, b) => a.position - b.position);
  return { groupLetter, positions, hasOverride: true };
}
