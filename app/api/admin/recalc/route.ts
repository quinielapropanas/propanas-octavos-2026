// ═══════════════════════════════════════════════════════════
// POST /api/admin/recalc — Manual full rebuild (D8)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { fullRebuild } from '@/lib/domain/recalculator/recalculator';
import { dataProvider, dataPersister } from '@/lib/db/data-provider';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  await prisma.auditLog.create({
    data: {
      poolId: auth.poolId, actorUserId: auth.userId,
      action: 'full_rebuild_triggered', entityType: 'pool', entityId: auth.poolId,
    },
  });

  const result = await fullRebuild(auth.poolId, dataProvider, dataPersister);

  return NextResponse.json({ success: true, ...result });
}
