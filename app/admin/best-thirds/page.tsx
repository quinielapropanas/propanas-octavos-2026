import { getSessionUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { AdminBestThirdsClient } from './admin-best-thirds-client';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

export default async function AdminBestThirdsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard');

  // Check how many group results are loaded
  const groupResultCount = await prisma.officialResult.count({
    where: { poolId: POOL_ID, match: { phase: 'GROUP' } },
  });

  return <AdminBestThirdsClient groupResultCount={groupResultCount} />;
}