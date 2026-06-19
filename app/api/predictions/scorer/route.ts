// ═══════════════════════════════════════════════════════════
// /api/predictions/scorer — Top scorer prediction (per entry)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

async function handleSave(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
   

    const { playerName, teamId, goals, entryId: requestEntryId } = body;

    let entry;
    if (requestEntryId) {
      entry = await prisma.entry.findUnique({ where: { id: requestEntryId } });

      if (entry && entry.userId !== auth.userId) {
        return NextResponse.json({ error: 'Entry not yours' }, { status: 403 });
      }
    }
    if (!entry) {
      entry = await prisma.entry.findFirst({
        where: { poolId: auth.poolId, userId: auth.userId },
        orderBy: { entryNumber: 'asc' },
      });
    }
    if (!entry) {
      return NextResponse.json({ error: 'No entry found' }, { status: 404 });
    }

    const deadline = await prisma.poolDeadline.findFirst({
      where: { poolId: auth.poolId, scope: 'GLOBAL' },
    });
   
    if (deadline && new Date() > deadline.deadlineAt) {
      return NextResponse.json({ error: 'El deadline ha pasado.' }, { status: 403 });
    }

    if (['SUBMITTED', 'APPROVED', 'LOCKED'].includes(entry.status ?? '')) {
      const existingScorer = await prisma.topScorerPrediction.findFirst({
        where: { poolId: auth.poolId, entryId: entry.id },
      });

      if (existingScorer?.playerName && (existingScorer.goals ?? 0) > 0) {
        return NextResponse.json({
          error: 'El goleador ya fue guardado y la quiniela está cerrada.',
        }, { status: 403 });
      }
    }

    const existing = await prisma.topScorerPrediction.findFirst({
      where: { poolId: auth.poolId, entryId: entry.id },
    });

    let prediction;
    if (existing) {
      prediction = await prisma.topScorerPrediction.update({
        where: { id: existing.id },
        data: { playerName, teamId, goals },
      });
    } else {
      prediction = await prisma.topScorerPrediction.create({
        data: {
          poolId: auth.poolId, userId: auth.userId, entryId: entry.id,
          playerName, teamId, goals,
        },
      });
    }

    return NextResponse.json({ success: true, prediction });
  } catch (err: any) {
    console.error('[scorer] ERROR:', err?.message, err?.stack);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleSave(req);
}

export async function PUT(req: NextRequest) {
  return handleSave(req);
}
