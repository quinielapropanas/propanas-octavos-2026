import { getSessionUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { SetupR16Client } from './setup-r16-client';

const POOL_ID = 'pool-propanas-octavos-2026';

export const dynamic = 'force-dynamic';

export default async function SetupR16Page() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard');

  const teams = await prisma.team.findMany({
    where: { poolId: POOL_ID },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, shortName: true },
  });

  const existingSlots = await prisma.bracketSlot.findMany({
    where: { poolId: POOL_ID, contextType: 'OFFICIAL', contextKey: 'OFFICIAL', round: 'R16' },
  });

  return <SetupR16Client teams={teams} existingSlots={existingSlots as any} />;
}