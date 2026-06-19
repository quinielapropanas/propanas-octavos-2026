import { getSessionUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { ParticipantsClient } from './participants-client';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

export default async function ParticipantsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard');

  // Get all participants with their entries
  const adminIds = await prisma.poolMembership.findMany({
    where: { poolId: POOL_ID, role: 'ADMIN' },
    select: { userId: true },
  });
  const adminIdSet = new Set(adminIds.map(a => a.userId));

  const members = await prisma.poolMembership.findMany({
    where: { poolId: POOL_ID, role: 'PARTICIPANT', status: 'ACTIVE' },
    include: {
      user: {
        select: { id: true, displayName: true, email: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  const entries = await prisma.entry.findMany({
    where: { poolId: POOL_ID, userId: { notIn: Array.from(adminIdSet) } },
    orderBy: [{ userId: 'asc' }, { entryNumber: 'asc' }],
  });

  // Get champion predictions per entry
  const topScorers = await prisma.topScorerPrediction.findMany({
    where: { poolId: POOL_ID },
    select: { entryId: true, playerName: true, goals: true },
  });

  // Get champion team per entry from bracket slots (F-01 winner)
  const finalSlots = await prisma.bracketSlot.findMany({
    where: {
      poolId: POOL_ID, contextType: 'PARTICIPANT',
      slotId: 'F-01',
    },
    select: { contextKey: true, winnerTeamId: true, homeTeamId: true, awayTeamId: true },
  });

  const teams = await prisma.team.findMany({
    where: { poolId: POOL_ID },
    select: { id: true, name: true, shortName: true },
  });
  const teamMap = new Map(teams.map(t => [t.id, t]));

// Build data structure
  // Get final match ID once
  const finalMatch = await prisma.match.findFirst({
    where: { poolId: POOL_ID, slotId: 'F-01' },
    select: { id: true },
  });

  // Get all final predictions at once
  const finalPredictions = finalMatch ? await prisma.prediction.findMany({
    where: { matchId: finalMatch.id, homeGoals: { not: null } },
    select: { entryId: true, homeGoals: true, awayGoals: true, homePenalties: true, awayPenalties: true },
  }) : [];
  const finalPredMap = new Map(finalPredictions.map(p => [p.entryId, p]));

  const entryMap = new Map<string, any[]>();
  for (const e of entries) {
    if (!entryMap.has(e.userId)) entryMap.set(e.userId, []);
    
    const finalSlot = finalSlots.find(s => s.contextKey === e.id);
    const topScorer = topScorers.find(ts => ts.entryId === e.id);
    const finalPred = finalPredMap.get(e.id);

    // Determine champion from prediction result
    let champion = null;
    if (finalSlot?.homeTeamId && finalSlot?.awayTeamId && finalPred) {
      const homeGoals = finalPred.homeGoals ?? 0;
      const awayGoals = finalPred.awayGoals ?? 0;
      const homePen = finalPred.homePenalties ?? 0;
      const awayPen = finalPred.awayPenalties ?? 0;

      let winnerId: string | null = null;
      if (homeGoals > awayGoals) winnerId = finalSlot.homeTeamId;
      else if (awayGoals > homeGoals) winnerId = finalSlot.awayTeamId;
      else if (homePen > awayPen) winnerId = finalSlot.homeTeamId;
      else if (awayPen > homePen) winnerId = finalSlot.awayTeamId;

      champion = winnerId ? (teamMap.get(winnerId)?.name ?? null) : null;
    }

    entryMap.get(e.userId)!.push({
      id: e.id,
      displayName: e.displayName ?? `Quiniela ${e.entryNumber}`,
      status: e.status,
      completionPct: e.completionPct ?? 0,
      champion,
      topScorer: topScorer ? `${topScorer.playerName} (${topScorer.goals} goles)` : null,
    });
  }

  const data = members
    .filter(m => !adminIdSet.has(m.userId))
    .map(m => ({
      userId: m.userId,
      displayName: m.user.displayName ?? '?',
      email: m.user.email ?? '?',
      entries: entryMap.get(m.userId) ?? [],
    }));

  return <ParticipantsClient participants={data} />;
}