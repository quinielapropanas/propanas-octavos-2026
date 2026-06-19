// ═══════════════════════════════════════════════════════════
// Group Scoring — Concepts 5 (Classification) & 6 (Position)
// ═══════════════════════════════════════════════════════════

import type { ConceptScore, ScoringConfig, GroupStandingResult } from '../types';
import { CONCEPT } from '../types';

/**
 * Evaluate concepts 5 and 6 for a single group.
 * 
 * @param officialClassifiedThirds - Set of teamIds that officially qualified as best thirds
 * @param participantClassifiedThirds - Set of teamIds that participant predicted as best thirds
 */
export function evaluateGroupConcepts(
  participantStanding: GroupStandingResult,
  officialStanding: GroupStandingResult,
  config: ScoringConfig,
  officialClassifiedThirds?: Set<string>,
  participantClassifiedThirds?: Set<string>,
): ConceptScore[] {
  const scores: ConceptScore[] = [];
  const c5 = config.concepts.find(c => c.conceptId === CONCEPT.CLASIFICACION_SEGUNDA_FASE);
  const c6 = config.concepts.find(c => c.conceptId === CONCEPT.POSICION_CORRECTA);

  // Build set of ALL officially classified teams from this group:
  // Position 1 + Position 2 + Position 3 if they're a best third
  const officialClassified = new Set<string>();
  for (const p of officialStanding.positions) {
    if (p.position <= 2) {
      officialClassified.add(p.teamId);
    } else if (p.position === 3 && officialClassifiedThirds?.has(p.teamId)) {
      officialClassified.add(p.teamId);
    }
  }

  // Same for participant's predicted classification
  const participantClassified = new Set<string>();
  for (const p of participantStanding.positions) {
    if (p.position <= 2) {
      participantClassified.add(p.teamId);
    } else if (p.position === 3 && participantClassifiedThirds?.has(p.teamId)) {
      participantClassified.add(p.teamId);
    }
  }

  // Position maps for both
  const officialPosMap = new Map(officialStanding.positions.map(p => [p.teamId, p.position]));
  const participantPosMap = new Map(participantStanding.positions.map(p => [p.teamId, p.position]));

// Evaluate each officially classified team
  for (const row of officialStanding.positions) {
    const tid = row.teamId;
    let classificationHit = false;

    // Concept 5: Did participant predict this team would classify?
    if (c5?.isActive && officialClassified.has(tid)) {
      const matched = participantClassified.has(tid);
      classificationHit = matched;
      scores.push({
        conceptId: CONCEPT.CLASIFICACION_SEGUNDA_FASE,
        slotId: `GRP-${officialStanding.groupLetter}-${tid}`,
        pointsAwarded: matched ? c5.points : 0,
        explanation: matched
          ? `Clasificación acertada: ${tid} clasifica de Grupo ${officialStanding.groupLetter} (pos ${row.position}°)`
          : `No pronosticaste clasificación de ${tid} (pos ${row.position}°)`,
      });
    }

    // Concept 6: Position — ONLY if classification was also correct
    if (c6?.isActive && officialClassified.has(tid)) {
      const oPos = officialPosMap.get(tid);
      const pPos = participantPosMap.get(tid);
      const posMatched = classificationHit && oPos != null && pPos != null && oPos === pPos;
      scores.push({
        conceptId: CONCEPT.POSICION_CORRECTA,
        slotId: `GRP-${officialStanding.groupLetter}-${tid}`,
        pointsAwarded: posMatched ? c6.points : 0,
        explanation: posMatched
          ? `Posición correcta: ${tid} en ${oPos}° lugar`
          : !classificationHit
            ? `No se otorga posición sin acertar clasificación de ${tid}`
            : `Posición incorrecta: ${tid} pronosticado ${pPos}°, real ${oPos}°`,
      });
    }
  }
  return scores;
}

// ═══════════════════════════════════════════════════════════
// Advance Scoring — Concepts 7-13 (slot-based, D1, G1)
// ═══════════════════════════════════════════════════════════

import type { BracketSlotData } from '../types';

export function evaluateAdvanceConcepts(
  participantSlots: BracketSlotData[],
  officialSlots: BracketSlotData[],
  config: ScoringConfig,
): ConceptScore[] {
  const scores: ConceptScore[] = [];

  // Concepts 7-10: team PRESENT in the round (not slot-specific)
  const advanceConcepts = [
    { conceptId: CONCEPT.AVANZA_R16, round: 'R16' as const },
    { conceptId: CONCEPT.AVANZA_QF, round: 'QF' as const },
    { conceptId: CONCEPT.AVANZA_SF, round: 'SF' as const },
    { conceptId: CONCEPT.AVANZA_FINAL, round: 'FINAL' as const },
  ];

  for (const { conceptId, round } of advanceConcepts) {
    const concept = config.concepts.find(c => c.conceptId === conceptId);
    if (!concept?.isActive) continue;

    // Collect ALL teams that officially appear in this round
    const officialTeamsInRound = new Set<string>();
    for (const slot of officialSlots) {
      if (slot.round !== round) continue;
      if (!slot.winnerTeamId) continue; // Only count resolved slots
      if (slot.homeTeamId) officialTeamsInRound.add(slot.homeTeamId);
      if (slot.awayTeamId) officialTeamsInRound.add(slot.awayTeamId);
    }

    // Collect ALL teams the participant predicted in this round
    const participantTeamsInRound = new Set<string>();
    for (const slot of participantSlots) {
      if (slot.round !== round) continue;
      if (slot.homeTeamId) participantTeamsInRound.add(slot.homeTeamId);
      if (slot.awayTeamId) participantTeamsInRound.add(slot.awayTeamId);
    }

    // Award points per official team that was also predicted in the same round
    const evaluated = new Set<string>();
    for (const teamId of officialTeamsInRound) {
      if (evaluated.has(teamId)) continue;
      evaluated.add(teamId);

      const predicted = participantTeamsInRound.has(teamId);
      scores.push({
        conceptId,
        slotId: `${round}-${teamId}`,
        pointsAwarded: predicted ? concept.points : 0,
        explanation: predicted
          ? `Acertaste: ${teamId} avanza a ${round}`
          : `No acertaste ${teamId} en ${round}`,
      });
    }
  }

 // Concept 13: Campeón — check by team, not slot-specific
  evaluateOutcomeByTeam(scores, config, officialSlots, participantSlots,
    CONCEPT.CAMPEON, 'F-01', 'winner', 'Campeón');
  // Concept 12: Subcampeón
  evaluateOutcomeByTeam(scores, config, officialSlots, participantSlots,
    CONCEPT.SUBCAMPEON, 'F-01', 'loser', 'Subcampeón');
  // Concept 11: Tercer lugar
  evaluateOutcomeByTeam(scores, config, officialSlots, participantSlots,
    CONCEPT.TERCER_LUGAR, '3RD-01', 'winner', 'Tercer lugar');

  return scores;
}





function evaluateOutcome(
  scores: ConceptScore[], config: ScoringConfig,
  officialMap: Map<string, BracketSlotData>,
  participantMap: Map<string, BracketSlotData>,
  conceptId: number, slotId: string,
  which: 'winner' | 'loser',
) {
  const concept = config.concepts.find(c => c.conceptId === conceptId);
  if (!concept?.isActive) return;

  const official = officialMap.get(slotId);
  const participant = participantMap.get(slotId);
  if (!official || !participant) return;

  const officialTeam = which === 'winner' ? official.winnerTeamId : official.loserTeamId;
  const participantTeam = which === 'winner' ? participant.winnerTeamId : participant.loserTeamId;
  if (!officialTeam) return;

  const matched = officialTeam === participantTeam;
  const label = conceptId === CONCEPT.CAMPEON ? 'Campeón'
    : conceptId === CONCEPT.SUBCAMPEON ? 'Subcampeón' : 'Tercer lugar';
  scores.push({
    conceptId, slotId,
    pointsAwarded: matched ? concept.points : 0,
    explanation: matched ? `${label} acertado: ${officialTeam}` : `${label} no acertado`,
  });
}

function evaluateOutcomeByTeam(
  scores: ConceptScore[], config: ScoringConfig,
  officialSlots: BracketSlotData[],
  participantSlots: BracketSlotData[],
  conceptId: number, slotId: string,
  which: 'winner' | 'loser',
  label: string,
) {
  const concept = config.concepts.find(c => c.conceptId === conceptId);
  if (!concept?.isActive) return;

  const official = officialSlots.find(s => s.slotId === slotId);
  if (!official) return;

  const officialTeam = which === 'winner' ? official.winnerTeamId : official.loserTeamId;
  if (!officialTeam) return;

  // Check if participant predicted this team as winner/loser in the SAME slot
  const participantSlot = participantSlots.find(s => s.slotId === slotId);
  let participantTeam = participantSlot
    ? (which === 'winner' ? participantSlot.winnerTeamId : participantSlot.loserTeamId)
    : null;

  // If not found by slot winner, check if the team appears in the final/3rd at all
  if (!participantTeam) {
    // For Campeón: check if officialTeam is the winner of ANY final slot
    // For Subcampeón: check if officialTeam is the loser of ANY final slot
    // For Tercer lugar: check if officialTeam is the winner of ANY 3rd place slot
    const relevantRound = slotId.startsWith('F') ? 'FINAL' : 'THIRD';
    for (const ps of participantSlots) {
      if (ps.round !== relevantRound) continue;
      const teamInSlot = which === 'winner' ? ps.winnerTeamId : ps.loserTeamId;
      if (teamInSlot === officialTeam) {
        participantTeam = teamInSlot;
        break;
      }
    }
  }

  // Also check: did the participant predict this team in the final/3rd as home or away?
  // (even if winnerTeamId is not set)
  if (!participantTeam) {
    const relevantRound = slotId.startsWith('F') ? 'FINAL' : 'THIRD';
    for (const ps of participantSlots) {
      if (ps.round !== relevantRound) continue;
      if (ps.homeTeamId === officialTeam || ps.awayTeamId === officialTeam) {
        // Team is in the final/3rd — check if participant's prediction makes them winner/loser
        if (which === 'winner' && ps.winnerTeamId === officialTeam) {
          participantTeam = officialTeam;
        } else if (which === 'loser' && ps.loserTeamId === officialTeam) {
          participantTeam = officialTeam;
        }
        break;
      }
    }
  }

  const matched = participantTeam === officialTeam;
  scores.push({
    conceptId, slotId,
    pointsAwarded: matched ? concept.points : 0,
    explanation: matched ? `${label} acertado: ${officialTeam}` : `${label} no acertado`,
  });
}

// ═══════════════════════════════════════════════════════════
// Global Scoring — Concepts 15, 16, 17
// ═══════════════════════════════════════════════════════════

import type { TopScorerPredictionData, TopScorerActual, GolPromedioBanda } from '../types';
import { normalizePlayerName } from '../types';

export function evaluateGlobalConcepts(
  pred: TopScorerPredictionData | null,
  actual: TopScorerActual | null,
  participantGoalAvg: number | null,
  actualGoalAvg: number | null,
  config: ScoringConfig,
): ConceptScore[] {
  const scores: ConceptScore[] = [];

  // Concept 15: Goleador nombre
  const c15 = config.concepts.find(c => c.conceptId === CONCEPT.GOLEADOR_NOMBRE);
  if (c15?.isActive && actual && pred?.playerName) {
    const matched = normalizePlayerName(pred.playerName) === normalizePlayerName(actual.playerName);
    scores.push({
      conceptId: CONCEPT.GOLEADOR_NOMBRE,
      pointsAwarded: matched ? c15.points : 0,
      explanation: matched ? `Goleador acertado: ${actual.playerName}` : `Goleador no acertado`,
    });
  }

  // Concept 16: Goles del goleador
  const c16 = config.concepts.find(c => c.conceptId === CONCEPT.GOLEADOR_GOLES);
  if (c16?.isActive && actual && pred?.goals != null) {
    const matched = pred.goals === actual.goals;
    scores.push({
      conceptId: CONCEPT.GOLEADOR_GOLES,
      pointsAwarded: matched ? c16.points : 0,
      explanation: matched ? `Goles acertados: ${actual.goals}` : `Goles no acertados: pred ${pred.goals}, real ${actual.goals}`,
    });
  }

  // Concept 17: Gol promedio (D4)
  const c17 = config.concepts.find(c => c.conceptId === CONCEPT.GOL_PROMEDIO);
  if (c17?.isActive && actualGoalAvg != null && participantGoalAvg != null && actualGoalAvg > 0) {
    const diffPct = Math.abs(participantGoalAvg - actualGoalAvg) / actualGoalAvg * 100;
    const pointsPct = resolveGolPromedioBanda(diffPct, config.golPromedioBandas);
    const pts = Math.round(c17.points * pointsPct / 100);
    scores.push({
      conceptId: CONCEPT.GOL_PROMEDIO,
      pointsAwarded: pts,
      explanation: `Gol promedio: pred ${participantGoalAvg.toFixed(2)}, real ${actualGoalAvg.toFixed(2)}, diff ${diffPct.toFixed(1)}% → ${pts} pts`,
    });
  }

  return scores;
}

/** D4: Goal average over completed matches only */
export function calculateGoalAverage(
  predictions: Array<{ homeGoals: number; awayGoals: number }>,
): number | null {
  if (predictions.length === 0) return null;
  const total = predictions.reduce((sum, p) => sum + p.homeGoals + p.awayGoals, 0);
  return total / predictions.length;
}

function resolveGolPromedioBanda(diffPct: number, bandas: GolPromedioBanda[]): number {
  for (const b of [...bandas].sort((a, b) => a.minPct - b.minPct)) {
    if (diffPct >= b.minPct && diffPct < b.maxPct) return b.pointsPct;
  }
  return 0;
}
