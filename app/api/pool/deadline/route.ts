import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

const POOL_ID = 'pool-propanas-2026';

export async function GET() {
  const deadline = await prisma.poolDeadline.findFirst({
    where: { poolId: POOL_ID, scope: 'GLOBAL' },
  });

  const passed = deadline ? new Date() > deadline.deadlineAt : false;

  return NextResponse.json({
    passed,
    deadlineAt: deadline?.deadlineAt ?? null,
  });
}