import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/client';

const POOL_ID = 'pool-propanas-2026';

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

  // Get entry info
  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    select: { id: true, userId: true, displayName: true },
  });
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

// Get ranking - try entryId first, then search by auth userId
  let ranking = await prisma.ranking.findFirst({
    where: { poolId: POOL_ID, userId: entryId },
  });

  if (!ranking) {
    const userEntry = await prisma.entry.findFirst({
      where: { poolId: POOL_ID, userId: entryId },
      select: { id: true },
    });
    if (userEntry) {
      ranking = await prisma.ranking.findFirst({
        where: { poolId: POOL_ID, userId: userEntry.id },
      });
    }
  }

// Get score breakdowns - try entryId first, then as ranking userId
  let breakdowns = await prisma.scoreBreakdown.findMany({
    where: { poolId: POOL_ID, userId: entryId },
  });

  // If nothing found, the entryId might be an auth userId - find the entry first
  if (breakdowns.length === 0) {
    const userEntries = await prisma.entry.findMany({
      where: { poolId: POOL_ID, userId: entryId },
      select: { id: true },
    });
    if (userEntries.length > 0) {
      const entryIds = userEntries.map(e => e.id);
      breakdowns = await prisma.scoreBreakdown.findMany({
        where: { poolId: POOL_ID, userId: { in: entryIds } },
      });
    }
  }

  const concepts = await prisma.poolScoringConcept.findMany({
    where: { poolId: POOL_ID },
    orderBy: { conceptId: 'asc' },
  });

  // Group by concept
  const conceptSummary = concepts.map(c => {
    const items = breakdowns.filter(b => b.conceptId === c.conceptId);
    const aciertos = items.filter(b => b.pointsAwarded > 0);
    return {
      conceptId: c.conceptId,
      name: c.name,
      pointsPerHit: c.points,
      evaluations: items.length,
      hits: aciertos.length,
      totalPoints: aciertos.reduce((sum, b) => sum + b.pointsAwarded, 0),
      details: aciertos.map(b => ({
        pointsAwarded: b.pointsAwarded,
        explanation: b.explanation,
        matchId: b.matchId,
        slotId: b.slotId,
      })),
    };
  }).filter(c => c.evaluations > 0);

  const totalPoints = conceptSummary.reduce((sum, c) => sum + c.totalPoints, 0);

  return NextResponse.json({
    entry: {
      id: entry.id,
      displayName: entry.displayName,
    },
    position: ranking?.position ?? null,
    totalPoints,
    phase1Points: ranking?.phase1Points ?? 0,
    phase2Points: ranking?.phase2Points ?? 0,
    concepts: conceptSummary,
  });
}