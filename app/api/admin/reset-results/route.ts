import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

const POOL_ID = 'pool-propanas-octavos-2026';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  try {
    await prisma.officialResult.deleteMany({ where: { poolId: POOL_ID } });
    await prisma.ranking.deleteMany({ where: { poolId: POOL_ID } });
    await prisma.scoreBreakdown.deleteMany({ where: { poolId: POOL_ID } });

    // Reset R16 winners
    await prisma.bracketSlot.updateMany({
      where: { poolId: POOL_ID, contextType: 'OFFICIAL', round: 'R16' },
      data: { winnerTeamId: null, loserTeamId: null },
    });

    // Delete other rounds
    await prisma.bracketSlot.deleteMany({
      where: {
        poolId: POOL_ID,
        contextType: 'OFFICIAL',
        round: { not: 'R16' },
      },
    });

    // Also clear team assignments in matches table (except R16)
    await prisma.match.updateMany({
      where: { 
        poolId: POOL_ID,
        phase: { in: ['QF', 'SF', 'THIRD', 'FINAL'] as any },
      },
      data: { homeTeamId: null, awayTeamId: null },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}