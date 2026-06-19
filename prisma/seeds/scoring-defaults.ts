// ═══════════════════════════════════════════════════════════
// Scoring Defaults — 17 concepts + behavior flags
// Source: PRD + PROMPT_FINAL spec section 6.1
// ═══════════════════════════════════════════════════════════

export interface ScoringConceptSeed {
  conceptId: number;
  name: string;
  points: number;
  isActive: boolean;
  description: string;
}

export const SCORING_CONCEPTS: ScoringConceptSeed[] = [
  { conceptId: 1,  name: 'Resultado Acertado',           points: 10, isActive: true,  description: 'Acertar ganador o empate (sin importar marcador exacto)' },
  { conceptId: 2,  name: 'Marcador Acertado',            points: 10, isActive: false, description: 'Acertar goles exactos de ambos equipos. Exclusión mutua con conceptos 3 y 4.' },
  { conceptId: 3,  name: 'Goles Anotados por Equipo',    points: 3,  isActive: true,  description: 'Acertar goles de al menos un equipo. Exclusión mutua con concepto 2.' },
  { conceptId: 4,  name: 'Diferencia de Goles',          points: 4,  isActive: true,  description: 'Acertar la diferencia de goles en el partido. Exclusión mutua con concepto 2.' },
  { conceptId: 5,  name: 'Clasificación a Segunda Fase',  points: 15, isActive: true,  description: 'Acertar que un equipo clasifica a la fase eliminatoria (top 2 del grupo)' },
  { conceptId: 6,  name: 'Posición Correcta en Grupo',   points: 5,  isActive: true,  description: 'Acertar la posición exacta (1°-4°) de un equipo en su grupo' },
  { conceptId: 7,  name: 'Avanza a Octavos (R16)',       points: 15, isActive: true,  description: 'Equipo correcto en el slot correcto de Octavos de Final' },
  { conceptId: 8,  name: 'Avanza a Cuartos de Final',    points: 15, isActive: true,  description: 'Equipo correcto en el slot correcto de Cuartos de Final' },
  { conceptId: 9,  name: 'Avanza a Semifinales',         points: 15, isActive: true,  description: 'Equipo correcto en el slot correcto de Semifinales' },
  { conceptId: 10, name: 'Avanza a la Final',            points: 20, isActive: true,  description: 'Equipo correcto en el slot correcto de la Final' },
  { conceptId: 11, name: 'Tercer Lugar',                 points: 20, isActive: true,  description: 'Acertar el ganador del partido por tercer lugar (3RD-01)' },
  { conceptId: 12, name: 'Subcampeón',                   points: 20, isActive: true,  description: 'Acertar el perdedor de la final (F-01 loser)' },
  { conceptId: 13, name: 'Campeón',                      points: 40, isActive: true,  description: 'Acertar el ganador de la final (F-01 winner)' },
  { conceptId: 14, name: 'Goleada Escandalosa',          points: 5,  isActive: false, description: 'Acertar que hubo goleada con diferencia mayor al umbral configurado' },
  { conceptId: 15, name: 'Goleador del Torneo',          points: 10, isActive: true,  description: 'Acertar el nombre del máximo goleador del torneo' },
  { conceptId: 16, name: 'Goles del Goleador',           points: 10, isActive: true,  description: 'Acertar la cantidad exacta de goles del máximo goleador' },
  { conceptId: 17, name: 'Gol Promedio',                 points: 20, isActive: true,  description: 'Cercanía al promedio real de goles por partido, evaluado por bandas configurables' },
];

export const DEFAULT_BEHAVIOR_FLAGS = {
  knockoutMatchScoringEnabled: false,
  penaltiesCountForScore: false,
  absoluteGoalDifference: true,
  goleadaThreshold: 4,
  golPromedioBandas: [
    { minPct: 0,  maxPct: 5,  pointsPct: 100 },
    { minPct: 5,  maxPct: 10, pointsPct: 75 },
    { minPct: 10, maxPct: 20, pointsPct: 50 },
    { minPct: 20, maxPct: 30, pointsPct: 25 },
  ],
};
