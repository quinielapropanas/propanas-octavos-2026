// ═══════════════════════════════════════════════════════════
// Bracket — Server Component with real bracket data
// ═══════════════════════════════════════════════════════════
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { getBracketData } from '@/lib/data/queries';
import { prisma } from '@/lib/db/client';
import { BracketClient } from './bracket-client';

const POOL_ID = 'pool-propanas-octavos-2026';

export const dynamic = 'force-dynamic';

export default async function BracketPage({
  searchParams,
}: {
  searchParams: { entry?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

let entryId = searchParams?.entry;
  if (!entryId) {
    const firstEntry = await prisma.entry.findFirst({
      where: { poolId: POOL_ID, userId: user.id },
      orderBy: { entryNumber: 'asc' },
      select: { id: true },
    });
    entryId = firstEntry?.id;
  }

  // Auto-generate participant R16 bracket from official setup if not exists
  if (entryId) {
    const { generateOctavosParticipantBracket } = await import('@/lib/domain/bracket-generator-octavos');
    await generateOctavosParticipantBracket(user.id, entryId);
  }

  const data = await getBracketData(user.id, POOL_ID, entryId);

  const knockoutMatches = await prisma.match.findMany({
    where: { poolId: POOL_ID, phase: { not: 'GROUP' } },
    select: { id: true, slotId: true },
  });
  const matchSlotMap: Record<string, string> = {};
  for (const m of knockoutMatches) {
    if (m.slotId) matchSlotMap[m.slotId] = m.id;
  }

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    select: { displayName: true, status: true },
  });

  const entryLocked = entry?.status === 'SUBMITTED' || entry?.status === 'APPROVED';

  return (
    <BracketClient
      initialData={data}
      entryLocked={entryLocked}
      matchSlotMap={matchSlotMap}
      entryId={entryId}
      entryDisplayName={entry?.displayName ?? 'Quiniela'}
    />
  );
}