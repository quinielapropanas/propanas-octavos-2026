// ═══════════════════════════════════════════════════════════
// /api/admin/config — Pool scoring config + behavior flags
// GET: read current config
// PUT: update config (with D3 exclusion validation)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { validateExclusionRules } from '@/lib/domain/scoring/pairing-matcher';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  const [concepts, flags] = await Promise.all([
    prisma.poolScoringConcept.findMany({
      where: { poolId: auth.poolId }, orderBy: { conceptId: 'asc' },
    }),
    prisma.poolBehaviorFlags.findFirst({ where: { poolId: auth.poolId } }),
  ]);

  return NextResponse.json({ concepts, flags });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { concepts, flags } = body;

  // D3: Validate exclusion rules before saving
  if (concepts) {
    const error = validateExclusionRules(concepts);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const before = await tx.poolScoringConcept.findMany({ where: { poolId: auth.poolId } });

      for (const c of concepts) {
        await tx.poolScoringConcept.upsert({
          where: { poolId_conceptId: { poolId: auth.poolId, conceptId: c.conceptId } },
          update: { name: c.name, points: c.points, isActive: c.isActive, description: c.description },
          create: { poolId: auth.poolId, ...c },
        });
      }

      await tx.auditLog.create({
        data: {
          poolId: auth.poolId, actorUserId: auth.userId,
          action: 'config_changed', entityType: 'pool_scoring_concept',
          payloadBefore: before as any, payloadAfter: concepts,
        },
      });
    });
  }

  if (flags) {
    await prisma.$transaction(async (tx) => {
      const before = await tx.poolBehaviorFlags.findFirst({ where: { poolId: auth.poolId } });

      await tx.poolBehaviorFlags.updateMany({
        where: { poolId: auth.poolId },
        data: flags,
      });

      await tx.auditLog.create({
        data: {
          poolId: auth.poolId, actorUserId: auth.userId,
          action: 'config_changed', entityType: 'pool_behavior_flags',
          payloadBefore: before as any, payloadAfter: flags,
        },
      });
    });
  }

  return NextResponse.json({ success: true });
}
