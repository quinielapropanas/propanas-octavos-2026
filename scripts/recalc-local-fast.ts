// ═══════════════════════════════════════════════════════════
// recalc-local-fast.ts — Optimized local recalc
// All data loaded once, processed in memory, batch persisted
// Skips top scorer calculations
// Usage: npx tsx scripts\recalc-local-fast.ts
// ═══════════════════════════════════════════════════════════

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { calculateGroupStandings } from '../lib/domain/tournament/group-calculator';
import { rankBestThirds } from '../lib/domain/tournament/best-thirds';
import { resolveR32Slots, propagateWinners } from '../lib/domain/tournament/bracket-resolver';
import { evaluateAllConcepts, buildRanking } from '../lib/domain/scoring/score-evaluator';
import { lookupFIFAMatrix } from '../lib/domain/tournament/fifa-matrix';
import type {
  MatchData, MatchResult, GroupStandingResult,
  BracketSlotData, PredictionInput, TeamData,
  ScoringConfig, ScoreBreakdownResult,
} from '../lib/domain/types';

const prisma = new PrismaClient();
const POOL_ID = 'pool-propanas-octavos-2026';

function fifaMatrixLookup(key: string): Record<string, string> | null {
  const row = lookupFIFAMatrix(key);
  if (!row) return null;
  const hosts = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L'];
  const result: Record<string, string> = {};
  hosts.forEach((host, i) => { result[host] = row[i]; });
  return result;
}

async function main() {
  console.log('🏟️  ProPanas 2026 — Recálculo OPTIMIZADO');
  console.log('⏱️  Iniciando...', new Date().toISOString());

  const start = Date.now();

  const timerInterval = setInterval(() => {
    const elapsed = Date.now() - start;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    process.stdout.write(`\r⏱️  Tiempo: ${mins}m ${secs}s`);
  }, 1000);

  try {
    // ── STEP 1: Load ALL data in parallel ──
    console.log('\n📥 Paso 1/5 — Cargando todos los datos...');

    const [
      poolConfig,
      teamsRaw,
      matchesRaw,
      officialResultsRaw,
      officialBracketRaw,
      allEntries,
      allPredictionsRaw,
      allBehaviorFlags,
    ] = await Promise.all([
      prisma.poolScoringConcept.findMany({ where: { poolId: POOL_ID } }),
      prisma.team.findMany({ where: { poolId: POOL_ID } }),
      prisma.match.findMany({ where: { poolId: POOL_ID } }),
      prisma.officialResult.findMany({ where: { poolId: POOL_ID } }),
      prisma.bracketSlot.findMany({
        where: { poolId: POOL_ID, contextType: 'OFFICIAL', contextKey: 'OFFICIAL' },
      }),
      prisma.entry.findMany({
        where: { poolId: POOL_ID },
        include: { user: { select: { displayName: true } } },
      }),
      prisma.prediction.findMany({
        where: { poolId: POOL_ID, status: 'VALID', homeGoals: { not: null } },
      }),
      prisma.poolBehaviorFlags.findFirst({ where: { poolId: POOL_ID } }),
    ]);

    const adminIds = (await prisma.poolMembership.findMany({
      where: { poolId: POOL_ID, role: 'ADMIN' },
      select: { userId: true },
    })).map(m => m.userId);

    const entries = allEntries.filter(e => !adminIds.includes(e.userId));

    console.log(`   ✓ ${teamsRaw.length} equipos`);
    console.log(`   ✓ ${matchesRaw.length} partidos`);
    console.log(`   ✓ ${officialResultsRaw.length} resultados oficiales`);
    console.log(`   ✓ ${entries.length} quinielas a procesar`);
    console.log(`   ✓ ${allPredictionsRaw.length} predicciones en total`);

    // ── STEP 2: Build in-memory data structures ──
    console.log('\n🔧 Paso 2/5 — Procesando en memoria...');

    const teams: TeamData[] = teamsRaw.map(t => ({
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      groupLetter: t.groupLetter ?? '',
      flagUrl: t.flagUrl,
      fifaRanking: t.fifaRanking,
    }));

    const allMatches: MatchData[] = matchesRaw.map(m => ({
      id: m.id,
      matchNumber: m.matchNumber,
      phase: m.phase,
      groupLetter: m.groupLetter,
      slotId: m.slotId,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeOrigin: m.homeOrigin,
      awayOrigin: m.awayOrigin,
      scheduledAt: m.scheduledAt,
      venue: m.venue,
    }));

    const officialResults = new Map<string, MatchResult>();
    for (const r of officialResultsRaw) {
      officialResults.set(r.matchId, {
        matchId: r.matchId,
        homeGoals: r.homeGoals,
        awayGoals: r.awayGoals,
        homePenalties: r.homePenalties,
        awayPenalties: r.awayPenalties,
      });
    }

    // Build scoring config
    const config: ScoringConfig = {
      concepts: poolConfig.map(c => ({
        conceptId: c.conceptId,
        name: c.name,
        points: c.points,
        isActive: c.isActive,
      })),
      knockoutMatchScoringEnabled: allBehaviorFlags?.knockoutMatchScoringEnabled ?? false,
      penaltiesCountForScore: allBehaviorFlags?.penaltiesCountForScore ?? false,
      absoluteGoalDifference: allBehaviorFlags?.absoluteGoalDifference ?? true,
      goleadaThreshold: allBehaviorFlags?.goleadaThreshold ?? 4,
      golPromedioBandas: (allBehaviorFlags?.golPromedioBandas as any) ?? [],
    };

    // Group predictions by entryId
    const predictionsByEntry = new Map<string, Map<string, PredictionInput>>();
    for (const p of allPredictionsRaw) {
      if (p.homeGoals == null) continue;
      if (!predictionsByEntry.has(p.entryId)) {
        predictionsByEntry.set(p.entryId, new Map());
      }
      predictionsByEntry.get(p.entryId)!.set(p.matchId, {
        homeGoals: p.homeGoals,
        awayGoals: p.awayGoals!,
        homePenalties: p.homePenalties,
        awayPenalties: p.awayPenalties,
      });
    }

    // ── STEP 3: Calculate official standings & bracket ──
    console.log('\n🏆 Paso 3/5 — Calculando standings y bracket oficial...');

    const officialStandings: GroupStandingResult[] = [];
    for (const g of 'ABCDEFGHIJKL'.split('')) {
      officialStandings.push(calculateGroupStandings(g, teams, allMatches, officialResults));
    }

    const officialBestThirds = rankBestThirds(officialStandings);

    // Build official bracket: use admin's R32 + propagate winners
    const matchBySlot = new Map<string, string>();
    for (const m of allMatches) {
      if (m.phase !== 'GROUP') matchBySlot.set(m.slotId, m.id);
    }

    const adminR32: BracketSlotData[] = officialBracketRaw
      .filter(s => s.round === 'R32' && s.homeTeamId && s.awayTeamId)
      .map(s => ({
        slotId: s.slotId,
        round: s.round as any,
        homeTeamId: s.homeTeamId,
        awayTeamId: s.awayTeamId,
        winnerTeamId: null,
        loserTeamId: null,
      }));

    let officialBracketSlots: BracketSlotData[] = [];
    if (adminR32.length >= 16) {
      officialBracketSlots = propagateWinners(adminR32, officialResults, matchBySlot);
    } else {
      const r32 = resolveR32Slots(officialStandings, officialBestThirds, fifaMatrixLookup);
      officialBracketSlots = propagateWinners(r32, officialResults, matchBySlot);
    }

    console.log(`   ✓ ${officialStandings.length} grupos calculados`);
    console.log(`   ✓ ${officialBracketSlots.length} slots de bracket oficial`);

    // ── STEP 4: Score all participants in memory ──
    console.log('\n📊 Paso 4/5 — Puntuando participantes...');

    const allBreakdowns: ScoreBreakdownResult[] = [];
    const allParticipantStandings: { entryId: string; standings: GroupStandingResult[] }[] = [];

    let count = 0;
    for (const entry of entries) {
      count++;
      const predictions = predictionsByEntry.get(entry.id);
      if (!predictions || predictions.size === 0) continue;

      // Build participant's standings
      const participantStandings: GroupStandingResult[] = [];
      for (const g of 'ABCDEFGHIJKL'.split('')) {
        const predResults = new Map<string, MatchResult>();
        for (const m of allMatches.filter(mm => mm.groupLetter === g && mm.phase === 'GROUP')) {
          const pred = predictions.get(m.id);
          if (pred) {
            predResults.set(m.id, {
              matchId: m.id, homeGoals: pred.homeGoals, awayGoals: pred.awayGoals,
            });
          }
        }
        participantStandings.push(calculateGroupStandings(g, teams, allMatches, predResults));
      }

      const participantThirds = rankBestThirds(participantStandings);
      const participantR32 = resolveR32Slots(participantStandings, participantThirds, fifaMatrixLookup);

      const participantKnockoutResults = new Map<string, MatchResult>();
      for (const m of allMatches.filter(mm => mm.phase !== 'GROUP')) {
        const pred = predictions.get(m.id);
        if (pred) {
          participantKnockoutResults.set(m.id, {
            matchId: m.id, homeGoals: pred.homeGoals, awayGoals: pred.awayGoals,
            homePenalties: pred.homePenalties, awayPenalties: pred.awayPenalties,
          });
        }
      }
      const participantBracket = propagateWinners(participantR32, participantKnockoutResults, matchBySlot);

      // Evaluate scoring (NO topScorer)
      const breakdown = evaluateAllConcepts({
        userId: entry.id,
        config,
        predictions,
        participantGroupStandings: participantStandings,
        participantBracketSlots: participantBracket,
        participantTopScorer: null,
        officialResults,
        officialGroupStandings: officialStandings,
        officialBracketSlots,
        actualTopScorer: null,
        actualGoalAverage: null,
        matches: allMatches,
      });
      allBreakdowns.push(breakdown);
      allParticipantStandings.push({ entryId: entry.id, standings: participantStandings });

      process.stdout.write(`\n   ✓ ${count}/${entries.length} ${entry.displayName?.padEnd(35)} ${breakdown.totalPoints} pts`);
    }

    // ── STEP 5: Batch persist ──
    console.log('\n\n💾 Paso 5/5 — Guardando resultados en BD...');

    // Persist participant scores (parallel batches of 5)
    const BATCH = 5;
    for (let i = 0; i < allBreakdowns.length; i += BATCH) {
      const batch = allBreakdowns.slice(i, i + BATCH);
      await Promise.all(batch.map(async (bd) => {
        // Delete old scores for this user
        await prisma.scoreBreakdown.deleteMany({
          where: { poolId: POOL_ID, userId: bd.userId },
        });
        // Insert new scores
        if (bd.scores.length > 0) {
          await prisma.scoreBreakdown.createMany({
            data: bd.scores.map(s => ({
              poolId: POOL_ID,
              userId: bd.userId,
              conceptId: s.conceptId,
              breakdownKey: s.matchId ?? s.slotId ?? `${s.conceptId}-${Math.random()}`,
              matchId: s.matchId ?? null,
              slotId: s.slotId ?? null,
              pointsAwarded: s.pointsAwarded,
              explanation: s.explanation ?? '',
            })),
          });
        }
      }));
      process.stdout.write(`\r   Persistiendo scores: ${Math.min(i + BATCH, allBreakdowns.length)}/${allBreakdowns.length}`);
    }

    // Build and persist rankings
    console.log('\n   ✓ Calculando rankings...');
    const entryNames = new Map(entries.map(e => [e.id, e.displayName ?? '']));
    const rankings = buildRanking(allBreakdowns, entryNames);

    // Delete existing rankings and insert new
    await prisma.ranking.deleteMany({ where: { poolId: POOL_ID } });
    if (rankings.length > 0) {
      await prisma.ranking.createMany({
        data: rankings.map(r => ({
          poolId: POOL_ID,
          userId: r.userId,
          position: r.position,
          totalPoints: r.totalPoints,
          phase1Points: r.phase1Points,
          phase2Points: r.phase2Points,
          matchesPredicted: r.matchesPredicted ?? 0,
          conceptTotals: r.conceptTotals as any,
        })),
      });
    }

    clearInterval(timerInterval);

    const elapsed = Date.now() - start;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);

    console.log('\n\n═══════════════════════════════════════════');
    console.log('✅ Recálculo completado');
    console.log(`   Participantes puntuados: ${allBreakdowns.length}`);
    console.log(`   Tiempo total:            ${mins}m ${secs}s`);
    console.log('═══════════════════════════════════════════');

    // Show top rankings
    const entryMap = new Map(entries.map(e => [e.id, e.displayName ?? e.user?.displayName ?? '?']));
    console.log('\n🏆 RANKING:');
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