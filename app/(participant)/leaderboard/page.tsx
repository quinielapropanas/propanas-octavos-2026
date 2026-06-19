import { getSessionUser } from '@/lib/supabase/server';
// ═══════════════════════════════════════════════════════════
// Leaderboard — Server fetches initial + client subscribes to Realtime
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import { } from '@/lib/supabase/server';
import { getLeaderboardData } from '@/lib/data/queries';
import { LeaderboardLive } from './leaderboard-live';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1'));

  const data = await getLeaderboardData(POOL_ID, user.id, page, 100);

  return (
    <LeaderboardLive
      poolId={POOL_ID}
      initialData={data}
      currentUserId={user.id}
    />
  );
}


