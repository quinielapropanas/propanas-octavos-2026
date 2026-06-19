// ═══════════════════════════════════════════════════════════
// GET /api/breakdown/[userId] — Score breakdown (trazabilidad)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { userId } = await params;

  // Participants can only see their own breakdown (or admins see any)
  if (auth.role !== 'ADMIN' && auth.userId !== userId) {
    return NextResponse.json({ error: 'Can only view your own breakdown' }, { status: 403 });
  }

  const [breakdowns, ranking, concepts] = await Promise.all([
    prisma.scoreBreakdown.findMany({
      where: { poolId: auth.poolId, userId },
      orderBy: [{ conceptId: 'asc' }, { matchId: 'asc' }],
    }),
    prisma.ranking.findUnique({
      where: { poolId_userId: { poolId: auth.poolId, userId } },
    }),
    prisma.poolScoringConcept.findMany({
      where: { poolId: auth.poolId },
      orderBy: { conceptId: 'asc' },
    }),
  ]);

  // Group breakdowns by concept for summary
  const conceptSummary = concepts.map(c => {
    const conceptBreakdowns = breakdowns.filter(b => b.conceptId === c.conceptId);
    const totalPoints = conceptBreakdowns.reduce((s, b) => s + b.pointsAwarded, 0);
    return {
      conceptId: c.conceptId,
      name: c.name,
      maxPoints: c.points,
      isActive: c.isActive,
      totalAwarded: totalPoints,
      details: conceptBreakdowns.map(b => ({
        matchId: b.matchId,
        slotId: b.slotId,
        pointsAwarded: b.pointsAwarded,
        explanation: b.explanation,
      })),
    };
  });

  return NextResponse.json({
    userId,
    totalPoints: ranking?.totalPoints ?? 0,
    phase1Points: ranking?.phase1Points ?? 0,
    phase2Points: ranking?.phase2Points ?? 0,
    position: ranking?.position ?? null,
    concepts: conceptSummary,
  });
}
