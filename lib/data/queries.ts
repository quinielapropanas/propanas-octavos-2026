// ═══════════════════════════════════════════════════════════
// Server-Side Data Queries — Prisma accessors
//
// Called from Server Components. Direct DB access, no HTTP hop.
// Returns typed data ready for rendering.
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// Server-Side Data Queries — Prisma accessors
// ═══════════════════════════════════════════════════════════

import 'server-only';
import { prisma } from '@/lib/db/client';
import type {
  DashboardData, GroupData, LeaderboardData, BreakdownData,
  ProfileData, BracketData, AdminDashboardData, PendingMatchRow,
  AuditLogEntry, TeamBrief, MatchBrief, PredictionBrief,
  GroupStandingRow, BracketSlot, EntryStatus,
} from './types';

// ─── Helpers ─────────────────────────────────────────────

function toTeamBrief(team: any): TeamBrief {
  return {
    id: team.id, name: team.name, shortName: team.shortName,
    flagAssetKey: team.flagAssetKey, groupLetter: team.groupLetter,
  };
}

function toMatchBrief(m: any): MatchBrief {
  return {
    id: m.id, matchNumber: m.matchNumber, phase: m.phase,
    groupLetter: m.groupLetter, slotId: m.slotId,
    scheduledAt: m.scheduledAt, venue: m.venue, city: m.city,
    homeTeam: m.homeTeam ? toTeamBrief(m.homeTeam) : null,
    awayTeam: m.awayTeam ? toTeamBrief(m.awayTeam) : null,
    homeOrigin: m.homeOrigin, awayOrigin: m.awayOrigin,
  };
}

async function getNextDeadline(poolId: string): Promise<Date | null> {
  const now = new Date();
  const deadlines = await prisma.poolDeadline.findMany({
    where: { poolId, deadlineAt: { gt: now } },
    orderBy: { deadlineAt: 'asc' },
    take: 1,
  });
  return deadlines[0]?.deadlineAt ?? null;
}

// ═══════════════════════════════════════════════════════════
// Dashboard (participant)
// ═══════════════════════════════════════════════════════════

export async function getDashboardData(userId: string, poolId: string, entryId?: string): Promise<DashboardData> {
  const entryFilter = entryId ? { entryId } : {};

  const [entry, ranking, nextMatchRaw, predictions, groupPredictions, nextDeadline] = await Promise.all([
    entryId
      ? prisma.entry.findUnique({ where: { id: entryId } })
      : prisma.entry.findFirst({ where: { poolId, userId }, orderBy: { entryNumber: 'asc' } }),
    entryId
      ? prisma.ranking.findFirst({ where: { poolId, userId: entryId } })
      : prisma.ranking.findFirst({ where: { poolId, userId } }),
    prisma.match.findFirst({
      where: { poolId, scheduledAt: { gt: new Date() }, result: null },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.prediction.count({
      where: { poolId, userId, ...entryFilter, status: 'VALID', homeGoals: { not: null } },
    }),
    prisma.prediction.findMany({
      where: { poolId, userId, ...entryFilter, status: 'VALID', homeGoals: { not: null },
        match: { phase: 'GROUP' } },
      select: { match: { select: { groupLetter: true } } },
    }),
    getNextDeadline(poolId),
  ]);

  const groupCompletion: Record<string, { predicted: number; total: 6 }> = {};
  for (const letter of 'ABCDEFGHIJKL'.split('')) {
    groupCompletion[letter] = { predicted: 0, total: 6 };
  }
  for (const p of groupPredictions) {
    const letter = p.match.groupLetter;
    if (letter) groupCompletion[letter].predicted++;
  }

  return {
    position: ranking?.position ?? null,
    totalPoints: ranking?.totalPoints ?? 0,
    completionPct: entry?.completionPct ?? 0,
    matchesPredicted: predictions,
    totalMatches: 16,
    entryStatus: (entry?.status ?? 'DRAFT') as EntryStatus,
    nextDeadlineAt: nextDeadline,
    nextMatch: nextMatchRaw ? toMatchBrief(nextMatchRaw) : null,
    groupCompletion,
  };
}

// ═══════════════════════════════════════════════════════════
// Group data (participant)
// ═══════════════════════════════════════════════════════════

export async function getGroupData(
  groupLetter: string, userId: string, poolId: string, entryId?: string,
): Promise<GroupData> {
  const [teams, matches, entry, officialStanding, participantStanding] = await Promise.all([
    prisma.team.findMany({
      where: { poolId, groupLetter },
      orderBy: { shortName: 'asc' },
    }),
    prisma.match.findMany({
      where: { poolId, phase: 'GROUP', groupLetter },
      include: {
        homeTeam: true, awayTeam: true, result: true,
        predictions: {
          where: entryId
            ? { userId, entryId }
            : { userId },
          take: 1,
        },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    entryId
      ? prisma.entry.findUnique({ where: { id: entryId } })
      : prisma.entry.findFirst({ where: { poolId, userId }, orderBy: { entryNumber: 'asc' } }),
    prisma.groupStanding.findFirst({
      where: { poolId, contextType: 'OFFICIAL', groupLetter },
    }),
    prisma.groupStanding.findFirst({
      where: { poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId, groupLetter },
    }),
  ]);

  const entryLocked = entry?.status === 'LOCKED';

  const now = new Date();
  const matchesWithPred = matches.map(m => {
    const pred = m.predictions[0] ?? null;
    const locked = entryLocked || (pred?.lockedAt != null && pred.lockedAt < now);
    return {
      match: toMatchBrief(m),
      prediction: pred ? {
        matchId: pred.matchId,
        homeGoals: pred.homeGoals, awayGoals: pred.awayGoals,
        homePenalties: pred.homePenalties, awayPenalties: pred.awayPenalties,
        status: pred.status as 'VALID' | 'INVALIDATED_BY_CASCADE',
        lockedAt: pred.lockedAt,
      } as PredictionBrief : null,
      result: m.result ? {
        matchId: m.result.matchId,
        homeGoals: m.result.homeGoals, awayGoals: m.result.awayGoals,
        homePenalties: m.result.homePenalties, awayPenalties: m.result.awayPenalties,
      } : null,
      pointsEarned: null,
      locked,
    };
  });

  const parseStanding = (positions: any): GroupStandingRow[] =>
    Array.isArray(positions) ? positions.map((p: any) => ({
      teamId: p.teamId, position: p.position,
      played: p.played, won: p.won, drawn: p.drawn, lost: p.lost,
      goalsFor: p.goalsFor, goalsAgainst: p.goalsAgainst,
      goalDifference: p.goalDifference, points: p.points,
    })) : [];

  return {
    groupLetter,
    teams: teams.map(toTeamBrief),
    matches: matchesWithPred,
    participantStandings: participantStanding ? parseStanding(participantStanding.positions) : null,
    officialStandings: officialStanding ? parseStanding(officialStanding.positions) : null,
    locked: entryLocked,
  };
}

// ═══════════════════════════════════════════════════════════
// Leaderboard
// ═══════════════════════════════════════════════════════════

export async function getLeaderboardData(
  poolId: string, currentUserId: string,
  page: number = 1, limit: number = 50,
  isAdmin: boolean = false,
): Promise<LeaderboardData> {
  const skip = (page - 1) * limit;

// Check if draft entries should be shown
  const behaviorFlags = await prisma.poolBehaviorFlags.findFirst({
    where: { poolId },
  });
  const showDraftInRanking = (behaviorFlags as any)?.showDraftInRanking ?? true;
  
 // Get admin userIds to exclude
  const adminMembers = await prisma.poolMembership.findMany({
    where: { poolId, role: 'ADMIN' },
    select: { userId: true },
  });
  const adminIds = adminMembers.map(m => m.userId);

  const [allEntries, rankings, myRanking] = await Promise.all([
   prisma.entry.findMany({
      where: {
        poolId,
        userId: { notIn: adminIds },
        ...(!isAdmin && !showDraftInRanking ? { status: { not: 'DRAFT' } } : {}),
      },
      orderBy: { entryNumber: 'asc' },
      select: { id: true, userId: true, displayName: true, completionPct: true, status: true },
    }),
    prisma.ranking.findMany({
      where: { poolId },
    }),
    prisma.ranking.findUnique({
      where: { poolId_userId: { poolId, userId: currentUserId } },
    }),
  ]);

  // Build ranking map: userId → ranking data
  const rankingMap = new Map(rankings.map(r => [r.userId, r]));

  // Merge entries with rankings
  const merged = allEntries.map(entry => {
    const ranking = rankingMap.get(entry.id) ?? rankingMap.get(entry.userId);
    return {
      userId: entry.userId,
      entryId: entry.id,
      displayName: entry.displayName ?? 'Sin nombre',
      totalPoints: ranking?.totalPoints ?? 0,
      phase1Points: ranking?.phase1Points ?? 0,
      phase2Points: ranking?.phase2Points ?? 0,
      matchesPredicted: ranking?.matchesPredicted ?? 0,
      completionPct: entry.completionPct ?? 0,
	  entryStatus: (entry as any).status ?? 'DRAFT',
    };
  });

// Sort by points descending, then alphabetical by display name
  merged.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return (a.displayName ?? '').localeCompare(b.displayName ?? '');
  });
  // Block positions: same points = same position, next block = next position
  let currentPosition = 0;
  let previousPoints: number | null = null;
  for (let i = 0; i < merged.length; i++) {
    if (merged[i].totalPoints !== previousPoints) {
      currentPosition += 1;
      previousPoints = merged[i].totalPoints;
    }
    (merged[i] as any).position = currentPosition;
  }

  const total = merged.length;
  const paged = merged.slice(skip, skip + limit);

  return {
	entries: paged.map(m => ({
      userId: m.userId,
      entryId: (m as any).entryId ?? m.userId,
      displayName: m.displayName,
      totalPoints: m.totalPoints,
      phase1Points: m.phase1Points,
      phase2Points: m.phase2Points,
      position: (m as any).position,
      matchesPredicted: m.matchesPredicted,
	  completionPct: m.completionPct ?? 0,
      isCurrentUser: m.userId === currentUserId,
	  entryStatus: (m as any).entryStatus ?? 'DRAFT',
    })),
    myPosition: myRanking?.position ?? null,
    myPoints: myRanking?.totalPoints ?? 0,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ═══════════════════════════════════════════════════════════
// Breakdown
// ═══════════════════════════════════════════════════════════

export async function getBreakdownData(userId: string, poolId: string): Promise<BreakdownData | null> {
  const [user, ranking, breakdowns, concepts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.ranking.findUnique({ where: { poolId_userId: { poolId, userId } } }),
    prisma.scoreBreakdown.findMany({
      where: { poolId, userId },
      orderBy: [{ conceptId: 'asc' }, { matchId: 'asc' }],
      include: { pool: false },
    }),
    prisma.poolScoringConcept.findMany({
      where: { poolId }, orderBy: { conceptId: 'asc' },
    }),
  ]);

  if (!user) return null;

  const matchIds = Array.from(new Set(breakdowns.map(b => b.matchId).filter(Boolean))) as string[];
  const matches = matchIds.length > 0
    ? await prisma.match.findMany({
        where: { id: { in: matchIds } },
        select: { id: true, matchNumber: true },
      })
    : [];
  const matchNumMap = new Map(matches.map(m => [m.id, m.matchNumber]));

  const conceptSummary = concepts.map(c => {
    const conceptBreakdowns = breakdowns.filter(b => b.conceptId === c.conceptId);
    const totalAwarded = conceptBreakdowns.reduce((s, b) => s + b.pointsAwarded, 0);
    return {
      conceptId: c.conceptId, name: c.name, maxPoints: c.points, isActive: c.isActive,
      totalAwarded,
      details: conceptBreakdowns.map(b => ({
        matchId: b.matchId, slotId: b.slotId,
        pointsAwarded: b.pointsAwarded, explanation: b.explanation,
        matchNumber: b.matchId ? matchNumMap.get(b.matchId) : undefined,
      })),
    };
  });

  const entry = await prisma.entry.findFirst({
    where: { poolId, userId },
    orderBy: { entryNumber: 'asc' },
    select: { displayName: true },
  });

  return {
    userId, displayName: entry?.displayName ?? user.displayName,
    totalPoints: ranking?.totalPoints ?? 0,
    phase1Points: ranking?.phase1Points ?? 0,
    phase2Points: ranking?.phase2Points ?? 0,
    position: ranking?.position ?? null,
    concepts: conceptSummary,
  };
}

// ═══════════════════════════════════════════════════════════
// Profile
// ═══════════════════════════════════════════════════════════

export async function getProfileData(userId: string, poolId: string): Promise<ProfileData> {
  const [user, entry, profile, topScorer, nextDeadline] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.entry.findFirst({ where: { poolId, userId }, orderBy: { entryNumber: 'asc' } }),
    prisma.userProfile.findUnique({ where: { userId_poolId: { userId, poolId } } }),
    prisma.topScorerPrediction.findFirst({ where: { poolId, userId } }),
    getNextDeadline(poolId),
  ]);

  const entryStatus = (entry?.status ?? 'DRAFT') as EntryStatus;
  const deadlinesPassed = nextDeadline == null;

  return {
    userId,
    email: user?.email ?? '',
    displayName: entry?.displayName ?? user?.displayName ?? '',
    fullName: profile?.fullName ?? null,
    country: (user as any)?.country ?? profile?.country ?? null,
    city: (user as any)?.city ?? profile?.city ?? null,
    entryStatus,
    entrySubmittedAt: entry?.submittedAt ?? null,
    entryLockedAt: entry?.lockedAt ?? null,
    entryLockedReason: entry?.lockedReason ?? null,
    completionPct: entry?.completionPct ?? 0,
    topScorer: topScorer ? {
      playerName: topScorer.playerName,
      teamId: topScorer.teamId,
      goals: topScorer.goals,
    } : null,
    canSubmit: entryStatus === 'DRAFT',
    canUnsubmit: entryStatus === 'SUBMITTED' && !deadlinesPassed,
  };
}

// ═══════════════════════════════════════════════════════════
// Bracket (participant + official)
// ═══════════════════════════════════════════════════════════

export async function getBracketData(userId: string, poolId: string, entryId?: string): Promise<BracketData> {
  const [participantSlots, officialSlots, knockoutMatches, participantBestThirds] = await Promise.all([
    prisma.bracketSlot.findMany({
      where: { poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId },
      orderBy: { slotId: 'asc' },
    }),
    prisma.bracketSlot.findMany({
      where: { poolId, contextType: 'OFFICIAL' },
      orderBy: { slotId: 'asc' },
    }),
    prisma.match.findMany({
      where: { poolId, phase: { not: 'GROUP' } },
      include: {
        result: true,
        predictions: { where: { userId, ...(entryId ? { entryId } : {}) }, take: 1 },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.bestThirds.findFirst({
      where: { poolId, contextType: 'PARTICIPANT', contextKey: entryId ?? userId },
    }),
  ]);

  const teamById = await getTeamLookup(poolId);
  const matchBySlotId = new Map(knockoutMatches.map(m => [m.slotId, m]));

  const buildSlot = (s: any): BracketSlot => {
    const match = matchBySlotId.get(s.slotId);
    const pred = match?.predictions?.[0] ?? null;
    const isParticipantView = s.contextType === 'PARTICIPANT';

    const src = isParticipantView ? pred : match?.result;

    const status: BracketSlot['status'] =
      !s.homeTeamId || !s.awayTeamId ? 'unresolved' :
      pred?.status === 'INVALIDATED_BY_CASCADE' ? 'invalidated' :
      src?.homeGoals != null ? 'completed' :
      pred?.lockedAt != null && pred.lockedAt < new Date() ? 'locked' :
      'pending';

    return {
      slotId: s.slotId,
      round: s.round as BracketSlot['round'],
      matchNumber: match?.matchNumber ?? 0,
      homeTeam: s.homeTeamId ? teamById.get(s.homeTeamId) ?? null : null,
      awayTeam: s.awayTeamId ? teamById.get(s.awayTeamId) ?? null : null,
      homeGoals: src?.homeGoals ?? null,
      awayGoals: src?.awayGoals ?? null,
      homePenalties: src?.homePenalties ?? null,
      awayPenalties: src?.awayPenalties ?? null,
      winnerTeamId: s.winnerTeamId,
      loserTeamId: s.loserTeamId,
      status,
      locked: status === 'locked' || status === 'invalidated',
      pointsEarned: null,
    };
  };

  return {
    participantSlots: participantSlots.map(buildSlot),
    officialSlots: officialSlots.map(buildSlot),
    thirdPlaceMatrixResolved: participantBestThirds?.combinationKey != null,
  };
}

async function getTeamLookup(poolId: string): Promise<Map<string, TeamBrief>> {
  const teams = await prisma.team.findMany({ where: { poolId } });
  return new Map(teams.map(t => [t.id, toTeamBrief(t)]));
}

// ═══════════════════════════════════════════════════════════
// Admin: Dashboard
// ═══════════════════════════════════════════════════════════

export async function getAdminDashboardData(poolId: string): Promise<AdminDashboardData> {
  const [matchesPlayed, participantCount, activeOverrides, lastAudit] = await Promise.all([
    prisma.officialResult.count({ where: { poolId } }),
    prisma.entry.count({ where: { poolId } }),
    prisma.override.count({ where: { poolId, supersededById: null } }),
    prisma.auditLog.findFirst({
      where: { poolId, action: { in: ['result_loaded', 'override_created', 'full_rebuild_triggered'] } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    poolId,
    matchesPlayed,
    totalMatches: 16,
    participantCount,
    activeOverrides,
    lastRecalcAt: lastAudit?.createdAt ?? null,
    lastRecalcDurationMs: null,
    matrixComplete: true,
    matrixMissing: [],
  };
}

// ═══════════════════════════════════════════════════════════
// Admin: Pending matches
// ═══════════════════════════════════════════════════════════

export async function getPendingMatches(poolId: string): Promise<PendingMatchRow[]> {
  // Determine which phase to show next
  const phases = ['GROUP', 'R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'] as const;
  
  let currentPhase = 'GROUP';
  
  for (const phase of phases) {
    const totalInPhase = await prisma.match.count({
      where: { poolId, phase: phase as any },
    });
    const resultsInPhase = await prisma.officialResult.count({
      where: { poolId, match: { phase: phase as any } },
    });
    
    if (totalInPhase === 0) continue;
    
    if (resultsInPhase < totalInPhase) {
      // This phase has pending matches — show it
      currentPhase = phase;
      break;
    }
    // Phase complete, move to next
  }

  const matches = await prisma.match.findMany({
    where: { poolId, phase: currentPhase as any, result: null },
    include: {
      homeTeam: { select: { name: true, shortName: true } },
      awayTeam: { select: { name: true, shortName: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

	return matches.map(m => ({
    ...toMatchBrief(m),
    hasResult: false,
  })) as any;
}

// ═══════════════════════════════════════════════════════════
// Admin: Audit log
// ═══════════════════════════════════════════════════════════

export async function getAuditLog(
  poolId: string, filter?: string, limit: number = 100,
): Promise<AuditLogEntry[]> {
  const where: any = { poolId };
  if (filter && filter !== 'all') where.action = filter;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { actor: { select: { displayName: true } } },
  });

  return logs.map(l => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    actorDisplayName: l.actor?.displayName ?? 'Sistema',
    createdAt: l.createdAt,
    summary: formatAuditSummary(l),
  }));
}

function formatAuditSummary(log: any): string {
  switch (log.action) {
    case 'result_loaded':
      const r = log.payloadAfter;
      return r ? `Resultado: ${r.homeGoals}-${r.awayGoals}` : 'Resultado cargado';
    case 'override_created':
      return `Override de ${log.payloadAfter?.type ?? 'desconocido'}`;
    case 'config_changed':
      return 'Configuración modificada';
    case 'full_rebuild_triggered':
      return 'Recálculo completo disparado';
    case 'entry_submitted':
      return 'Quiniela enviada';
    case 'entry_locked':
      return 'Quiniela bloqueada';
    default:
      return log.action;
  }
}

// ═══════════════════════════════════════════════════════════
// Admin: Scoring config
// ═══════════════════════════════════════════════════════════

export async function getScoringConfig(poolId: string) {
  const [concepts, flags] = await Promise.all([
    prisma.poolScoringConcept.findMany({
      where: { poolId }, orderBy: { conceptId: 'asc' },
    }),
    prisma.poolBehaviorFlags.findFirst({ where: { poolId } }),
  ]);

  return { concepts, flags };
}

