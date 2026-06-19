// ═══════════════════════════════════════════════════════════
// Test Fixtures — Comprehensive sample data
// ═══════════════════════════════════════════════════════════

import type { TeamData, MatchData, MatchResult, ScoringConfig, PredictionInput, BracketSlotData } from '../types';
import { DEFAULT_GOL_PROMEDIO_BANDAS } from '../types';

// ─── Teams ───────────────────────────────────────────────

export const TEAMS_A: TeamData[] = [
  { id: 'mex', name: 'México', shortName: 'MEX', isoCode: 'MEX', groupLetter: 'A', fifaRanking: 15 },
  { id: 'rsa', name: 'Sudáfrica', shortName: 'RSA', isoCode: 'ZAF', groupLetter: 'A', fifaRanking: 62 },
  { id: 'kor', name: 'Rep. de Corea', shortName: 'KOR', isoCode: 'KOR', groupLetter: 'A', fifaRanking: 25 },
  { id: 'cze', name: 'Rep. Checa', shortName: 'CZE', isoCode: 'CZE', groupLetter: 'A', fifaRanking: 38 },
];

export const TEAMS_B: TeamData[] = [
  { id: 'can', name: 'Canadá', shortName: 'CAN', isoCode: 'CAN', groupLetter: 'B', fifaRanking: 39 },
  { id: 'bih', name: 'Bosnia', shortName: 'BIH', isoCode: 'BIH', groupLetter: 'B', fifaRanking: 56 },
  { id: 'qat', name: 'Catar', shortName: 'QAT', isoCode: 'QAT', groupLetter: 'B', fifaRanking: 45 },
  { id: 'sui', name: 'Suiza', shortName: 'SUI', isoCode: 'CHE', groupLetter: 'B', fifaRanking: 17 },
];

export const ALL_TEST_TEAMS = [...TEAMS_A, ...TEAMS_B];

// ─── Matches (Group A) ──────────────────────────────────

export const MATCHES_A: MatchData[] = [
  { id: 'm1', matchNumber: 1, phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-01', homeTeamId: 'mex', awayTeamId: 'rsa', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null },
  { id: 'm2', matchNumber: 2, phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-02', homeTeamId: 'kor', awayTeamId: 'cze', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null },
  { id: 'm3', matchNumber: 13, phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-03', homeTeamId: 'mex', awayTeamId: 'kor', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null },
  { id: 'm4', matchNumber: 14, phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-04', homeTeamId: 'cze', awayTeamId: 'rsa', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null },
  { id: 'm5', matchNumber: 49, phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-05', homeTeamId: 'kor', awayTeamId: 'mex', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null },
  { id: 'm6', matchNumber: 50, phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-06', homeTeamId: 'rsa', awayTeamId: 'cze', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null },
];

// ─── Results: Clear winner (MEX 9pts, KOR 4, RSA 3, CZE 1) ──

export const RESULTS_CLEAR: Map<string, MatchResult> = new Map([
  ['m1', { matchId: 'm1', homeGoals: 2, awayGoals: 0 }],  // MEX 2-0 RSA
  ['m2', { matchId: 'm2', homeGoals: 1, awayGoals: 1 }],  // KOR 1-1 CZE
  ['m3', { matchId: 'm3', homeGoals: 3, awayGoals: 1 }],  // MEX 3-1 KOR
  ['m4', { matchId: 'm4', homeGoals: 0, awayGoals: 1 }],  // CZE 0-1 RSA
  ['m5', { matchId: 'm5', homeGoals: 0, awayGoals: 2 }],  // KOR 0-2 MEX
  ['m6', { matchId: 'm6', homeGoals: 0, awayGoals: 2 }],  // RSA 0-2 KOR
]);

// ─── Results: Three-way tie (MEX 3, KOR 6, CZE 6, RSA 3) ──

export const RESULTS_TIE: Map<string, MatchResult> = new Map([
  ['m1', { matchId: 'm1', homeGoals: 1, awayGoals: 0 }],  // MEX 1-0 RSA
  ['m2', { matchId: 'm2', homeGoals: 2, awayGoals: 0 }],  // KOR 2-0 CZE
  ['m3', { matchId: 'm3', homeGoals: 0, awayGoals: 1 }],  // MEX 0-1 KOR
  ['m4', { matchId: 'm4', homeGoals: 2, awayGoals: 1 }],  // CZE 2-1 RSA
  ['m5', { matchId: 'm5', homeGoals: 1, awayGoals: 0 }],  // KOR 1-0 MEX → KOR beats MEX in h2h
  ['m6', { matchId: 'm6', homeGoals: 2, awayGoals: 1 }],  // RSA 2-1 CZE → CZE loses to RSA
]);

// ─── Predictions ─────────────────────────────────────────

export const PREDICTIONS_1: Map<string, PredictionInput> = new Map([
  ['m1', { matchId: 'm1', homeGoals: 2, awayGoals: 0 }],  // exact!
  ['m2', { matchId: 'm2', homeGoals: 2, awayGoals: 1 }],  // result correct, not exact
  ['m3', { matchId: 'm3', homeGoals: 1, awayGoals: 0 }],  // result correct, diff correct
  ['m4', { matchId: 'm4', homeGoals: 1, awayGoals: 2 }],  // wrong result
  ['m5', { matchId: 'm5', homeGoals: 1, awayGoals: 3 }],  // result correct
  ['m6', { matchId: 'm6', homeGoals: 1, awayGoals: 3 }],  // result correct
]);

// ─── Scoring Configs ─────────────────────────────────────

export const DEFAULT_CONFIG: ScoringConfig = {
  concepts: [
    { conceptId: 1, name: 'Resultado', points: 10, isActive: true },
    { conceptId: 2, name: 'Marcador', points: 10, isActive: false },
    { conceptId: 3, name: 'Goles', points: 3, isActive: true },
    { conceptId: 4, name: 'Diferencia', points: 4, isActive: true },
    { conceptId: 5, name: 'Clasificación', points: 15, isActive: true },
    { conceptId: 6, name: 'Posición', points: 5, isActive: true },
    { conceptId: 7, name: 'R16', points: 15, isActive: true },
    { conceptId: 8, name: 'QF', points: 15, isActive: true },
    { conceptId: 9, name: 'SF', points: 15, isActive: true },
    { conceptId: 10, name: 'Final', points: 20, isActive: true },
    { conceptId: 11, name: '3er', points: 20, isActive: true },
    { conceptId: 12, name: 'Sub', points: 20, isActive: true },
    { conceptId: 13, name: 'Campeón', points: 40, isActive: true },
    { conceptId: 14, name: 'Goleada', points: 5, isActive: false },
    { conceptId: 15, name: 'Goleador', points: 10, isActive: true },
    { conceptId: 16, name: 'GolesGoleador', points: 10, isActive: true },
    { conceptId: 17, name: 'GolPm', points: 20, isActive: true },
  ],
  knockoutMatchScoringEnabled: false,
  penaltiesCountForScore: false,
  absoluteGoalDifference: true,
  goleadaThreshold: 4,
  golPromedioBandas: DEFAULT_GOL_PROMEDIO_BANDAS,
};

export const CONFIG_WITH_MARCADOR: ScoringConfig = {
  ...DEFAULT_CONFIG,
  concepts: DEFAULT_CONFIG.concepts.map(c =>
    c.conceptId === 2 ? { ...c, isActive: true } :
    c.conceptId === 3 || c.conceptId === 4 ? { ...c, isActive: false } : c
  ),
};

export const CONFIG_KNOCKOUT: ScoringConfig = {
  ...DEFAULT_CONFIG,
  knockoutMatchScoringEnabled: true,
};

// ─── Bracket Slots ───────────────────────────────────────

export const OFFICIAL_SLOTS: BracketSlotData[] = [
  { slotId: 'QF-01', round: 'QF', homeTeamId: 'arg', awayTeamId: 'bra', winnerTeamId: 'arg', loserTeamId: 'bra' },
  { slotId: 'F-01', round: 'FINAL', homeTeamId: 'arg', awayTeamId: 'fra', winnerTeamId: 'fra', loserTeamId: 'arg' },
  { slotId: '3RD-01', round: 'THIRD', homeTeamId: 'ger', awayTeamId: 'bra', winnerTeamId: 'ger', loserTeamId: 'bra' },
];

export const PARTICIPANT_SLOTS: BracketSlotData[] = [
  { slotId: 'QF-01', round: 'QF', homeTeamId: 'arg', awayTeamId: 'ger', winnerTeamId: 'arg', loserTeamId: 'ger' },
  { slotId: 'F-01', round: 'FINAL', homeTeamId: 'arg', awayTeamId: 'fra', winnerTeamId: 'arg', loserTeamId: 'fra' },
  { slotId: '3RD-01', round: 'THIRD', homeTeamId: 'ger', awayTeamId: 'bra', winnerTeamId: 'ger', loserTeamId: 'bra' },
];
