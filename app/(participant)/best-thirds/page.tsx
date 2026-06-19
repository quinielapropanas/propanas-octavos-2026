import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/client';
import { BestThirdsClient } from './best-thirds-client';

const POOL_ID = 'pool-propanas-octavos-2026';

export const dynamic = 'force-dynamic';

export default async function BestThirdsPage({
  searchParams,
}: {
  searchParams: { entry?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let entryId = searchParams.entry;
  if (!entryId) {
    const firstEntry = await prisma.entry.findFirst({
      where: { poolId: POOL_ID, userId: user.id },
      orderBy: { entryNumber: 'asc' },
      select: { id: true },
    });
    entryId = firstEntry?.id;
  }

  if (!entryId) redirect('/groups');

  // Check if groups are complete
  const groupPredictions = await prisma.prediction.count({
    where: {
      poolId: POOL_ID,
      entryId,
      status: 'VALID',
      homeGoals: { not: null },
      match: { phase: 'GROUP' },
    },
  });

  if (groupPredictions < 72) {
    redirect('/groups');
  }

  return <BestThirdsClient entryId={entryId} />;
}