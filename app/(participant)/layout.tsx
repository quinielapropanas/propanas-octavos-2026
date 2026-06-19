// ═══════════════════════════════════════════════════════════
// Participant Layout — Server component that reads session,
// passes to client AuthProvider for all child components.
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/client';
import { ParticipantShell } from './participant-shell';

const POOL_ID = 'pool-propanas-2026';

export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const [membership, prismaUser, entry] = await Promise.all([
    prisma.poolMembership.findUnique({
      where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { displayName: true },
    }),
    prisma.entry.findFirst({
      where: { poolId: POOL_ID, userId: user.id },
      orderBy: { entryNumber: 'asc' },
      select: { id: true, status: true, displayName: true, completionPct: true },
    }),
  ]);

  if (!membership || membership.status !== 'ACTIVE') {
    redirect('/login?error=not_member');
  }

  if (membership.role === 'ADMIN') {
    redirect('/admin/dashboard');
  }

  const displayName =
    entry?.displayName ??
    prismaUser?.displayName ??
    user.user_metadata?.display_name ??
    user.email?.split('@')[0] ??
    'Participante';

  const role = membership.role as 'ADMIN' | 'PARTICIPANT';

  // Check if groups are complete (72/104 = ~69%)
  const groupsComplete = entry ? (entry.completionPct ?? 0) >= 69 : false;

// Check if best thirds are confirmed OR bracket already exists
  let thirdsConfirmed = false;
  if (entry) {
    const bt = await prisma.bestThirds.findFirst({
      where: {
        poolId: POOL_ID, contextType: 'PARTICIPANT',
        contextKey: entry.id,
      },
    });
    thirdsConfirmed = (bt as any)?.confirmed ?? false;

    // Also enable bracket if slots already exist
    if (!thirdsConfirmed) {
      const bracketSlots = await prisma.bracketSlot.count({
        where: {
          poolId: POOL_ID, contextType: 'PARTICIPANT',
          contextKey: entry.id,
        },
      });
      if (bracketSlots > 0) thirdsConfirmed = true;
    }
  }

  return (
    <ParticipantShell
      displayName={displayName}
      role={role}
      userId={user.id}
      groupsComplete={groupsComplete}
      thirdsConfirmed={thirdsConfirmed}
    >
      {children}
    </ParticipantShell>
  );
}