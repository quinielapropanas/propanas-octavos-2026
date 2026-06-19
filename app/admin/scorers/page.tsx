import { getSessionUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { ScorersClient } from './scorers-client';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

export default async function ScorersPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard');

  const predictions = await prisma.topScorerPrediction.findMany({
    where: { poolId: POOL_ID },
    include: {
      entry: { select: { displayName: true, entryNumber: true, status: true } },
      user: { select: { displayName: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const data = predictions.map(p => ({
    entryName: p.entry?.displayName ?? 'Sin nombre',
    userName: p.user?.displayName ?? p.user?.email ?? '?',
    entryStatus: p.entry?.status ?? 'DRAFT',
    playerName: p.playerName ?? '—',
    goals: p.goals ?? 0,
  }));

  return <ScorersClient predictions={data} />;
}