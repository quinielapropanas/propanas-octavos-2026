// ═══════════════════════════════════════════════════════════
// User Sync — Supabase Auth → Prisma User table
//
// Called on:
//   1. Auth callback (email confirmation / password reset)
//   2. First API request from a new user
//   3. Login (to ensure user row exists)
//
// Idempotent: upserts by Supabase UUID.
// Also ensures Entry and PoolMembership exist for the MVP pool.
// ═══════════════════════════════════════════════════════════
import 'server-only';
import { prisma } from '@/lib/db/client';

const DEFAULT_POOL_ID = 'pool-propanas-octavos-2026';

export async function syncUserToPrisma(authUser: {
  id: string;
  email?: string;
  user_metadata?: { display_name?: string; full_name?: string; country?: string; city?: string };
}) {
  const displayName =
    authUser.user_metadata?.display_name ||
    authUser.user_metadata?.full_name ||
    authUser.email?.split('@')[0] ||
    'Usuario';

  try {
    // 1. Upsert user
    const country = authUser.user_metadata?.country ?? null;
    const city = authUser.user_metadata?.city ?? null;

    await prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        email: authUser.email ?? '',
        displayName,
        ...(country ? { country } : {}),
        ...(city ? { city } : {}),
        updatedAt: new Date(),
      },
      create: {
        id: authUser.id,
        email: authUser.email ?? '',
        displayName,
        country,
        city,
        updatedAt: new Date(),
      },
    });

    // 2. Create pool_membership if not exists
   const existingMembership = await prisma.poolMembership.findUnique({
      where: {
        poolId_userId: { poolId: DEFAULT_POOL_ID, userId: authUser.id },
      },
    });

    if (!existingMembership) {
      await prisma.poolMembership.create({
        data: {
          poolId: DEFAULT_POOL_ID,
          userId: authUser.id,
          role: 'PARTICIPANT',
          status: 'ACTIVE',
        },
      });
    }

    // 3. Create entry if not exists
    const existingEntry = await prisma.entry.findFirst({
      where: {
        poolId: DEFAULT_POOL_ID,
        userId: authUser.id,
      },
    });

    if (!existingEntry) {
      await prisma.entry.create({
        data: {
          poolId: DEFAULT_POOL_ID,
          userId: authUser.id,
          status: 'DRAFT',
          entryNumber: 1,
          displayName: `${displayName} 1`,
          updatedAt: new Date(),
        },
      });
    }

    return { success: true, isNewUser: !existingMembership };
  } catch (error) {
    console.error('[user-sync] Error syncing user:', error);
    return { success: false, isNewUser: false };
  }
}