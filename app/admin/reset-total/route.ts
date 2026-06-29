import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

const POOL_ID = 'pool-propanas-octavos-2026';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  try {
    // Get admin user IDs to preserve them
    const adminIds = (await prisma.poolMembership.findMany({
      where: { poolId: POOL_ID, role: 'ADMIN' },
      select: { userId: true },
    })).map(m => m.userId);

    // Delete all predictions
    await prisma.prediction.deleteMany({ where: { poolId: POOL_ID } });

    // Delete all score breakdowns and rankings
    await prisma.scoreBreakdown.deleteMany({ where: { poolId: POOL_ID } });
    await prisma.ranking.deleteMany({ where: { poolId: POOL_ID } });

    // Delete all official results
    await prisma.officialResult.deleteMany({ where: { poolId: POOL_ID } });

    // Delete all bracket slots (official + participant)
    await prisma.bracketSlot.deleteMany({ where: { poolId: POOL_ID } });

    // Clear teams in matches (except R16 teams will be reset too since admin can re-setup)
    await prisma.match.updateMany({
      where: { poolId: POOL_ID },
      data: { homeTeamId: null, awayTeamId: null },
    });

    // Delete all entries
    await prisma.entry.deleteMany({ where: { poolId: POOL_ID } });

    // Delete non-admin pool memberships
    await prisma.poolMembership.deleteMany({ 
      where: { poolId: POOL_ID, userId: { notIn: adminIds } },
    });

    // Delete non-admin users (those not in any other pool)
    const allMemberships = await prisma.poolMembership.findMany({
      select: { userId: true },
    });
    const usersWithMembership = new Set(allMemberships.map(m => m.userId));
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    const usersToDelete = allUsers.filter(u => !usersWithMembership.has(u.id));
    
    for (const u of usersToDelete) {
      await prisma.user.delete({ where: { id: u.id } });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}