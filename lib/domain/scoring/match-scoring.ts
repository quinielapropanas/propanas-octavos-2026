// ═══════════════════════════════════════════════════════════
// Match Scoring — Concepts 1, 2, 3, 4, 14
// ═══════════════════════════════════════════════════════════

import type { ConceptScore, ScoringConfig } from '../types';
import { CONCEPT } from '../types';
import { shouldSkipConcepts3and4 } from './pairing-matcher';

interface MatchScoringInput {
  predGoalsByTeam: Map<string, number>;
  realGoalsByTeam: Map<string, number>;
  teamIds: [string, string];
  predPenaltiesByTeam?: Map<string, number | null>;
  realPenaltiesByTeam?: Map<string, number | null>;
}

export function evaluateMatchConcepts(
  input: MatchScoringInput,
  config: ScoringConfig,
  matchId: string,
): ConceptScore[] {
  const scores: ConceptScore[] = [];
  const [teamA, teamB] = input.teamIds;
  const predA = input.predGoalsByTeam.get(teamA) ?? 0;
  const predB = input.predGoalsByTeam.get(teamB) ?? 0;
  const realA = input.realGoalsByTeam.get(teamA) ?? 0;
  const realB = input.realGoalsByTeam.get(teamB) ?? 0;

  const predDir = predA > predB ? 'A' : predA < predB ? 'B' : 'draw';
  const realDir = realA > realB ? 'A' : realA < realB ? 'B' : 'draw';

  const getConcept = (id: number) => config.concepts.find(c => c.conceptId === id);

  // Concept 1: Resultado
  const c1 = getConcept(CONCEPT.RESULTADO_ACERTADO);
  if (c1?.isActive) {
    const matched = predDir === realDir;
    scores.push({
      conceptId: CONCEPT.RESULTADO_ACERTADO, matchId,
      pointsAwarded: matched ? c1.points : 0,
      explanation: matched
        ? `Resultado acertado (${realDir === 'draw' ? 'empate' : realDir === 'A' ? teamA : teamB} gana)`
        : `Resultado no acertado`,
    });
  }

  // Concept 2: Marcador exacto
  const c2 = getConcept(CONCEPT.MARCADOR_ACERTADO);
  let concept2Scored = false;
  if (c2?.isActive) {
    let matched = predA === realA && predB === realB;
    if (config.penaltiesCountForScore && !matched) {
      const predPenA = input.predPenaltiesByTeam?.get(teamA) ?? 0;
      const predPenB = input.predPenaltiesByTeam?.get(teamB) ?? 0;
      const realPenA = input.realPenaltiesByTeam?.get(teamA) ?? 0;
      const realPenB = input.realPenaltiesByTeam?.get(teamB) ?? 0;
      matched = (predA + (predPenA || 0)) === (realA + (realPenA || 0)) &&
                (predB + (predPenB || 0)) === (realB + (realPenB || 0));
    }
    concept2Scored = matched;
    scores.push({
      conceptId: CONCEPT.MARCADOR_ACERTADO, matchId,
      pointsAwarded: matched ? c2.points : 0,
      explanation: matched ? `Marcador exacto: ${predA}-${predB}` : `Marcador no exacto`,
    });
  }

  const skipC3C4 = shouldSkipConcepts3and4(config.concepts, concept2Scored);

  // Concept 3: Goles por equipo
  const c3 = getConcept(CONCEPT.GOLES_POR_EQUIPO);
  if (c3?.isActive && !skipC3C4) {
    const matchedA = predA === realA;
    const matchedB = predB === realB;
    scores.push({
      conceptId: CONCEPT.GOLES_POR_EQUIPO, matchId,
      pointsAwarded: (matchedA || matchedB) ? c3.points : 0,
      explanation: (matchedA || matchedB) ? `Goles acertados de ${matchedA ? teamA : teamB}` : `Goles no acertados`,
    });
  }

 // Concept 4: Diferencia (solo si acertó el resultado/ganador)
  const c4 = getConcept(CONCEPT.DIFERENCIA_GOLES);
  if (c4?.isActive && !skipC3C4) {
    const resultadoAcertado = predDir === realDir;
    const predDiff = predA - predB;
    const realDiff = realA - realB;
    const diffMatched = config.absoluteGoalDifference
      ? Math.abs(predDiff) === Math.abs(realDiff) : predDiff === realDiff;
    const matched = resultadoAcertado && diffMatched;
    scores.push({
      conceptId: CONCEPT.DIFERENCIA_GOLES, matchId,
      pointsAwarded: matched ? c4.points : 0,
      explanation: matched
        ? `Diferencia acertada: ${Math.abs(realDiff)}`
        : !resultadoAcertado
          ? `No se otorga diferencia sin acertar resultado`
          : `Diferencia no acertada`,
    });
  }

  // Concept 14: Goleada
  const c14 = getConcept(CONCEPT.GOLEADA_ESCANDALOSA);
  if (c14?.isActive) {
    const realDiff = Math.abs(realA - realB);
    const predDiff = Math.abs(predA - predB);
    const matched = realDiff > config.goleadaThreshold && predDiff > config.goleadaThreshold;
    scores.push({
      conceptId: CONCEPT.GOLEADA_ESCANDALOSA, matchId,
      pointsAwarded: matched ? c14.points : 0,
      explanation: matched ? `Goleada acertada (dif ${realDiff})` : `Sin goleada o no pronosticada`,
    });
  }

  return scores;
}
