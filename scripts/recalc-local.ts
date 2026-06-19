import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { dataProvider, dataPersister } from '../lib/db/data-provider';
import { fullRebuild } from '../lib/domain/recalculator/recalculator';

const prisma = new PrismaClient();
const POOL_ID = 'pool-propanas-octavos-2026';

async function main() {
  console.log('🏟️  ProPanas 2026 — Recálculo completo');
  console.log('⏱️  Iniciando...', new Date().toISOString());

  const start = Date.now();
  
  // Progress timer that updates every 10 seconds
const timerInterval = setInterval(() => {
  const elapsed = Date.now() - start;
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  process.stdout.write(`\r⏱️  Tiempo transcurrido: ${mins}m ${secs}s`);
}, 1000);

  // Count participants
  const adminMembers = await prisma.poolMembership.findMany({
    where: { poolId: POOL_ID, role: 'ADMIN' },
    select: { userId: true },
  });
  const adminIds = adminMembers.map(m => m.userId);

  const entries = await prisma.entry.findMany({
    where: { poolId: POOL_ID, userId: { notIn: adminIds } },
    select: { id: true, displayName: true },
  });

  console.log(`📊 Quinielas a recalcular: ${entries.length}`);
  console.log('');
  console.log('Paso 1/4 — Calculando standings de grupos...');

  // Override provider to add logging
  const loggingProvider = {
    ...dataProvider,
    getParticipantIds: async (poolId: string) => {
      const ids = await dataProvider.getParticipantIds(poolId);
      console.log(`   ✓ ${ids.length} participantes encontrados`);
      return ids;
    },
  };

  // Monkey-patch persister to log rankings
  const loggingPersister = {
    ...dataPersister,
    persistGroupStandings: async (poolId: string, ctxKey: string, standings: any[]) => {
      if (ctxKey === '__OFFICIAL__') {
        process.stdout.write('.');
      }
      return dataPersister.persistGroupStandings(poolId, ctxKey, standings);
    },
    persistScoreBreakdowns: async (poolId: string, userId: string, result: any) => {
      const name = entries.find(e => e.id === userId)?.displayName ?? userId.slice(0, 8);
      process.stdout.write(`\n   📝 Puntuando: ${name.padEnd(35)} ${result.totalPoints} pts`);
      return dataPersister.persistScoreBreakdowns(poolId, userId, result);
    },
    persistRankings: async (poolId: string, rankings: any[]) => {
      console.log('\n\n   ✓ Rankings guardados');
      return dataPersister.persistRankings(poolId, rankings);
    },
  };

  console.log('Paso 2/4 — Calculando bracket oficial...');

  try {
    const result = await fullRebuild(POOL_ID, loggingProvider as any, loggingPersister as any);

    clearInterval(timerInterval);
	
	const elapsed = Date.now() - start;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);

    console.log('\n');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Recálculo completado');
    console.log(`   Grupos recalculados:     ${result.groupsRecalculated.length}`);
    console.log(`   Bracket slots:           ${result.bracketSlotsUpdated}`);
    console.log(`   Participantes puntuados: ${result.participantsScored}`);
    console.log(`   Tiempo total:            ${mins}m ${secs}s`);
    console.log('═══════════════════════════════════════════');

    // Show rankings
    const rankings = await prisma.ranking.findMany({
      where: { poolId: POOL_ID },
      orderBy: { totalPoints: 'desc' },
    });

    const entryMap = new Map(entries.map(e => [e.id, e.displayName]));

    console.log('\n🏆 RANKING ACTUAL:');
    for (const r of rankings) {
      const name = entryMap.get(r.userId) ?? r.userId;
      console.log(`   ${String(r.position).padStart(2)}. ${name.padEnd(35)} ${r.totalPoints} pts`);
    }

  } catch (err: any) {
	clearInterval(timerInterval);
    console.error('\n❌ ERROR:', err?.message);
    console.error(err?.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();