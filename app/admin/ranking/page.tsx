import { getSessionUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { getLeaderboardData } from '@/lib/data/queries';
import { AdminRankingClient } from './admin-ranking-client';

const POOL_ID = 'pool-propanas-octavos-2026';

export const dynamic = 'force-dynamic';

export default async function AdminRankingPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard');

  const data = await getLeaderboardData(POOL_ID, user.id, 1, 100, true);

  return <AdminRankingClient initialData={data} />;
}