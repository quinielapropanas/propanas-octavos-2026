import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/client';
import { EquiposClient } from './equipos-client';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

export default async function EquiposPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const teams = await prisma.team.findMany({
    where: { poolId: POOL_ID },
    orderBy: [{ groupLetter: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, shortName: true, groupLetter: true, flagAssetKey: true },
  });

  const grouped: Record<string, typeof teams> = {};
  for (const t of teams) {
    const g = t.groupLetter;
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(t);
  }

  return <EquiposClient groups={grouped} />;
}