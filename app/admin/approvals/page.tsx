import { getSessionUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { ApprovalsClient } from './approvals-client';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard');

  const entries = await prisma.entry.findMany({
    where: { poolId: POOL_ID, status: { in: ['SUBMITTED', 'APPROVED'] } },
    include: {
      user: { select: { displayName: true, email: true } },
    },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  });

  const data = entries.map(e => ({
    id: e.id,
    displayName: e.displayName ?? 'Sin nombre',
    userName: e.user?.displayName ?? e.user?.email ?? '?',
    status: e.status,
    completionPct: e.completionPct ?? 0,
    entryNumber: e.entryNumber,
  }));

  return <ApprovalsClient entries={data} />;
}