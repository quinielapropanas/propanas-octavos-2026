import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const entryId = req.nextUrl.searchParams.get('entryId');
  if (!entryId) {
    return NextResponse.json({ error: 'entryId required' }, { status: 400 });
  }

// Verify entry belongs to user OR user is admin
  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  // Allow admin to download any entry
  if (entry.userId !== user.id) {
    const membership = await prisma.poolMembership.findUnique({
      where: { poolId_userId: { poolId: entry.poolId, userId: user.id } },
    });
    if (membership?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
  }
  

  // Fetch all predictions with match and team details
  const predictions = await prisma.prediction.findMany({
    where: { entryId, status: 'VALID' },
    include: {
      match: {
        include: {
          homeTeam: { select: { name: true, shortName: true } },
          awayTeam: { select: { name: true, shortName: true } },
        },
      },
    },
    orderBy: { match: { matchNumber: 'asc' } },
  });

  // Also get bracket slots for knockout team names
  const bracketSlots = await prisma.bracketSlot.findMany({
    where: {
      poolId: entry.poolId,
      contextType: 'PARTICIPANT',
      contextKey: entryId,
    },
  });

  const teams = await prisma.team.findMany({
    where: { poolId: entry.poolId },
    select: { id: true, name: true, shortName: true },
  });
  const teamMap = new Map(teams.map(t => [t.id, t]));

  const slotTeams = new Map<string, { home: string; away: string }>();
  for (const bs of bracketSlots) {
    const home = bs.homeTeamId ? teamMap.get(bs.homeTeamId) : null;
    const away = bs.awayTeamId ? teamMap.get(bs.awayTeamId) : null;
    slotTeams.set(bs.slotId, {
      home: home?.name ?? '?',
      away: away?.name ?? '?',
    });
  }

  const result = predictions.map(p => {
    const isKnockout = p.match.phase !== 'GROUP';
    let homeTeam = p.match.homeTeam?.name ?? '?';
    let awayTeam = p.match.awayTeam?.name ?? '?';

    // For knockout, use bracket slot teams (participant's predicted teams)
    if (isKnockout && p.match.slotId) {
      const st = slotTeams.get(p.match.slotId);
      if (st) {
        homeTeam = st.home;
        awayTeam = st.away;
      }
    }

    return {
      matchNumber: p.match.matchNumber,
      phase: p.match.phase,
      groupLetter: p.match.groupLetter,
      slotId: p.match.slotId,
      homeTeam,
      awayTeam,
      homeGoals: p.homeGoals,
      awayGoals: p.awayGoals,
      homePenalties: p.homePenalties,
      awayPenalties: p.awayPenalties,
    };
  });

  return NextResponse.json({
    predictions: result,
    displayName: entry.displayName,
  });
}
