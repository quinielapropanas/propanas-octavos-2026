// ═══════════════════════════════════════════════════════════
// /api/predictions — Participant predictions CRUD (spec §8)
// GET: fetch all predictions for current user
// PUT: upsert prediction with cascade check (D2)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// /api/predictions — Participant predictions CRUD (spec §8)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError, isMatchLocked, isEntryLocked } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { analyzeCascadeImpact } from '@/lib/domain/tournament/bracket-resolver';
import { generateParticipantBracket, advanceBracketRound } from '@/lib/domain/bracket-generator';

// ─── GET ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const predictions = await prisma.prediction.findMany({
    where: { poolId: auth.poolId, userId: auth.userId },
    orderBy: { match: { matchNumber: 'asc' } },
    include: { match: { select: { matchNumber: true, slotId: true, phase: true, groupLetter: true } } },
  });

  return NextResponse.json({ predictions });
}

// ─── PUT ─────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const {
    matchId, homeGoals, awayGoals, homePenalties, awayPenalties,
    confirmCascade, entryId: requestEntryId,
  } = body;

  if (!matchId || homeGoals == null || awayGoals == null) {
    return NextResponse.json({ error: 'matchId, homeGoals, awayGoals required' }, { status: 400 });
  }

  if (await isEntryLocked(auth.poolId, auth.userId)) {
    return NextResponse.json({ error: 'Your entry is locked — no edits allowed' }, { status: 403 });
  }

  if (await isMatchLocked(auth.poolId, matchId)) {
    return NextResponse.json({ error: 'This match is past its deadline — locked' }, { status: 403 });
  }

  const match = await prisma.match.findFirst({
    where: { id: matchId, poolId: auth.poolId },
  });
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  if (match.phase !== 'GROUP' && homeGoals === awayGoals) {
    if (homePenalties == null || awayPenalties == null) {
      return NextResponse.json({ error: 'Knockout match tied: penalties required' }, { status: 400 });
    }
  }

  // Find the correct entry
  let entry;
  if (requestEntryId) {
    entry = await prisma.entry.findUnique({ where: { id: requestEntryId } });
  }
  if (!entry) {
    entry = await prisma.entry.findFirst({
      where: { poolId: auth.poolId, userId: auth.userId },
      orderBy: { entryNumber: 'asc' },
    });
  }
  if (!entry) {
    entry = await prisma.entry.create({
      data: {
        poolId: auth.poolId, userId: auth.userId,
        entryNumber: 1, displayName: auth.displayName + ' 1', status: 'DRAFT',
      },
    });
  }

// Cascade: if group match changes, reset ALL bracket predictions and slots
  if (match.phase === 'GROUP') {
    // Check if user has ANY knockout predictions
    const existingKnockoutPredictions = await prisma.prediction.findMany({
      where: {
        poolId: auth.poolId, entryId: entry.id,
        status: 'VALID', homeGoals: { not: null },
        match: { phase: { not: 'GROUP' } },
      },
      select: { id: true },
    });

    if (existingKnockoutPredictions.length > 0) {
      // Delete all knockout predictions for this entry
      await prisma.prediction.deleteMany({
        where: {
          poolId: auth.poolId, entryId: entry.id,
          match: { phase: { not: 'GROUP' } },
        },
      });

      // Delete bracket slots (except R32 which will be regenerated)
      await prisma.bracketSlot.deleteMany({
        where: {
          poolId: auth.poolId, contextType: 'PARTICIPANT',
          contextKey: entry.id,
        },
      });

      // Reset best thirds confirmation
      await prisma.bestThirds.deleteMany({
        where: {
          poolId: auth.poolId, contextType: 'PARTICIPANT',
          contextKey: entry.id,
        },
      });

      // Reset group standings so they get recalculated
      await prisma.groupStanding.deleteMany({
        where: {
          poolId: auth.poolId, contextType: 'PARTICIPANT',
          contextKey: entry.id,
        },
      });
    }
  }

  // Upsert prediction
  const prediction = await prisma.prediction.upsert({
    where: {
      poolId_entryId_matchId: { poolId: auth.poolId, entryId: entry.id, matchId },
    },
    update: {
      homeGoals, awayGoals, homePenalties, awayPenalties,
      status: 'VALID', invalidatedBy: null,
    },
    create: {
      poolId: auth.poolId, userId: auth.userId, entryId: entry.id, matchId,
      homeGoals, awayGoals, homePenalties, awayPenalties,
    },
  });

  // Update entry completion stats
  await updateEntryCompletion(auth.poolId, entry.id);

// When groups complete, calculate standings + best thirds but don't generate bracket yet
  let bracketUpdate = null;
  if (match.phase === 'GROUP') {
    const groupCount = await prisma.prediction.count({
      where: {
        poolId: auth.poolId, entryId: entry.id, status: 'VALID',
        homeGoals: { not: null }, match: { phase: 'GROUP' },
      },
    });

    if (groupCount >= 72) {
      // Generate standings and best thirds (but NOT bracket slots)
      const result = await generateParticipantBracket(auth.poolId, auth.userId, entry.id);
      if (result.generated) {
        bracketUpdate = {
          type: 'groups_complete',
          slotsCreated: result.slotsCreated,
          redirectTo: `/best-thirds?entry=${entry.id}`,
        };
      }
    }
  }

if (match.phase !== 'GROUP') {
    // Determine which rounds come AFTER the current one
    const roundOrder = ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'];
    const currentIndex = roundOrder.indexOf(match.phase);
    const laterRounds = roundOrder.slice(currentIndex + 1);

    if (laterRounds.length > 0) {
      // Check if user has predictions in later rounds
      const laterPredictions = await prisma.prediction.count({
        where: {
          poolId: auth.poolId, entryId: entry.id,
          status: 'VALID', homeGoals: { not: null },
          match: { phase: { in: laterRounds as any } },
        },
      });

      if (laterPredictions > 0) {
        // Delete predictions in later rounds
        await prisma.prediction.deleteMany({
          where: {
            poolId: auth.poolId, entryId: entry.id,
            match: { phase: { in: laterRounds as any } },
          },
        });

        // Delete bracket slots for later rounds
        const laterSlots = await prisma.bracketSlot.findMany({
          where: {
            poolId: auth.poolId, contextType: 'PARTICIPANT',
            contextKey: entry.id, round: { in: laterRounds as any },
          },
          select: { id: true },
        });

        if (laterSlots.length > 0) {
          await prisma.bracketSlot.deleteMany({
            where: {
              poolId: auth.poolId, contextType: 'PARTICIPANT',
              contextKey: entry.id, round: { in: laterRounds as any },
            },
          });
        }
      }
    }

    // Advance bracket for ALL remaining rounds
    let totalSlotsCreated = 0;
    let lastRound = null;
    for (let i = 0; i < 5; i++) {
      const result = await advanceBracketRound(auth.poolId, auth.userId, entry.id);
      if (!result.advanced) break;
      totalSlotsCreated += result.slotsCreated ?? 0;
      lastRound = result.round;
    }
    if (lastRound) {
      bracketUpdate = { type: 'round_advanced', round: lastRound, slotsCreated: totalSlotsCreated };
    }
  }

  return NextResponse.json({ success: true, prediction, bracketUpdate });
}

// ─── Helpers ─────────────────────────────────────────────

async function updateEntryCompletion(poolId: string, entryId: string) {
  const totalPredictions = await prisma.prediction.count({
    where: { poolId, entryId, status: 'VALID', homeGoals: { not: null } },
  });

  await prisma.entry.update({
    where: { id: entryId },
    data: {
      completionPct: Math.round((totalPredictions / 32) * 100),
    },
  });
}

 
