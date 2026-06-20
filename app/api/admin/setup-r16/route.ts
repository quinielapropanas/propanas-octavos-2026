import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

const POOL_ID = 'pool-propanas-octavos-2026';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  const { slots } = await req.json();
  if (!slots) return NextResponse.json({ error: 'slots required' }, { status: 400 });

  for (const [slotId, teams] of Object.entries(slots as any)) {
    const { home, away } = teams as { home: string; away: string };
    if (!home || !away) continue;

    await prisma.bracketSlot.upsert({
      where: { poolId_contextKey_slotId: { poolId: POOL_ID, contextKey: 'OFFICIAL', slotId } },
      update: {
        round: 'R16', homeTeamId: home, awayTeamId: away,
        calculatedAt: new Date(), contextType: 'OFFICIAL',
      },
      create: {
        poolId: POOL_ID, contextType: 'OFFICIAL', contextKey: 'OFFICIAL',
        slotId, round: 'R16', homeTeamId: home, awayTeamId: away,
      },
    });

    await prisma.match.updateMany({
      where: { poolId: POOL_ID, slotId },
      data: { homeTeamId: home, awayTeamId: away },
    });
  }

  return NextResponse.json({ success: true });
}