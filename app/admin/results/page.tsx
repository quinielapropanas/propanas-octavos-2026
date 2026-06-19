import { getSessionUser } from '@/lib/supabase/server';
// ═══════════════════════════════════════════════════════════
// Admin Results — Server fetches pending matches + loaded results
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import { getPendingMatches } from '@/lib/data/queries';
import { prisma } from '@/lib/db/client';
import { ResultsForm } from './results-form';

const POOL_ID = 'pool-propanas-octavos-2026';

export const dynamic = 'force-dynamic';

export default async function AdminResultsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard');

  const pendingMatches = await getPendingMatches(POOL_ID);

  // Fetch loaded results
  const loadedResults = await prisma.officialResult.findMany({
    where: { poolId: POOL_ID },
    include: {
      match: {
        include: {
          homeTeam: { select: { shortName: true, name: true } },
          awayTeam: { select: { shortName: true, name: true } },
        },
      },
    },
    orderBy: { match: { matchNumber: 'asc' } },
  });

  const loadedData = loadedResults.map(r => ({
    matchId: r.matchId,
    matchNumber: r.match.matchNumber,
    phase: r.match.phase,
    groupLetter: r.match.groupLetter,
    slotId: r.match.slotId,
    homeTeam: r.match.homeTeam?.shortName ?? '?',
    awayTeam: r.match.awayTeam?.shortName ?? '?',
    homeGoals: r.homeGoals,
    awayGoals: r.awayGoals,
    homePenalties: r.homePenalties,
    awayPenalties: r.awayPenalties,
    loadedAt: r.loadedAt,
  }));

  return <ResultsForm pendingMatches={pendingMatches} loadedResults={loadedData} />;
}
