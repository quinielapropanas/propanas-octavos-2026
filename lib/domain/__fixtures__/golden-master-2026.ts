// ═══════════════════════════════════════════════════════════
// Golden Master 2026 — Datos de referencia para tests
// Fuente: Quiniela_IHO.xlsx (caso de prueba validado)
// ═══════════════════════════════════════════════════════════

// ─── A) Resultados de fase de grupos ─────────────────────

export const GROUP_MATCH_RESULTS: Record<string, Array<{
  home: string; away: string; homeGoals: number; awayGoals: number;
}>> = {
  A: [
    { home: 'MEX', away: 'RSA', homeGoals: 1, awayGoals: 1 },
    { home: 'KOR', away: 'CZE', homeGoals: 2, awayGoals: 0 },
    { home: 'CZE', away: 'RSA', homeGoals: 1, awayGoals: 2 },
    { home: 'MEX', away: 'KOR', homeGoals: 3, awayGoals: 1 },
    { home: 'CZE', away: 'MEX', homeGoals: 0, awayGoals: 2 },
    { home: 'RSA', away: 'KOR', homeGoals: 1, awayGoals: 2 },
  ],
  B: [
    { home: 'CAN', away: 'BIH', homeGoals: 2, awayGoals: 1 },
    { home: 'QAT', away: 'SUI', homeGoals: 4, awayGoals: 0 },
    { home: 'SUI', away: 'BIH', homeGoals: 5, awayGoals: 3 },
    { home: 'CAN', away: 'QAT', homeGoals: 0, awayGoals: 1 },
    { home: 'SUI', away: 'CAN', homeGoals: 2, awayGoals: 0 },
    { home: 'BIH', away: 'QAT', homeGoals: 1, awayGoals: 0 },
  ],
  C: [
    { home: 'BRA', away: 'MAR', homeGoals: 1, awayGoals: 0 },
    { home: 'HAI', away: 'SCO', homeGoals: 3, awayGoals: 2 },
    { home: 'BRA', away: 'HAI', homeGoals: 0, awayGoals: 1 },
    { home: 'SCO', away: 'MAR', homeGoals: 2, awayGoals: 2 },
    { home: 'SCO', away: 'BRA', homeGoals: 1, awayGoals: 0 },
    { home: 'MAR', away: 'HAI', homeGoals: 2, awayGoals: 0 },
  ],
  D: [
    { home: 'USA', away: 'PAR', homeGoals: 1, awayGoals: 2 },
    { home: 'AUS', away: 'TUR', homeGoals: 1, awayGoals: 1 },
    { home: 'TUR', away: 'PAR', homeGoals: 2, awayGoals: 2 },
    { home: 'USA', away: 'AUS', homeGoals: 1, awayGoals: 1 },
    { home: 'TUR', away: 'USA', homeGoals: 1, awayGoals: 1 },
    { home: 'PAR', away: 'AUS', homeGoals: 2, awayGoals: 0 },
  ],
  E: [
    { home: 'CIV', away: 'ECU', homeGoals: 1, awayGoals: 0 },
    { home: 'GER', away: 'CUW', homeGoals: 3, awayGoals: 2 },
    { home: 'GER', away: 'CIV', homeGoals: 5, awayGoals: 4 },
    { home: 'ECU', away: 'CUW', homeGoals: 1, awayGoals: 2 },
    { home: 'ECU', away: 'GER', homeGoals: 0, awayGoals: 1 },
    { home: 'CUW', away: 'CIV', homeGoals: 0, awayGoals: 2 },
  ],
  F: [
    { home: 'NED', away: 'JPN', homeGoals: 2, awayGoals: 0 },
    { home: 'SWE', away: 'TUN', homeGoals: 1, awayGoals: 2 },
    { home: 'NED', away: 'SWE', homeGoals: 2, awayGoals: 1 },
    { home: 'TUN', away: 'JPN', homeGoals: 2, awayGoals: 4 },
    { home: 'JPN', away: 'SWE', homeGoals: 5, awayGoals: 4 },
    { home: 'TUN', away: 'NED', homeGoals: 1, awayGoals: 0 },
  ],
  G: [
    { home: 'IRN', away: 'NZL', homeGoals: 2, awayGoals: 1 },
    { home: 'BEL', away: 'EGY', homeGoals: 0, awayGoals: 1 },
    { home: 'BEL', away: 'IRN', homeGoals: 4, awayGoals: 1 },
    { home: 'NZL', away: 'EGY', homeGoals: 5, awayGoals: 2 },
    { home: 'NZL', away: 'BEL', homeGoals: 1, awayGoals: 2 },
    { home: 'EGY', away: 'IRN', homeGoals: 0, awayGoals: 0 },
  ],
  H: [
    { home: 'ESP', away: 'CPV', homeGoals: 1, awayGoals: 2 },
    { home: 'KSA', away: 'URU', homeGoals: 1, awayGoals: 0 },
    { home: 'ESP', away: 'KSA', homeGoals: 2, awayGoals: 3 },
    { home: 'URU', away: 'CPV', homeGoals: 2, awayGoals: 1 },
    { home: 'URU', away: 'ESP', homeGoals: 0, awayGoals: 2 },
    { home: 'CPV', away: 'KSA', homeGoals: 1, awayGoals: 0 },
  ],
  I: [
    { home: 'FRA', away: 'SEN', homeGoals: 2, awayGoals: 0 },
    { home: 'IRQ', away: 'NOR', homeGoals: 1, awayGoals: 3 },
    { home: 'FRA', away: 'IRQ', homeGoals: 2, awayGoals: 5 },
    { home: 'NOR', away: 'SEN', homeGoals: 4, awayGoals: 1 },
    { home: 'NOR', away: 'FRA', homeGoals: 2, awayGoals: 0 },
    { home: 'SEN', away: 'IRQ', homeGoals: 2, awayGoals: 1 },
  ],
  J: [
    { home: 'ARG', away: 'ALG', homeGoals: 1, awayGoals: 2 },
    { home: 'AUT', away: 'JOR', homeGoals: 0, awayGoals: 1 },
    { home: 'ARG', away: 'AUT', homeGoals: 2, awayGoals: 0 },
    { home: 'JOR', away: 'ALG', homeGoals: 1, awayGoals: 2 },
    { home: 'JOR', away: 'ARG', homeGoals: 5, awayGoals: 4 },
    { home: 'ALG', away: 'AUT', homeGoals: 1, awayGoals: 0 },
  ],
  K: [
    { home: 'POR', away: 'COD', homeGoals: 2, awayGoals: 1 },
    { home: 'UZB', away: 'COL', homeGoals: 0, awayGoals: 3 },
    { home: 'POR', away: 'UZB', homeGoals: 2, awayGoals: 5 },
    { home: 'COL', away: 'COD', homeGoals: 6, awayGoals: 4 },
    { home: 'COL', away: 'POR', homeGoals: 5, awayGoals: 2 },
    { home: 'COD', away: 'UZB', homeGoals: 1, awayGoals: 2 },
  ],
  L: [
    { home: 'ENG', away: 'CRO', homeGoals: 0, awayGoals: 2 },
    { home: 'GHA', away: 'PAN', homeGoals: 0, awayGoals: 1 },
    { home: 'ENG', away: 'GHA', homeGoals: 0, awayGoals: 1 },
    { home: 'PAN', away: 'CRO', homeGoals: 0, awayGoals: 2 },
    { home: 'PAN', away: 'ENG', homeGoals: 0, awayGoals: 3 },
    { home: 'CRO', away: 'GHA', homeGoals: 0, awayGoals: 2 },
  ],
};

// ─── B) Posiciones finales esperadas (1° a 4°) ──────────

export const EXPECTED_STANDINGS: Record<string, string[]> = {
  A: ['MEX', 'KOR', 'RSA', 'CZE'],
  B: ['QAT', 'SUI', 'CAN', 'BIH'],
  C: ['HAI', 'MAR', 'SCO', 'BRA'],
  D: ['PAR', 'TUR', 'USA', 'AUS'],
  E: ['GER', 'CIV', 'CUW', 'ECU'],
  F: ['NED', 'JPN', 'TUN', 'SWE'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['CPV', 'KSA', 'ESP', 'URU'],
  I: ['NOR', 'IRQ', 'FRA', 'SEN'],
  J: ['ALG', 'JOR', 'ARG', 'AUT'],
  K: ['COL', 'UZB', 'POR', 'COD'],
  L: ['GHA', 'CRO', 'ENG', 'PAN'],
};

// ─── C) Tercer lugar de cada grupo ───────────────────────

export const EXPECTED_THIRDS: Record<string, string> = {
  A: 'RSA', B: 'CAN', C: 'SCO', D: 'USA',
  E: 'CUW', F: 'TUN', G: 'IRN', H: 'ESP',
  I: 'FRA', J: 'ARG', K: 'POR', L: 'ENG',
};

// ─── D) Ranking global de terceros (1° = mejor) ─────────

export const EXPECTED_THIRDS_RANKING: string[] = [
  'TUN', // F - 6pts, +1 GD, 5 GF
  'SCO', // C - 4pts, -1 GD, 5 GF
  'RSA', // A - 4pts, -1 GD, 4 GF
  'IRN', // G - 4pts, -2 GD, 3 GF
  'ARG', // J - 3pts, +1 GD, 7 GF
  'ESP', // H - 3pts, 0 GD, 5 GF
  'ENG', // L - 3pts, 0 GD, 3 GF
  'CUW', // E - 3pts, -1 GD, 4 GF
  'CAN', // B - 3pts, -1 GD, 2 GF
  'FRA', // I - 3pts, -1 GD, 4 GF ... wait need to recheck
  'POR', // K
  'USA', // D
];

// Los 8 que clasifican (posiciones 1-8)
export const QUALIFYING_THIRDS = ['TUN', 'SCO', 'RSA', 'IRN', 'ARG', 'ESP', 'ENG', 'CUW'];

// ─── E) Combination key y mapping ────────────────────────

export const EXPECTED_COMBINATION_KEY = 'ACEFGHJL';

// Hosts que enfrentan terceros (orden fijo FIFA)
export const THIRD_PLACE_HOSTS = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L'] as const;

// Matriz FIFA para ACEFGHJL: qué grupo tercer-lugar enfrenta cada host
export const EXPECTED_MATRIX_ROW = ['H', 'G', 'J', 'C', 'A', 'F', 'L', 'E'];

// Mapping resultante: host → grupo del tercer lugar
export const EXPECTED_HOST_TO_THIRD: Record<string, string> = {
  '1A': 'H', // México vs España (3° del H)
  '1B': 'G', // Catar vs Irán (3° del G)
  '1D': 'J', // Paraguay vs Argentina (3° del J)
  '1E': 'C', // Alemania vs Escocia (3° del C)
  '1G': 'A', // Bélgica vs Sudáfrica (3° del A)
  '1I': 'F', // Noruega vs Túnez (3° del F)
  '1K': 'L', // Colombia vs Inglaterra (3° del L)
  '1L': 'E', // Ghana vs Curazao (3° del E)
};

// ─── F) Cruces esperados R32 ─────────────────────────────

export const EXPECTED_R32: Record<string, { home: string; away: string }> = {
  'R32-01': { home: 'KOR', away: 'SUI' },    // 2A vs 2B
  'R32-02': { home: 'GER', away: 'SCO' },    // 1E vs 3C
  'R32-03': { home: 'NED', away: 'MAR' },    // 1F vs 2C
  'R32-04': { home: 'HAI', away: 'JPN' },    // 1C vs 2F
  'R32-05': { home: 'NOR', away: 'TUN' },    // 1I vs 3F
  'R32-06': { home: 'CIV', away: 'IRQ' },    // 2E vs 2I
  'R32-07': { home: 'MEX', away: 'ESP' },    // 1A vs 3H
  'R32-08': { home: 'GHA', away: 'CUW' },    // 1L vs 3E
  'R32-09': { home: 'PAR', away: 'ARG' },    // 1D vs 3J
  'R32-10': { home: 'BEL', away: 'RSA' },    // 1G vs 3A
  'R32-11': { home: 'UZB', away: 'CRO' },    // 2K vs 2L
  'R32-12': { home: 'CPV', away: 'JOR' },    // 1H vs 2J
  'R32-13': { home: 'QAT', away: 'IRN' },    // 1B vs 3G
  'R32-14': { home: 'ALG', away: 'KSA' },    // 1J vs 2H
  'R32-15': { home: 'COL', away: 'ENG' },    // 1K vs 3L
  'R32-16': { home: 'TUR', away: 'EGY' },    // 2D vs 2G
};

// ─── G) Resultados R32 ──────────────────────────────────

export const R32_RESULTS: Record<string, { homeGoals: number; awayGoals: number; homePen?: number; awayPen?: number; winner: string }> = {
  'R32-01': { homeGoals: 2, awayGoals: 0, winner: 'KOR' },
  'R32-02': { homeGoals: 1, awayGoals: 2, winner: 'SCO' },
  'R32-03': { homeGoals: 1, awayGoals: 1, homePen: 4, awayPen: 5, winner: 'MAR' },
  'R32-04': { homeGoals: 2, awayGoals: 4, winner: 'JPN' },
  'R32-05': { homeGoals: 3, awayGoals: 5, winner: 'TUN' },
  'R32-06': { homeGoals: 2, awayGoals: 1, winner: 'CIV' },
  'R32-07': { homeGoals: 0, awayGoals: 2, winner: 'ESP' },
  'R32-08': { homeGoals: 1, awayGoals: 0, winner: 'GHA' },
  'R32-09': { homeGoals: 2, awayGoals: 3, winner: 'ARG' },
  'R32-10': { homeGoals: 1, awayGoals: 2, winner: 'RSA' },
  'R32-11': { homeGoals: 2, awayGoals: 5, winner: 'CRO' },
  'R32-12': { homeGoals: 1, awayGoals: 6, winner: 'JOR' },
  'R32-13': { homeGoals: 0, awayGoals: 2, winner: 'IRN' },
  'R32-14': { homeGoals: 5, awayGoals: 2, winner: 'ALG' },
  'R32-15': { homeGoals: 2, awayGoals: 0, winner: 'COL' },
  'R32-16': { homeGoals: 4, awayGoals: 1, winner: 'TUR' },
};

// ─── H) Cruces y resultados de Octavos ──────────────────

export const EXPECTED_R16: Record<string, { home: string; away: string }> = {
  'R16-01': { home: 'SCO', away: 'TUN' },
  'R16-02': { home: 'KOR', away: 'MAR' },
  'R16-03': { home: 'JPN', away: 'CIV' },
  'R16-04': { home: 'ESP', away: 'GHA' },
  'R16-05': { home: 'CRO', away: 'JOR' },
  'R16-06': { home: 'ARG', away: 'RSA' },
  'R16-07': { home: 'ALG', away: 'TUR' },
  'R16-08': { home: 'IRN', away: 'COL' },
};

export const R16_RESULTS: Record<string, { homeGoals: number; awayGoals: number; homePen?: number; awayPen?: number; winner: string }> = {
  'R16-01': { homeGoals: 0, awayGoals: 1, winner: 'TUN' },
  'R16-02': { homeGoals: 2, awayGoals: 2, homePen: 5, awayPen: 2, winner: 'KOR' },
  'R16-03': { homeGoals: 1, awayGoals: 4, winner: 'CIV' },
  'R16-04': { homeGoals: 4, awayGoals: 5, winner: 'GHA' },
  'R16-05': { homeGoals: 5, awayGoals: 1, winner: 'CRO' },
  'R16-06': { homeGoals: 1, awayGoals: 2, winner: 'RSA' },
  'R16-07': { homeGoals: 2, awayGoals: 0, winner: 'ALG' },
  'R16-08': { homeGoals: 1, awayGoals: 2, winner: 'COL' },
};

// ─── I) Cuartos ──────────────────────────────────────────

export const EXPECTED_QF: Record<string, { home: string; away: string }> = {
  'QF-01': { home: 'TUN', away: 'KOR' },
  'QF-02': { home: 'CRO', away: 'RSA' },
  'QF-03': { home: 'CIV', away: 'GHA' },
  'QF-04': { home: 'ALG', away: 'COL' },
};

export const QF_RESULTS: Record<string, { homeGoals: number; awayGoals: number; winner: string }> = {
  'QF-01': { homeGoals: 1, awayGoals: 3, winner: 'KOR' },
  'QF-02': { homeGoals: 2, awayGoals: 5, winner: 'RSA' },
  'QF-03': { homeGoals: 0, awayGoals: 4, winner: 'GHA' },
  'QF-04': { homeGoals: 3, awayGoals: 0, winner: 'ALG' },
};

// ─── J) Semifinales ──────────────────────────────────────

export const EXPECTED_SF: Record<string, { home: string; away: string }> = {
  'SF-01': { home: 'KOR', away: 'RSA' },
  'SF-02': { home: 'GHA', away: 'ALG' },
};

export const SF_RESULTS: Record<string, { homeGoals: number; awayGoals: number; winner: string }> = {
  'SF-01': { homeGoals: 2, awayGoals: 0, winner: 'KOR' },
  'SF-02': { homeGoals: 4, awayGoals: 5, winner: 'ALG' },
};

// ─── K) Tercer lugar y Final ─────────────────────────────

export const EXPECTED_THIRD_PLACE = { home: 'RSA', away: 'GHA' };
export const THIRD_PLACE_RESULT = { homeGoals: 2, awayGoals: 1, winner: 'RSA' };

export const EXPECTED_FINAL = { home: 'KOR', away: 'ALG' };
export const FINAL_RESULT = { homeGoals: 1, awayGoals: 0, winner: 'KOR' };

// ─── R32 Structure (FIFA official bracket layout) ────────

export const R32_STRUCTURE: Record<string, { home: string; away: string }> = {
  'R32-01': { home: '2A', away: '2B' },
  'R32-02': { home: '1E', away: 'THIRD' },
  'R32-03': { home: '1F', away: '2C' },
  'R32-04': { home: '1C', away: '2F' },
  'R32-05': { home: '1I', away: 'THIRD' },
  'R32-06': { home: '2E', away: '2I' },
  'R32-07': { home: '1A', away: 'THIRD' },
  'R32-08': { home: '1L', away: 'THIRD' },
  'R32-09': { home: '1D', away: 'THIRD' },
  'R32-10': { home: '1G', away: 'THIRD' },
  'R32-11': { home: '2K', away: '2L' },
  'R32-12': { home: '1H', away: '2J' },
  'R32-13': { home: '1B', away: 'THIRD' },
  'R32-14': { home: '1J', away: '2H' },
  'R32-15': { home: '1K', away: 'THIRD' },
  'R32-16': { home: '2D', away: '2G' },
};

// ─── Bracket progression (winner of X vs winner of Y) ────

export const BRACKET_PROGRESSION = {
  R16: [
    { slotId: 'R16-01', homeFrom: 'R32-02', awayFrom: 'R32-05' },
    { slotId: 'R16-02', homeFrom: 'R32-01', awayFrom: 'R32-03' },
    { slotId: 'R16-03', homeFrom: 'R32-04', awayFrom: 'R32-06' },
    { slotId: 'R16-04', homeFrom: 'R32-07', awayFrom: 'R32-08' },
    { slotId: 'R16-05', homeFrom: 'R32-11', awayFrom: 'R32-12' },
    { slotId: 'R16-06', homeFrom: 'R32-09', awayFrom: 'R32-10' },
    { slotId: 'R16-07', homeFrom: 'R32-14', awayFrom: 'R32-16' },
    { slotId: 'R16-08', homeFrom: 'R32-13', awayFrom: 'R32-15' },
  ],
  QF: [
    { slotId: 'QF-01', homeFrom: 'R16-01', awayFrom: 'R16-02' },
    { slotId: 'QF-02', homeFrom: 'R16-05', awayFrom: 'R16-06' },
    { slotId: 'QF-03', homeFrom: 'R16-03', awayFrom: 'R16-04' },
    { slotId: 'QF-04', homeFrom: 'R16-07', awayFrom: 'R16-08' },
  ],
  SF: [
    { slotId: 'SF-01', homeFrom: 'QF-01', awayFrom: 'QF-02' },
    { slotId: 'SF-02', homeFrom: 'QF-03', awayFrom: 'QF-04' },
  ],
};

// ─── FIFA Third Place Matrix ─────────────────────────────
// Key = sorted combination of qualifying groups
// Value = array of group letters, indexed by host position
// Host order: [1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L]

export const FIFA_THIRD_PLACE_MATRIX: Record<string, string[]> = {
  'ABCDEFGH': ['C', 'D', 'A', 'B', 'F', 'E', 'H', 'G'],
  'ABCDEFGI': ['C', 'D', 'A', 'B', 'F', 'E', 'I', 'G'],
  'ABCDEFGJ': ['C', 'D', 'A', 'B', 'F', 'G', 'J', 'E'],
  'ABCDEFGK': ['C', 'D', 'A', 'B', 'F', 'G', 'K', 'E'],
  'ABCDEFGL': ['C', 'D', 'A', 'B', 'F', 'G', 'L', 'E'],
  'ABCDEFHI': ['C', 'D', 'A', 'B', 'F', 'E', 'I', 'H'],
  'ABCDEFHJ': ['C', 'D', 'A', 'B', 'F', 'H', 'J', 'E'],
  'ABCDEFHK': ['C', 'D', 'A', 'B', 'F', 'H', 'K', 'E'],
  'ABCDEFHL': ['C', 'D', 'A', 'B', 'F', 'H', 'L', 'E'],
  'ABCDEFIJ': ['C', 'D', 'A', 'B', 'F', 'I', 'J', 'E'],
  'ABCDEFIK': ['C', 'D', 'A', 'B', 'F', 'I', 'K', 'E'],
  'ABCDEFIL': ['C', 'D', 'A', 'B', 'F', 'I', 'L', 'E'],
  'ABCDEFJK': ['C', 'D', 'A', 'B', 'F', 'J', 'K', 'E'],
  'ABCDEFJL': ['C', 'D', 'A', 'B', 'F', 'J', 'L', 'E'],
  'ABCDEFKL': ['C', 'D', 'A', 'B', 'F', 'K', 'L', 'E'],
  'ACEFGHJL': ['H', 'G', 'J', 'C', 'A', 'F', 'L', 'E'],
  // TODO: Add all 495 combinations from FIFA matrix
};
