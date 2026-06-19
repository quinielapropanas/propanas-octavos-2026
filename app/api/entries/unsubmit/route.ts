// ═══════════════════════════════════════════════════════════
// POST /api/entries/unsubmit — Revert SUBMITTED → DRAFT
//
// Only allowed if no deadlines have passed (D6).
// User can edit predictions again after this.
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const entry = await prisma.entry.findFirst({ where: { poolId: auth.poolId, userId: auth.userId },
  });

  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  if (entry.status === 'LOCKED') {
    return NextResponse.json({ error: 'Entry is locked — cannot revert' }, { status: 403 });
  }

  if (entry.status === 'DRAFT') {
    return NextResponse.json({ error: 'Entry is already a draft' }, { status: 400 });
  }

  // Check if any deadline has passed
  const now = new Date();
  const passedDeadline = await prisma.poolDeadline.findFirst({
    where: { poolId: auth.poolId, deadlineAt: { lte: now } },
  });

  if (passedDeadline) {
    return NextResponse.json({
      error: 'A deadline has already passed — entry cannot be reverted',
    }, { status: 403 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.entry.update({
      where: { id: entry.id },
      data: {
        status: 'DRAFT',
        submittedAt: null,
      },
    });

    await tx.auditLog.create({
      data: {
        poolId: auth.poolId,
        actorUserId: auth.userId,
        action: 'entry_unsubmitted',
        entityType: 'entry',
        entityId: saved.id,
        payloadBefore: { status: 'SUBMITTED' },
        payloadAfter: { status: 'DRAFT' },
      },
    });

    return saved;
  });

  return NextResponse.json({ success: true, status: updated.status });
}
