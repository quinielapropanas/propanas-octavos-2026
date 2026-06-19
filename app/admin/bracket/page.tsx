import { getSessionUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { AdminBracketClient } from './admin-bracket-client';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

export default async function AdminBracketPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard');

  // Fetch official bracket slots
  const officialSlots = await prisma.bracketSlot.findMany({
    where: { poolId: POOL_ID, contextType: 'OFFICIAL' },
    orderBy: { slotId: 'asc' },
  });

  // Fetch official results for knockout matches
  const knockoutResults = await prisma.officialResult.findMany({
    where: { poolId: POOL_ID, match: { phase: { not: 'GROUP' } } },
    include: { match: { select: { slotId: true } } },
  });

  const resultBySlot = new Map(
    knockoutResults.map(r => [r.match.slotId, r])
  );

  // Build team lookup
  const teams = await prisma.team.findMany({ where: { poolId: POOL_ID } });
  const teamNames: Record<string, string> = {};
  const teamShortNames: Record<string, string> = {};
  for (const t of teams) {
    teamNames[t.id] = t.name;
    teamShortNames[t.id] = t.shortName;
  }

  // Build slots with scores from official results
  const slotsWithScores = officialSlots.map(s => {
    const result = resultBySlot.get(s.slotId);
    return {
      slotId: s.slotId,
      round: s.round,
      homeTeam: s.homeTeamId ? { id: s.homeTeamId, name: teamNames[s.homeTeamId] ?? '?', shortName: teamShortNames[s.homeTeamId] ?? '?', flagAssetKey: '', groupLetter: '' } : null,
      awayTeam: s.awayTeamId ? { id: s.awayTeamId, name: teamNames[s.awayTeamId] ?? '?', shortName: teamShortNames[s.awayTeamId] ?? '?', flagAssetKey: '', groupLetter: '' } : null,
      homeGoals: result?.homeGoals ?? null,
      awayGoals: result?.awayGoals ?? null,
      homePenalties: result?.homePenalties ?? null,
      awayPenalties: result?.awayPenalties ?? null,
      winnerTeamId: s.winnerTeamId,
      loserTeamId: s.loserTeamId,
      status: (result ? 'completed' : s.homeTeamId && s.awayTeamId ? 'pending' : 'unresolved') as any,
      locked: false,
      matchNumber: 0,
      pointsEarned: null,
    };
  });

  // Count stats
  const totalSlots = officialSlots.length;
  const resolvedSlots = officialSlots.filter(s => s.winnerTeamId).length;
  const resultsLoaded = knockoutResults.length;

  return (
    <AdminBracketClient
      slots={slotsWithScores}
      teamNames={teamNames}
      totalSlots={totalSlots}
      resolvedSlots={resolvedSlots}
      resultsLoaded={resultsLoaded}
    />
  );
}