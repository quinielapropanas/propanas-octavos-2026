import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { generateParticipantBracket, advanceBracketRound } from '@/lib/domain/bracket-generator';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { entryId } = await req.json();
  if (!entryId) {
    return NextResponse.json({ error: 'entryId required' }, { status: 400 });
  }

  // Verify entry belongs to user
  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry || entry.userId !== auth.userId) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  const results: string[] = [];

  // Step 1: Generate R32 from groups
  const r32 = await generateParticipantBracket(auth.poolId, auth.userId, entryId);
  results.push(`R32: ${r32.generated ? r32.slotsCreated + ' slots' : 'skipped (groups incomplete)'}`);

  if (!r32.generated) {
    return NextResponse.json({ success: false, results, message: 'Groups not complete' });
  }

  // Step 2: Advance through each round until no more advances
  let keepGoing = true;
  while (keepGoing) {
    const advance = await advanceBracketRound(auth.poolId, auth.userId, entryId);
    if (advance.advanced) {
      results.push(`${advance.round}: ${advance.slotsCreated} slots`);
    } else {
      keepGoing = false;
    }
  }

  return NextResponse.json({ success: true, results });
}