// ═══════════════════════════════════════════════════════════
// Teams Seed — 48 teams, FIFA World Cup 2026
// Source: Official FIFA draw, December 5, 2025
// Rankings: FIFA ranking as of April 2026 (approximate)
// ═══════════════════════════════════════════════════════════

export interface TeamSeed {
  name: string;
  shortName: string;
  isoCode: string;
  groupLetter: string;
  fifaRanking: number;
  flagAssetKey: string;
}

export const TEAMS: TeamSeed[] = [
  // ── Group A (Mexico City, Guadalajara, Monterrey) ──
  { name: 'México',             shortName: 'MEX', isoCode: 'MEX', groupLetter: 'A', fifaRanking: 15, flagAssetKey: 'mx' },
  { name: 'Sudáfrica',          shortName: 'RSA', isoCode: 'ZAF', groupLetter: 'A', fifaRanking: 62, flagAssetKey: 'za' },
  { name: 'Rep. de Corea',      shortName: 'KOR', isoCode: 'KOR', groupLetter: 'A', fifaRanking: 25, flagAssetKey: 'kr' },
  { name: 'Rep. Checa',         shortName: 'CZE', isoCode: 'CZE', groupLetter: 'A', fifaRanking: 38, flagAssetKey: 'cz' },

  // ── Group B (Toronto, Vancouver) ──
  { name: 'Canadá',             shortName: 'CAN', isoCode: 'CAN', groupLetter: 'B', fifaRanking: 39, flagAssetKey: 'ca' },
  { name: 'Bosnia y Herzegovina', shortName: 'BIH', isoCode: 'BIH', groupLetter: 'B', fifaRanking: 56, flagAssetKey: 'ba' },
  { name: 'Catar',              shortName: 'QAT', isoCode: 'QAT', groupLetter: 'B', fifaRanking: 45, flagAssetKey: 'qa' },
  { name: 'Suiza',              shortName: 'SUI', isoCode: 'CHE', groupLetter: 'B', fifaRanking: 17, flagAssetKey: 'ch' },

  // ── Group C (East Rutherford, Boston) ──
  { name: 'Brasil',             shortName: 'BRA', isoCode: 'BRA', groupLetter: 'C', fifaRanking: 5,  flagAssetKey: 'br' },
  { name: 'Marruecos',          shortName: 'MAR', isoCode: 'MAR', groupLetter: 'C', fifaRanking: 13, flagAssetKey: 'ma' },
  { name: 'Haití',              shortName: 'HAI', isoCode: 'HTI', groupLetter: 'C', fifaRanking: 90, flagAssetKey: 'ht' },
  { name: 'Escocia',            shortName: 'SCO', isoCode: 'SCO', groupLetter: 'C', fifaRanking: 48, flagAssetKey: 'gb-sct' },

  // ── Group D (Los Angeles, Seattle) ──
  { name: 'EE. UU.',            shortName: 'USA', isoCode: 'USA', groupLetter: 'D', fifaRanking: 11, flagAssetKey: 'us' },
  { name: 'Paraguay',           shortName: 'PAR', isoCode: 'PRY', groupLetter: 'D', fifaRanking: 52, flagAssetKey: 'py' },
  { name: 'Australia',          shortName: 'AUS', isoCode: 'AUS', groupLetter: 'D', fifaRanking: 24, flagAssetKey: 'au' },
  { name: 'Turquía',            shortName: 'TUR', isoCode: 'TUR', groupLetter: 'D', fifaRanking: 41, flagAssetKey: 'tr' },

  // ── Group E (Houston, Dallas) ──
  { name: 'Costa de Marfil',    shortName: 'CIV', isoCode: 'CIV', groupLetter: 'E', fifaRanking: 42, flagAssetKey: 'ci' },
  { name: 'Ecuador',            shortName: 'ECU', isoCode: 'ECU', groupLetter: 'E', fifaRanking: 30, flagAssetKey: 'ec' },
  { name: 'Alemania',           shortName: 'GER', isoCode: 'DEU', groupLetter: 'E', fifaRanking: 8,  flagAssetKey: 'de' },
  { name: 'Curazao',            shortName: 'CUW', isoCode: 'CUW', groupLetter: 'E', fifaRanking: 115, flagAssetKey: 'cw' },

  // ── Group F (Dallas, Monterrey, Philadelphia) ──
  { name: 'Países Bajos',       shortName: 'NED', isoCode: 'NLD', groupLetter: 'F', fifaRanking: 6,  flagAssetKey: 'nl' },
  { name: 'Japón',              shortName: 'JPN', isoCode: 'JPN', groupLetter: 'F', fifaRanking: 14, flagAssetKey: 'jp' },
  { name: 'Suecia',             shortName: 'SWE', isoCode: 'SWE', groupLetter: 'F', fifaRanking: 47, flagAssetKey: 'se' },
  { name: 'Túnez',              shortName: 'TUN', isoCode: 'TUN', groupLetter: 'F', fifaRanking: 36, flagAssetKey: 'tn' },

  // ── Group G (Seattle, San Francisco) ──
  { name: 'Irán',               shortName: 'IRN', isoCode: 'IRN', groupLetter: 'G', fifaRanking: 22, flagAssetKey: 'ir' },
  { name: 'Nueva Zelanda',      shortName: 'NZL', isoCode: 'NZL', groupLetter: 'G', fifaRanking: 93, flagAssetKey: 'nz' },
  { name: 'Bélgica',            shortName: 'BEL', isoCode: 'BEL', groupLetter: 'G', fifaRanking: 4,  flagAssetKey: 'be' },
  { name: 'Egipto',             shortName: 'EGY', isoCode: 'EGY', groupLetter: 'G', fifaRanking: 33, flagAssetKey: 'eg' },

  // ── Group H (Atlanta, Dallas, Kansas City) ──
  { name: 'España',             shortName: 'ESP', isoCode: 'ESP', groupLetter: 'H', fifaRanking: 1,  flagAssetKey: 'es' },
  { name: 'Cabo Verde',         shortName: 'CPV', isoCode: 'CPV', groupLetter: 'H', fifaRanking: 68, flagAssetKey: 'cv' },
  { name: 'Arabia Saudí',       shortName: 'KSA', isoCode: 'SAU', groupLetter: 'H', fifaRanking: 58, flagAssetKey: 'sa' },
  { name: 'Uruguay',            shortName: 'URU', isoCode: 'URY', groupLetter: 'H', fifaRanking: 10, flagAssetKey: 'uy' },

  // ── Group I (East Rutherford, Philadelphia, Miami) ──
  { name: 'Francia',            shortName: 'FRA', isoCode: 'FRA', groupLetter: 'I', fifaRanking: 2,  flagAssetKey: 'fr' },
  { name: 'Senegal',            shortName: 'SEN', isoCode: 'SEN', groupLetter: 'I', fifaRanking: 21, flagAssetKey: 'sn' },
  { name: 'Irak',               shortName: 'IRQ', isoCode: 'IRQ', groupLetter: 'I', fifaRanking: 64, flagAssetKey: 'iq' },
  { name: 'Noruega',            shortName: 'NOR', isoCode: 'NOR', groupLetter: 'I', fifaRanking: 44, flagAssetKey: 'no' },

  // ── Group J (Miami, Kansas City, Houston) ──
  { name: 'Argentina',          shortName: 'ARG', isoCode: 'ARG', groupLetter: 'J', fifaRanking: 3,  flagAssetKey: 'ar' },
  { name: 'Argelia',            shortName: 'ALG', isoCode: 'DZA', groupLetter: 'J', fifaRanking: 34, flagAssetKey: 'dz' },
  { name: 'Austria',            shortName: 'AUT', isoCode: 'AUT', groupLetter: 'J', fifaRanking: 23, flagAssetKey: 'at' },
  { name: 'Jordania',           shortName: 'JOR', isoCode: 'JOR', groupLetter: 'J', fifaRanking: 72, flagAssetKey: 'jo' },

  // ── Group K (Philadelphia, Atlanta) ──
  { name: 'Portugal',           shortName: 'POR', isoCode: 'PRT', groupLetter: 'K', fifaRanking: 7,  flagAssetKey: 'pt' },
  { name: 'RD Congo',           shortName: 'COD', isoCode: 'COD', groupLetter: 'K', fifaRanking: 55, flagAssetKey: 'cd' },
  { name: 'Colombia',           shortName: 'COL', isoCode: 'COL', groupLetter: 'K', fifaRanking: 12, flagAssetKey: 'co' },
  { name: 'Uzbekistán',         shortName: 'UZB', isoCode: 'UZB', groupLetter: 'K', fifaRanking: 65, flagAssetKey: 'uz' },

  // ── Group L (Dallas, Boston, Toronto) ──
  { name: 'Inglaterra',         shortName: 'ENG', isoCode: 'ENG', groupLetter: 'L', fifaRanking: 9,  flagAssetKey: 'gb-eng' },
  { name: 'Croacia',            shortName: 'CRO', isoCode: 'HRV', groupLetter: 'L', fifaRanking: 16, flagAssetKey: 'hr' },
  { name: 'Panamá',             shortName: 'PAN', isoCode: 'PAN', groupLetter: 'L', fifaRanking: 78, flagAssetKey: 'pa' },
  { name: 'Ghana',              shortName: 'GHA', isoCode: 'GHA', groupLetter: 'L', fifaRanking: 60, flagAssetKey: 'gh' },
];
