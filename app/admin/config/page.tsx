import { getSessionUser } from '@/lib/supabase/server';
// ═══════════════════════════════════════════════════════════
// Admin Config — Real scoring config + exclusion validation
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import { } from '@/lib/supabase/server';
import { getScoringConfig } from '@/lib/data/queries';
import { prisma } from '@/lib/db/client';
import { ConfigForm } from './config-form';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

export default async function AdminConfigPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

 const membership = await prisma.poolMembership.findUnique({
  where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard');

  const { concepts, flags } = await getScoringConfig(POOL_ID);

  return <ConfigForm initialConcepts={concepts} initialFlags={flags} />;
}


