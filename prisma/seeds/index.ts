// ═══════════════════════════════════════════════════════════
// Seed Orchestrator — ProPanas 2026
//
// Execution: npx tsx prisma/seeds/index.ts
//
// Creates in order:
//   1. Admin user (if not exists)
//   2. Pool
//   3. Teams (48)
//   4. Matches (104) — groups with team refs, knockout without
//   5. Scoring concepts (17)
//   6. Behavior flags
//   7. Admin membership + entry
//
// All operations are idempotent (upsert where possible).
// Parametrized by poolId for multi-pool support (D5).
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import { TEAMS } from './teams';
import { ALL_MATCHES } from './matches';
import { SCORING_CONCEPTS, DEFAULT_BEHAVIOR_FLAGS } from './scoring-defaults';

const prisma = new PrismaClient();

// ─── Configuration ───────────────────────────────────────

const ADMIN_USER = {
  id: 'admin-propanas-2026',
  email: 'admin@propanas2026.com',
  displayName: 'Admin ProPanas',
};

const POOL_CONFIG = {
  name: 'ProPanas Mundial 2026',
  description: 'Quiniela oficial del Mundial FIFA 2026 — por Tama & Bemba',
};

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log('🏟️  ProPanas 2026 — Seeding database...\n');

  // 1. Admin user
  console.log('1/7 Creating admin user...');
  const admin = await prisma.user.upsert({
    where: { id: ADMIN_USER.id },
    update: {},
    create: {
      id: ADMIN_USER.id,
      email: ADMIN_USER.email,
      displayName: ADMIN_USER.displayName,
    },
  });
  console.log(`   ✓ Admin: ${admin.email}`);

  // 2. Pool
  console.log('2/7 Creating pool...');
  const pool = await prisma.pool.upsert({
    where: { id: 'pool-propanas-2026' },
    update: { name: POOL_CONFIG.name, description: POOL_CONFIG.description },
    create: {
      id: 'pool-propanas-2026',
      name: POOL_CONFIG.name,
      description: POOL_CONFIG.description,
      status: 'DRAFT',
      createdById: admin.id,
    },
  });
  console.log(`   ✓ Pool: ${pool.name} (${pool.id})`);

  // 3. Teams (48)
  console.log('3/7 Seeding 48 teams...');
  let teamCount = 0;
  const teamIdMap = new Map<string, string>();

  for (const team of TEAMS) {
    const created = await prisma.team.upsert({
      where: {
        poolId_shortName: { poolId: pool.id, shortName: team.shortName },
      },
      update: {
        name: team.name,
        fifaRanking: team.fifaRanking,
        flagAssetKey: team.flagAssetKey,
      },
      create: {
        poolId: pool.id,
        name: team.name,
        shortName: team.shortName,
        isoCode: team.isoCode,
        groupLetter: team.groupLetter,
        fifaRanking: team.fifaRanking,
        flagAssetKey: team.flagAssetKey,
      },
    });
    teamIdMap.set(team.shortName, created.id);
    teamCount++;
  }
  console.log(`   ✓ ${teamCount} teams seeded`);

  // 4. Matches (104)
  console.log('4/7 Seeding 104 matches...');
  let matchCount = 0;

  for (const match of ALL_MATCHES) {
    const homeTeamId = match.homeTeam ? teamIdMap.get(match.homeTeam) ?? null : null;
    const awayTeamId = match.awayTeam ? teamIdMap.get(match.awayTeam) ?? null : null;

    if (match.homeTeam && !homeTeamId) {
      console.warn(`   ⚠ Team not found: ${match.homeTeam} (match ${match.matchNumber})`);
    }
    if (match.awayTeam && !awayTeamId) {
      console.warn(`   ⚠ Team not found: ${match.awayTeam} (match ${match.matchNumber})`);
    }

    await prisma.match.upsert({
      where: {
        poolId_matchNumber: { poolId: pool.id, matchNumber: match.matchNumber },
      },
      update: {
        homeTeamId,
        awayTeamId,
        scheduledAt: new Date(match.scheduledAt),
        venue: match.venue,
        city: match.city,
      },
      create: {
        poolId: pool.id,
        matchNumber: match.matchNumber,
        phase: match.phase,
        groupLetter: match.groupLetter,
        slotId: match.slotId,
        homeTeamId,
        awayTeamId,
        homeOrigin: match.homeOrigin,
        awayOrigin: match.awayOrigin,
        parentSlot1: match.parentSlot1,
        parentSlot2: match.parentSlot2,
        scheduledAt: new Date(match.scheduledAt),
        venue: match.venue,
        city: match.city,
      },
    });
    matchCount++;
  }
  console.log(`   ✓ ${matchCount} matches seeded`);

  // 5. Scoring concepts (17)
  console.log('5/7 Seeding 17 scoring concepts...');
  for (const concept of SCORING_CONCEPTS) {
    await prisma.poolScoringConcept.upsert({
      where: {
        poolId_conceptId: { poolId: pool.id, conceptId: concept.conceptId },
      },
      update: {
        name: concept.name,
        points: concept.points,
        isActive: concept.isActive,
        description: concept.description,
      },
      create: {
        poolId: pool.id,
        conceptId: concept.conceptId,
        name: concept.name,
        points: concept.points,
        isActive: concept.isActive,
        description: concept.description,
      },
    });
  }
  console.log('   ✓ 17 scoring concepts seeded');

  // 6. Behavior flags
  console.log('6/7 Seeding behavior flags...');
  await prisma.poolBehaviorFlags.upsert({
    where: { poolId: pool.id },
    update: DEFAULT_BEHAVIOR_FLAGS,
    create: {
      poolId: pool.id,
      ...DEFAULT_BEHAVIOR_FLAGS,
    },
  });
  console.log('   ✓ Behavior flags seeded');

  // 7. Admin membership + entry
  console.log('7/7 Creating admin membership and entry...');
  await prisma.poolMembership.upsert({
    where: {
      poolId_userId: { poolId: pool.id, userId: admin.id },
    },
    update: {},
    create: {
      poolId: pool.id,
      userId: admin.id,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const existingEntry = await prisma.entry.findFirst({
    where: { poolId: pool.id, userId: admin.id },
  });
  if (!existingEntry) {
    await prisma.entry.create({
      data: {
        poolId: pool.id,
        userId: admin.id,
        entryNumber: 1,
        displayName: 'Admin ProPanas 1',
        status: 'DRAFT',
      },
    });
  }
  console.log('   ✓ Admin membership and entry created');

  // ── Summary ──
  console.log('\n═══════════════════════════════════════════');
  console.log('🎉 Seed complete!');
  console.log(`   Pool:     ${pool.name}`);
  console.log(`   Teams:    ${teamCount}`);
  console.log(`   Matches:  ${matchCount}`);
  console.log(`   Concepts: 17`);
  console.log(`   Admin:    ${admin.email}`);
  console.log('═══════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
