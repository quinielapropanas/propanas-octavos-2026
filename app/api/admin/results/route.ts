// ═══════════════════════════════════════════════════════════
// POST /api/admin/results — Load official result (no auto-recalc)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { matchId, homeGoals, awayGoals, homePenalties, awayPenalties, fairPlayHome, fairPlayAway } = body;

  if (!matchId || homeGoals == null || awayGoals == null) {
    return NextResponse.json({ error: 'matchId, homeGoals, awayGoals are required' }, { status: 400 });
  }
  if (typeof homeGoals !== 'number' || typeof awayGoals !== 'number' || homeGoals < 0 || awayGoals < 0) {
    return NextResponse.json({ error: 'Goals must be non-negative integers' }, { status: 400 });
  }

  const match = await prisma.match.findFirst({
    where: { id: matchId, poolId: auth.poolId },
  });
  if (!match) {
    return NextResponse.json({ error: 'Match not found in this pool' }, { status: 404 });
  }

  if (match.phase !== 'GROUP' && homeGoals === awayGoals) {
    if (homePenalties == null || awayPenalties == null) {
      return NextResponse.json({
        error: 'Knockout match tied at full time: homePenalties and awayPenalties are required',
      }, { status: 400 });
    }
    if (homePenalties === awayPenalties) {
      return NextResponse.json({
        error: 'Penalties cannot be tied — one team must win',
      }, { status: 400 });
    }
  }

  // Persist result + audit log (no recalc)
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.officialResult.findUnique({ where: { matchId } });
    const payloadBefore = existing ? {
      homeGoals: existing.homeGoals, awayGoals: existing.awayGoals,
      homePenalties: existing.homePenalties, awayPenalties: existing.awayPenalties,
    } : null;

    const saved = await tx.officialResult.upsert({
      where: { matchId },
      update: {
        homeGoals, awayGoals, homePenalties, awayPenalties,
        fairPlayHome, fairPlayAway,
        loadedById: auth.userId,
        loadedAt: new Date(),
        version: existing ? existing.version + 1 : 1,
      },
      create: {
        poolId: auth.poolId, matchId,
        homeGoals, awayGoals, homePenalties, awayPenalties,
        fairPlayHome, fairPlayAway,
        loadedById: auth.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        poolId: auth.poolId, actorUserId: auth.userId,
        action: 'result_loaded', entityType: 'official_result', entityId: saved.id,
        payloadBefore: payloadBefore ?? undefined, payloadAfter: { homeGoals, awayGoals, homePenalties, awayPenalties },
      },
    });

    return saved;
  });

  return NextResponse.json({
    success: true,
    resultId: result.id,
    matchNumber: match.matchNumber,
    slotId: match.slotId,
  });
}