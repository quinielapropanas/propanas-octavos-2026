// ═══════════════════════════════════════════════════════════
// Best Thirds — Rank 12 thirds, qualify top 8
// ═══════════════════════════════════════════════════════════

import type { GroupStandingResult, ThirdPlaceTeam, BestThirdsResult } from '../types';

export function rankBestThirds(
  groupStandings: GroupStandingResult[],
  teamFifaRankings?: Map<string, number>,
): BestThirdsResult {
  const thirds: ThirdPlaceTeam[] = [];

  for (const standing of groupStandings) {
    const third = standing.positions.find(p => p.position === 3);
    if (!third) continue;
    thirds.push({
      teamId: third.teamId, groupOrigin: standing.groupLetter,
      played: third.played, won: third.won, drawn: third.drawn, lost: third.lost,
      goalsFor: third.goalsFor, goalsAgainst: third.goalsAgainst,
      goalDifference: third.goalDifference, points: third.points,
      fairPlayScore: third.fairPlayScore ?? 0, rank: 0, qualified: false,
    });
  }

  thirds.sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;
    // 2. Goal difference
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    // 3. Goals scored
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    // 4. Fair play / team conduct (lower = better)
    if (a.fairPlayScore !== b.fairPlayScore) return a.fairPlayScore - b.fairPlayScore;
    // 5. FIFA Ranking (lower number = better)
    if (teamFifaRankings) {
      const rankA = teamFifaRankings.get(a.teamId) ?? 999;
      const rankB = teamFifaRankings.get(b.teamId) ?? 999;
      if (rankA !== rankB) return rankA - rankB;
    }
    // 6. Alphabetical fallback
    return a.groupOrigin.localeCompare(b.groupOrigin);
  });

  thirds.forEach((t, i) => { t.rank = i + 1; t.qualified = i < 8; });

  const combinationKey = thirds.filter(t => t.qualified)
    .map(t => t.groupOrigin).sort().join('');

  return { ranking: thirds, combinationKey, hasOverride: false };
}