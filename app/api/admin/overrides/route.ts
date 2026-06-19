// ═══════════════════════════════════════════════════════════
// POST /api/admin/overrides — Override group/thirds (spec §7, G2)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { fullRebuild } from '@/lib/domain/recalculator/recalculator';
import { dataProvider, dataPersister } from '@/lib/db/data-provider';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { type, targetGroup, payload, reason } = body;

  if (!type || !payload) {
    return NextResponse.json({ error: 'type and payload required' }, { status: 400 });
  }
  if (type !== 'GROUP_STANDING' && type !== 'BEST_THIRDS') {
    return NextResponse.json({ error: 'type must be GROUP_STANDING or BEST_THIRDS' }, { status: 400 });
  }
  if (type === 'GROUP_STANDING' && !targetGroup) {
    return NextResponse.json({ error: 'targetGroup required for GROUP_STANDING' }, { status: 400 });
  }

  // Supersede existing active override of same type/group
  const override = await prisma.$transaction(async (tx) => {
    const existing = await tx.override.findFirst({
      where: {
        poolId: auth.poolId, type, targetGroup: targetGroup ?? undefined,
        supersededById: null,
      },
    });

    const created = await tx.override.create({
      data: {
        poolId: auth.poolId, type, targetGroup,
        payload, reason, createdById: auth.userId,
      },
    });

    if (existing) {
      await tx.override.update({
        where: { id: existing.id },
        data: { supersededById: created.id },
      });
    }

    await tx.auditLog.create({
      data: {
        poolId: auth.poolId, actorUserId: auth.userId,
        action: 'override_created', entityType: 'override', entityId: created.id,
        payloadBefore: existing?.payload as any, payloadAfter: payload,
      },
    });

    return created;
  });

  // Full rebuild after override (G2: re-evaluate concepts 5-6 for all participants)
  const recalcResult = await fullRebuild(auth.poolId, dataProvider, dataPersister);

  return NextResponse.json({
    success: true,
    overrideId: override.id,
    type, targetGroup,
    ...recalcResult,
  });
}
