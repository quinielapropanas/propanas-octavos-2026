import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, 'ADMIN');
  if (isAuthError(auth)) return auth;

  const { entryId } = await req.json();
  if (!entryId) return NextResponse.json({ error: 'entryId required' }, { status: 400 });

  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

  if (entry.status !== 'SUBMITTED') {
    return NextResponse.json({ error: 'Entry must be SUBMITTED to approve' }, { status: 400 });
  }

  await prisma.entry.update({
    where: { id: entryId },
    data: { status: 'APPROVED' },
  });

  return NextResponse.json({ success: true });
}