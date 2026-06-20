// ═══════════════════════════════════════════════════════════
// Bracket Generator for OCTAVOS quiniela
// Copies R16 slots from official bracket to participant
// ═══════════════════════════════════════════════════════════

import { prisma } from '@/lib/db/client';

const POOL_ID = 'pool-propanas-octavos-2026';

export async function generateOctavosParticipantBracket(
  userId: string,
  entryId: string,
): Promise<{ generated: boolean; slotsCreated: number }> {
  // Get official R16 slots (configured by admin in setup-r16)
  const officialR16 = await prisma.bracketSlot.findMany({
    where: {
      poolId: POOL_ID,
      contextType: 'OFFICIAL',
      contextKey: 'OFFICIAL',
      round: 'R16',
    },
  });

  if (officialR16.length === 0) {
    return { generated: false, slotsCreated: 0 };
  }

  // Check if participant already has R16 slots
  const existing = await prisma.bracketSlot.findMany({
    where: {
      poolId: POOL_ID,
      contextType: 'PARTICIPANT',
      contextKey: entryId,
      round: 'R16',
    },
  });

  if (existing.length >= 8) {
    return { generated: false, slotsCreated: 0 };
  }

  // Copy official R16 slots to participant bracket
  let count = 0;
  for (const officialSlot of officialR16) {
    await prisma.bracketSlot.upsert({
      where: {
        poolId_contextKey_slotId: {
          poolId: POOL_ID,
          contextKey: entryId,
          slotId: officialSlot.slotId,
        },
      },
      update: {
        round: 'R16',
        homeTeamId: officialSlot.homeTeamId,
        awayTeamId: officialSlot.awayTeamId,
        contextType: 'PARTICIPANT',
      },
      create: {
        poolId: POOL_ID,
        contextType: 'PARTICIPANT',
        contextKey: entryId,
        slotId: officialSlot.slotId,
        round: 'R16',
        homeTeamId: officialSlot.homeTeamId,
        awayTeamId: officialSlot.awayTeamId,
      },
    });
    count++;
  }

  return { generated: true, slotsCreated: count };
}