import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { BreakdownClient } from './breakdown-client';

export const dynamic = 'force-dynamic';

export default async function BreakdownPage({
  params,
}: {
  params: { userId: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return <BreakdownClient entryId={params.userId} />;
}