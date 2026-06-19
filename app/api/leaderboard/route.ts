// ═══════════════════════════════════════════════════════════
// GET /api/leaderboard — Rankings with pagination
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50')));
  const skip = (page - 1) * limit;

  const [rankings, total, myRanking] = await Promise.all([
    prisma.ranking.findMany({
      where: { poolId: auth.poolId },
      orderBy: { totalPoints: 'desc' },
      skip, take: limit,
    }),
    prisma.ranking.count({ where: { poolId: auth.poolId } }),
    prisma.ranking.findUnique({
      where: { poolId_userId: { poolId: auth.poolId, userId: auth.userId } },
    }),
  ]);

  // Enrich with entry displayName (snapshot at submit)
  const entries = await prisma.entry.findMany({
    where: { poolId: auth.poolId, userId: { in: rankings.map(r => r.userId) } },
    select: { userId: true, displayName: true },
  });
  const entryMap = new Map(entries.map(e => [e.userId, e.displayName]));

  return NextResponse.json({
    rankings: rankings.map(r => ({
      userId: r.userId,
      displayName: entryMap.get(r.userId) ?? r.userId,
      totalPoints: r.totalPoints,
      phase1Points: r.phase1Points,
      phase2Points: r.phase2Points,
      position: r.position,
      matchesPredicted: r.matchesPredicted,
    })),
    myPosition: myRanking?.position ?? null,
    myPoints: myRanking?.totalPoints ?? 0,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
