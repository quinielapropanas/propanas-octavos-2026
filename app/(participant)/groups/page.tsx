// ═══════════════════════════════════════════════════════════
// Groups Page — Server component fetching data
// Delegates interactive predictions form to GroupsClient
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { getGroupData } from '@/lib/data/queries';
import { prisma } from '@/lib/db/client';
import { GroupsClient } from './groups-client';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: { group?: string; entry?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const selectedGroup = searchParams?.group ?? 'A';

  let entryId = searchParams?.entry;
  if (!entryId) {
    const firstEntry = await prisma.entry.findFirst({
      where: { poolId: POOL_ID, userId: user.id },
      orderBy: { entryNumber: 'asc' },
      select: { id: true },
    });
    entryId = firstEntry?.id;
  }

  // Check if entry is submitted or approved (locked)
  let entryLocked = false;
  if (entryId) {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { status: true },
    });
    entryLocked = entry?.status === 'SUBMITTED' || entry?.status === 'APPROVED';
  }

  const groupData = await getGroupData(selectedGroup, user.id, POOL_ID, entryId);

  // Override locked flag if entry is submitted/approved
  if (entryLocked) {
    groupData.locked = true;
  }

  const predictions = await prisma.prediction.groupBy({
    by: ['matchId'],
    where: {
      poolId: POOL_ID,
      userId: user.id,
      ...(entryId ? { entryId } : {}),
      status: 'VALID',
      homeGoals: { not: null },
    },
  });

  const matchGroups = await prisma.match.findMany({
    where: { poolId: POOL_ID, phase: 'GROUP' },
    select: { id: true, groupLetter: true },
  });

  const completionMap: Record<string, boolean> = {};
  const predSet = new Set(predictions.map(p => p.matchId));
  for (const letter of 'ABCDEFGHIJKL'.split('')) {
    const groupMatches = matchGroups.filter(m => m.groupLetter === letter);
    completionMap[letter] = groupMatches.length > 0 && groupMatches.every(m => predSet.has(m.id));
  }

  return (
    <GroupsClient
      key={`${selectedGroup}-${entryId}`}
      initialGroup={selectedGroup}
      initialData={groupData}
      completionMap={completionMap}
    />
  );
}