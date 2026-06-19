import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/client';
import { generateParticipantBracket } from '@/lib/domain/bracket-generator';

const POOL_ID = 'pool-propanas-2026';

// GET: obtener ranking de terceros calculado
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const entryId = req.nextUrl.searchParams.get('entryId');
  if (!entryId) return NextResponse.json({ error: 'entryId required' }, { status: 400 });

  // Check if best thirds exists
  let existing = await prisma.bestThirds.findFirst({
    where: { poolId: POOL_ID, contextType: 'PARTICIPANT', contextKey: entryId },
  });

  // If not, try to generate them
  if (!existing) {
    try {
      await generateParticipantBracket(POOL_ID, user.id, entryId);
      existing = await prisma.bestThirds.findFirst({
        where: { poolId: POOL_ID, contextType: 'PARTICIPANT', contextKey: entryId },
      });
    } catch (err) {
      console.error('[best-thirds] Error generating:', err);
    }
  }

  if (!existing) {
    return NextResponse.json({ thirds: null, confirmed: false });
  }

  // Get team details
  const teams = await prisma.team.findMany({
    where: { poolId: POOL_ID },
    select: { id: true, name: true, shortName: true, groupLetter: true },
  });
  const teamMap = new Map(teams.map(t => [t.id, t]));

  const ranking = (existing.ranking as any[]).map((r: any) => ({
    teamId: r.teamId,
    groupLetter: r.groupOrigin ?? r.groupLetter ?? '',
    points: r.points ?? 0,
    goalDifference: r.goalDifference ?? 0,
    goalsFor: r.goalsFor ?? 0,
    qualifies: r.qualified ?? r.qualifies ?? false,
    team: teamMap.get(r.teamId) ?? null,
  }));

  return NextResponse.json({
    thirds: ranking,
    combinationKey: existing.combinationKey,
    confirmed: (existing as any).confirmed ?? false,
  });
}

// POST: confirmar el orden de los mejores terceros y generar bracket
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { entryId, ranking: confirmedRanking, resetBracket } = await req.json();
  if (!entryId || !confirmedRanking) {
    return NextResponse.json({ error: 'entryId and ranking required' }, { status: 400 });
  }

  // If confirming changes after bracket was already generated, reset bracket
  if (resetBracket) {
    await prisma.prediction.deleteMany({
      where: {
        poolId: POOL_ID, entryId,
        match: { phase: { not: 'GROUP' } },
      },
    });
    await prisma.bracketSlot.deleteMany({
      where: {
        poolId: POOL_ID, contextType: 'PARTICIPANT', contextKey: entryId,
      },
    });
  }

  // Update the best thirds with confirmed order
  const qualifyingGroups = confirmedRanking
    .slice(0, 8)
    .map((r: any) => r.groupLetter)
    .sort()
    .join('');

  await prisma.bestThirds.upsert({
    where: { poolId_contextKey: { poolId: POOL_ID, contextKey: entryId } },
    update: {
      ranking: confirmedRanking,
      combinationKey: qualifyingGroups,
      confirmed: true,
    },
    create: {
      poolId: POOL_ID,
      contextType: 'PARTICIPANT',
      contextKey: entryId,
      ranking: confirmedRanking,
      combinationKey: qualifyingGroups,
      confirmed: true,
    },
  });

  // Now generate the bracket
  const result = await generateParticipantBracket(POOL_ID, user.id, entryId);

  return NextResponse.json({ success: true, bracket: result });
}