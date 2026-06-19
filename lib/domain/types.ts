// ═══════════════════════════════════════════════════════════
// ProPanas 2026 — Domain Types
// Pure interfaces. No runtime dependencies. No framework deps.
// Aligned with schema v4 and PROMPT_FINAL spec.
// ═══════════════════════════════════════════════════════════

// ─── Enums (mirror Prisma but framework-independent) ─────

export type MatchPhase = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'THIRD' | 'FINAL';
export type KnockoutRound = 'R32' | 'R16' | 'QF' | 'SF' | 'THIRD' | 'FINAL';
export type PredictionStatus = 'VALID' | 'INVALIDATED_BY_CASCADE';

// ─── Tournament Structure ────────────────────────────────

export interface TeamData {
  id: string;
  name: string;
  shortName: string;
  isoCode: string;
  groupLetter: string;
  fifaRanking: number;
}

export interface MatchData {
  id: string;
  matchNumber: number;
  phase: MatchPhase;
  groupLetter: string | null;
  slotId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeOrigin: string | null;
  awayOrigin: string | null;
  parentSlot1: string | null;
  parentSlot2: string | null;
}

// ─── Match Results ───────────────────────────────────────

export interface MatchResult {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  homePenalties?: number | null;
  awayPenalties?: number | null;
}

export interface FairPlayData {
  yellows: number;
  doubleYellowReds: number;
  directReds: number;
}

// ─── Group Standings ─────────────────────────────────────

export interface TeamStandingRow {
  teamId: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  fairPlayScore: number;
  tiebreakExplanation: string;
}

export interface GroupStandingResult {
  groupLetter: string;
  positions: TeamStandingRow[];
  hasOverride: boolean;
}

export interface GroupOverridePayload {
  positions: Array<{ teamId: string; position: number }>;
}

// ─── Best Thirds ─────────────────────────────────────────

export interface ThirdPlaceTeam {
  teamId: string;
  groupOrigin: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  fairPlayScore: number;
  rank: number;
  qualified: boolean;
}

export interface BestThirdsResult {
  ranking: ThirdPlaceTeam[];
  combinationKey: string;
  hasOverride: boolean;
}

// ─── Bracket ─────────────────────────────────────────────

export interface BracketSlotData {
  slotId: string;
  round: KnockoutRound;
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerTeamId: string | null;
  loserTeamId: string | null;
}

// ─── Cascade ─────────────────────────────────────────────

export interface CascadeImpact {
  affectedMatchIds: string[];
  affectedSlotIds: string[];
  description: string;
}

// ─── Scoring ─────────────────────────────────────────────

export interface ScoringConceptConfig {
  conceptId: number;
  name: string;
  points: number;
  isActive: boolean;
}

export interface GolPromedioBanda {
  minPct: number;
  maxPct: number;
  pointsPct: number;
}

export interface ScoringConfig {
  concepts: ScoringConceptConfig[];
  knockoutMatchScoringEnabled: boolean;
  penaltiesCountForScore: boolean;
  absoluteGoalDifference: boolean;
  goleadaThreshold: number;
  golPromedioBandas: GolPromedioBanda[];
}

export interface ConceptScore {
  conceptId: number;
  matchId?: string | null;
  slotId?: string | null;
  pointsAwarded: number;
  explanation: string;
}

export interface ScoreBreakdownResult {
  userId: string;
  scores: ConceptScore[];
  totalPoints: number;
  phase1Points: number;
  phase2Points: number;
}

export interface PairingMatchOutput {
  matches: boolean;
  predGoalsByTeam?: Map<string, number>;
  realGoalsByTeam?: Map<string, number>;
  predPenaltiesByTeam?: Map<string, number | null>;
  realPenaltiesByTeam?: Map<string, number | null>;
}

// ─── Ranking ─────────────────────────────────────────────

export interface RankingEntry {
  userId: string;
  totalPoints: number;
  phase1Points: number;
  phase2Points: number;
  position: number;
  conceptTotals: Record<number, number>;
  matchesPredicted: number;
}

// ─── Top Scorer ──────────────────────────────────────────

export interface TopScorerPredictionData {
  playerName: string | null;
  goals: number | null;
}

export interface TopScorerActual {
  playerName: string;
  goals: number;
}

// ─── Prediction Input ────────────────────────────────────

export interface PredictionInput {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  homePenalties?: number | null;
  awayPenalties?: number | null;
}

// ─── Recalculation ───────────────────────────────────────

export interface RecalcScope {
  groups: string[];
  bestThirds: boolean;
  bracketSlots: string[];
  scoringAll: boolean;
  conceptIds: number[];
}

// ─── Concept IDs (stable constants) ──────────────────────

export const CONCEPT = {
  RESULTADO_ACERTADO: 1,
  MARCADOR_ACERTADO: 2,
  GOLES_POR_EQUIPO: 3,
  DIFERENCIA_GOLES: 4,
  CLASIFICACION_SEGUNDA_FASE: 5,
  POSICION_CORRECTA: 6,
  AVANZA_R16: 7,
  AVANZA_QF: 8,
  AVANZA_SF: 9,
  AVANZA_FINAL: 10,
  TERCER_LUGAR: 11,
  SUBCAMPEON: 12,
  CAMPEON: 13,
  GOLEADA_ESCANDALOSA: 14,
  GOLEADOR_NOMBRE: 15,
  GOLEADOR_GOLES: 16,
  GOL_PROMEDIO: 17,
} as const;

export const DEFAULT_GOL_PROMEDIO_BANDAS: GolPromedioBanda[] = [
  { minPct: 0, maxPct: 5, pointsPct: 100 },
  { minPct: 5, maxPct: 10, pointsPct: 75 },
  { minPct: 10, maxPct: 20, pointsPct: 50 },
  { minPct: 20, maxPct: 30, pointsPct: 25 },
];

// ─── Utility Functions ───────────────────────────────────

export function getWinner(r: MatchResult): 'home' | 'away' | 'draw' {
  if (r.homeGoals > r.awayGoals) return 'home';
  if (r.awayGoals > r.homeGoals) return 'away';
  return 'draw';
}

export function getDefinitiveWinner(r: MatchResult): 'home' | 'away' | null {
  const base = getWinner(r);
  if (base !== 'draw') return base;
  if (r.homePenalties != null && r.awayPenalties != null) {
    if (r.homePenalties > r.awayPenalties) return 'home';
    if (r.awayPenalties > r.homePenalties) return 'away';
  }
  return null;
}

export function calculateFairPlayScore(fp: FairPlayData | null | undefined): number {
  if (!fp) return 0;
  return (fp.yellows * 1) + (fp.doubleYellowReds * 3) + (fp.directReds * 4);
}

export function normalizePlayerName(name: string): string {
  return name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}
