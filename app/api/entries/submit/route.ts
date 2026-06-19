// ═══════════════════════════════════════════════════════════
// POST /api/entries/submit — Transition DRAFT → SUBMITTED
//
// Marks the participant's entry as finalized. Admin or deadline
// can later transition SUBMITTED → LOCKED.
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { entryId } = await req.json();
  if (!entryId) return NextResponse.json({ error: 'entryId required' }, { status: 400 });

  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry || entry.userId !== auth.userId) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

// Check global deadline
  const deadline = await prisma.poolDeadline.findFirst({
    where: { poolId: entry.poolId, scope: 'GLOBAL' },
  });
  if (deadline && new Date() > deadline.deadlineAt) {
    return NextResponse.json({ error: 'El deadline ha pasado. No se pueden enviar quinielas.' }, { status: 403 });
  }
  
  if (entry.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Entry already submitted' }, { status: 400 });
  }

  if ((entry.completionPct ?? 0) < 100) {
    return NextResponse.json({ error: 'Entry not complete' }, { status: 400 });
  }

  await prisma.entry.update({
    where: { id: entryId },
    data: { status: 'SUBMITTED' },
  });

  return NextResponse.json({ success: true });
}