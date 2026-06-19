import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { lookupFIFAMatrix } from '@/lib/domain/tournament/fifa-matrix';

const POOL_ID = 'pool-propanas-2026';
const THIRD_PLACE_HOSTS = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L'];

// GET: obtener terceros oficiales
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  // Check if best thirds already exist for official
  let existing = await prisma.bestThirds.findFirst({
    where: { poolId: POOL_ID, contextType: 'OFFICIAL', contextKey: 'OFFICIAL' },
  });

  // If not, calculate from group standings
  if (!existing) {
    const standings = await prisma.groupStanding.findMany({
      where: { poolId: POOL_ID, contextType: 'OFFICIAL' },
    });

    if (standings.length === 0) {
      return NextResponse.json({ thirds: null, confirmed: false, message: 'No official group standings yet' });
    }

    // Extract thirds from standings
    const thirds: any[] = [];
    for (const s of standings) {
      const positions = s.positions as any[];
      const third = positions.find((p: any) => p.position === 3);
      if (third) {
        thirds.push({
          teamId: third.teamId,
          groupLetter: s.groupLetter,
          points: third.points ?? 0,
          goalDifference: third.goalDifference ?? 0,
          goalsFor: third.goalsFor ?? 0,
        });
      }
    }

    if (thirds.length < 12) {
      return NextResponse.json({ thirds: null, confirmed: false, message: `Only ${thirds.length}/12 groups have standings` });
    }

    // Sort by FIFA criteria
    thirds.sort((a: any, b: any) =>
      (b.points - a.points) ||
      (b.goalDifference - a.goalDifference) ||
      (b.goalsFor - a.goalsFor)
    );

    // Mark top 8 as qualifying
    thirds.forEach((t: any, i: number) => { t.qualifies = i < 8; });

    const combinationKey = thirds.filter((t: any) => t.qualifies)
      .map((t: any) => t.groupLetter).sort().join('');

    // Save initial calculation
    await prisma.bestThirds.upsert({
      where: { poolId_contextKey: { poolId: POOL_ID, contextKey: 'OFFICIAL' } },
      update: { ranking: thirds, combinationKey, confirmed: false },
      create: {
        poolId: POOL_ID, contextType: 'OFFICIAL', contextKey: 'OFFICIAL',
        ranking: thirds, combinationKey, hasOverride: false, confirmed: false,
      },
    });

    existing = await prisma.bestThirds.findFirst({
      where: { poolId: POOL_ID, contextType: 'OFFICIAL', contextKey: 'OFFICIAL' },
    });
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
    ...r,
    team: teamMap.get(r.teamId) ?? null,
  }));

  return NextResponse.json({
    thirds: ranking,
    combinationKey: existing.combinationKey,
    confirmed: (existing as any).confirmed ?? false,
  });
}

// POST: confirmar terceros oficiales y generar bracket oficial
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  const { ranking: confirmedRanking } = await req.json();
  if (!confirmedRanking) {
    return NextResponse.json({ error: 'ranking required' }, { status: 400 });
  }

  const qualifyingGroups = confirmedRanking
    .slice(0, 8)
    .map((r: any) => r.groupLetter)
    .sort()
    .join('');

  // Look up FIFA matrix
  const matrixRow = lookupFIFAMatrix(qualifyingGroups);
  if (!matrixRow) {
    return NextResponse.json({
      error: `No FIFA Annexe C entry for combination "${qualifyingGroups}"`,
    }, { status: 400 });
  }

  // Save confirmed best thirds
  await prisma.bestThirds.upsert({
    where: { poolId_contextKey: { poolId: POOL_ID, contextKey: 'OFFICIAL' } },
    update: {
      ranking: confirmedRanking,
      combinationKey: qualifyingGroups,
      confirmed: true,
    },
    create: {
      poolId: POOL_ID, contextType: 'OFFICIAL', contextKey: 'OFFICIAL',
      ranking: confirmedRanking, combinationKey: qualifyingGroups,
      hasOverride: false, confirmed: true,
    },
  });

  // Build third-place team lookup
  const teams = await prisma.team.findMany({
    where: { poolId: POOL_ID },
    select: { id: true, groupLetter: true },
  });

  // Get all group standings to find team positions
  const standings = await prisma.groupStanding.findMany({
    where: { poolId: POOL_ID, contextType: 'OFFICIAL' },
  });

  const teamLookup = new Map<string, string>(); // "1A" → teamId
  for (const s of standings) {
    const positions = s.positions as any[];
    for (const p of positions) {
      teamLookup.set(`${p.position}${s.groupLetter}`, p.teamId);
    }
  }

  // Third place lookup from confirmed ranking
  const thirdLookup = new Map<string, string>(); // groupLetter → teamId
  for (const r of confirmedRanking) {
    if (r.qualifies) {
      thirdLookup.set(r.groupLetter, r.teamId);
    }
  }

  // R32 structure
  const R32_STRUCTURE: Record<string, { home: string; away: string }> = {
    'R32-01': { home: '2A', away: '2B' },
    'R32-02': { home: '1E', away: 'THIRD' },
    'R32-03': { home: '1F', away: '2C' },
    'R32-04': { home: '1C', away: '2F' },
    'R32-05': { home: '1I', away: 'THIRD' },
    'R32-06': { home: '2E', away: '2I' },
    'R32-07': { home: '1A', away: 'THIRD' },
    'R32-08': { home: '1L', away: 'THIRD' },
    'R32-09': { home: '1D', away: 'THIRD' },
    'R32-10': { home: '1G', away: 'THIRD' },
    'R32-11': { home: '2K', away: '2L' },
    'R32-12': { home: '1H', away: '2J' },
    'R32-13': { home: '1B', away: 'THIRD' },
    'R32-14': { home: '1J', away: '2H' },
    'R32-15': { home: '1K', away: 'THIRD' },
    'R32-16': { home: '2D', away: '2G' },
  };

  // Host to matrix index mapping
  const hostToThirdTeamId = new Map<string, string>();
  THIRD_PLACE_HOSTS.forEach((host, i) => {
    const thirdGroup = matrixRow[i];
    const teamId = thirdLookup.get(thirdGroup);
    if (teamId) hostToThirdTeamId.set(host, teamId);
  });

  // Generate R32 bracket slots
  let slotsCreated = 0;
  for (const [slotId, structure] of Object.entries(R32_STRUCTURE)) {
    const homeTeamId = teamLookup.get(structure.home) ?? null;
    let awayTeamId: string | null = null;

    if (structure.away === 'THIRD') {
      awayTeamId = hostToThirdTeamId.get(structure.home) ?? null;
    } else {
      awayTeamId = teamLookup.get(structure.away) ?? null;
    }

    await prisma.bracketSlot.upsert({
      where: { poolId_contextKey_slotId: { poolId: POOL_ID, contextKey: 'OFFICIAL', slotId } },
      update: {
        round: 'R32' as any, homeTeamId, awayTeamId,
        calculatedAt: new Date(), contextType: 'OFFICIAL',
      },
      create: {
        poolId: POOL_ID, contextType: 'OFFICIAL', contextKey: 'OFFICIAL',
        slotId, round: 'R32' as any, homeTeamId, awayTeamId,
      },
    });

    // Update matches table with resolved team IDs
    await prisma.match.updateMany({
      where: { poolId: POOL_ID, slotId },
      data: { homeTeamId, awayTeamId },
    });

    slotsCreated++;
  }

  return NextResponse.json({
    success: true,
    combinationKey: qualifyingGroups,
    matrixRow,
    slotsCreated,
  });
}