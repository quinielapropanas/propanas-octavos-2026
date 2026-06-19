import { getSessionUser } from '@/lib/supabase/server';
// ═══════════════════════════════════════════════════════════
// Admin Layout — Requires ADMIN role
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import { } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/client';
import { AdminShell } from './admin-shell';

const POOL_ID = 'pool-propanas-2026';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

 const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    redirect('/dashboard?error=admin_required');
  }

  const prismaUser = await prisma.user.findUnique({
    where: { id: user.id }, select: { displayName: true },
  });

  return (
    <AdminShell displayName={prismaUser?.displayName ?? user.email ?? 'Admin'}>
      {children}
    </AdminShell>
  );
}


