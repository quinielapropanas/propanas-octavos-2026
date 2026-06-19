import { getSessionUser } from '@/lib/supabase/server';
// ═══════════════════════════════════════════════════════════
// Admin Overrides — Real data for group standing + best thirds overrides
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import { } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/client';
import { OverridesForm } from './overrides-form';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

export default async function AdminOverridesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const membership = await prisma.poolMembership.findUnique({
   where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard');

  const [teams, activeOverrides, bestThirds] = await Promise.all([
    prisma.team.findMany({
      where: { poolId: POOL_ID },
      orderBy: [{ groupLetter: 'asc' }, { shortName: 'asc' }],
    }),
    prisma.override.findMany({
      where: { poolId: POOL_ID, supersededById: null },
      include: { createdBy: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bestThirds.findFirst({
      where: { poolId: POOL_ID, contextType: 'OFFICIAL' },
    }),
  ]);

  const teamsSerializable = teams.map(t => ({
    id: t.id,
    name: t.name,
    shortName: t.shortName,
    groupLetter: t.groupLetter,
  }));

  const overridesSerializable = activeOverrides.map(o => ({
    id: o.id,
    type: o.type as 'GROUP_STANDING' | 'BEST_THIRDS',
    targetGroup: o.targetGroup,
    reason: o.reason,
    createdAt: o.createdAt,
    createdByName: o.createdBy?.displayName ?? 'Sistema',
  }));

  const bestThirdsRanking = bestThirds
    ? ((bestThirds.ranking as any[]) ?? []).map(r => ({
        groupLetter: r.groupLetter,
        points: r.points,
        qualifies: r.qualifies,
      }))
    : null;

  return (
    <OverridesForm
      teams={teamsSerializable}
      activeOverrides={overridesSerializable}
      bestThirdsRanking={bestThirdsRanking}
    />
  );
}


