// ═══════════════════════════════════════════════════════════
// Matches Seed — 104 matches, FIFA World Cup 2026
// Source: Official FIFA match schedule (Dec 6, 2025 broadcast)
//
// Group matches: homeTeam/awayTeam are shortName references
//   (resolved to team IDs at seed time)
// Knockout matches: homeTeam/awayTeam are null
//   (resolved at runtime by bracket-resolver)
//
// All times in UTC. Dates from official schedule.
// ═══════════════════════════════════════════════════════════

type Phase = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'THIRD' | 'FINAL';

export interface MatchSeed {
  matchNumber: number;
  phase: Phase;
  groupLetter: string | null;
  slotId: string;
  homeTeam: string | null;   // shortName for groups, null for knockout
  awayTeam: string | null;
  homeOrigin: string | null;  // for knockout: "1A","2B","3ABCDF","W89" etc
  awayOrigin: string | null;
  parentSlot1: string | null;
  parentSlot2: string | null;
  scheduledAt: string;        // ISO datetime UTC
  venue: string;
  city: string;
}

// ═══════════════════════════════════════════════════════════
// GROUP STAGE — 72 matches (June 11-27, 2026)
// 6 matches per group, 3 matchdays
// MD3: both matches simultaneous per FIFA rules
// ═══════════════════════════════════════════════════════════

const GROUP_MATCHES: MatchSeed[] = [
  // ── Group A ──
  { matchNumber: 1,  phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-01', homeTeam: 'MEX', awayTeam: 'RSA', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-11T19:00:00Z', venue: 'Estadio Azteca', city: 'Mexico City' },
  { matchNumber: 2,  phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-02', homeTeam: 'KOR', awayTeam: 'CZE', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-12T02:00:00Z', venue: 'Estadio Akron', city: 'Guadalajara' },
  { matchNumber: 13, phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-03', homeTeam: 'MEX', awayTeam: 'KOR', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-16T01:00:00Z', venue: 'Estadio BBVA', city: 'Monterrey' },
  { matchNumber: 14, phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-04', homeTeam: 'CZE', awayTeam: 'RSA', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-18T16:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { matchNumber: 49, phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-05', homeTeam: 'KOR', awayTeam: 'MEX', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-25T22:00:00Z', venue: 'Estadio Akron', city: 'Guadalajara' },
  { matchNumber: 50, phase: 'GROUP', groupLetter: 'A', slotId: 'GRP-A-06', homeTeam: 'RSA', awayTeam: 'CZE', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-25T22:00:00Z', venue: 'Estadio Azteca', city: 'Mexico City' },

  // ── Group B ──
  { matchNumber: 3,  phase: 'GROUP', groupLetter: 'B', slotId: 'GRP-B-01', homeTeam: 'CAN', awayTeam: 'BIH', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-12T19:00:00Z', venue: 'BMO Field', city: 'Toronto' },
  { matchNumber: 5,  phase: 'GROUP', groupLetter: 'B', slotId: 'GRP-B-02', homeTeam: 'QAT', awayTeam: 'SUI', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-13T19:00:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },
  { matchNumber: 17, phase: 'GROUP', groupLetter: 'B', slotId: 'GRP-B-03', homeTeam: 'SUI', awayTeam: 'CAN', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-18T23:00:00Z', venue: 'BC Place', city: 'Vancouver' },
  { matchNumber: 18, phase: 'GROUP', groupLetter: 'B', slotId: 'GRP-B-04', homeTeam: 'BIH', awayTeam: 'QAT', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-19T19:00:00Z', venue: 'BMO Field', city: 'Toronto' },
  { matchNumber: 51, phase: 'GROUP', groupLetter: 'B', slotId: 'GRP-B-05', homeTeam: 'SUI', awayTeam: 'BIH', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-26T00:00:00Z', venue: 'BC Place', city: 'Vancouver' },
  { matchNumber: 52, phase: 'GROUP', groupLetter: 'B', slotId: 'GRP-B-06', homeTeam: 'QAT', awayTeam: 'CAN', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-26T00:00:00Z', venue: 'BMO Field', city: 'Toronto' },

  // ── Group C ──
  { matchNumber: 6,  phase: 'GROUP', groupLetter: 'C', slotId: 'GRP-C-01', homeTeam: 'BRA', awayTeam: 'MAR', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-13T22:00:00Z', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { matchNumber: 7,  phase: 'GROUP', groupLetter: 'C', slotId: 'GRP-C-02', homeTeam: 'HAI', awayTeam: 'SCO', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-14T01:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },
  { matchNumber: 19, phase: 'GROUP', groupLetter: 'C', slotId: 'GRP-C-03', homeTeam: 'MAR', awayTeam: 'HAI', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-20T22:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { matchNumber: 20, phase: 'GROUP', groupLetter: 'C', slotId: 'GRP-C-04', homeTeam: 'SCO', awayTeam: 'BRA', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-20T01:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },
  { matchNumber: 53, phase: 'GROUP', groupLetter: 'C', slotId: 'GRP-C-05', homeTeam: 'MAR', awayTeam: 'SCO', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-26T22:00:00Z', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { matchNumber: 54, phase: 'GROUP', groupLetter: 'C', slotId: 'GRP-C-06', homeTeam: 'BRA', awayTeam: 'HAI', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-26T22:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },

  // ── Group D ──
  { matchNumber: 4,  phase: 'GROUP', groupLetter: 'D', slotId: 'GRP-D-01', homeTeam: 'USA', awayTeam: 'PAR', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-13T01:00:00Z', venue: 'SoFi Stadium', city: 'Los Angeles' },
  { matchNumber: 15, phase: 'GROUP', groupLetter: 'D', slotId: 'GRP-D-02', homeTeam: 'AUS', awayTeam: 'TUR', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-16T19:00:00Z', venue: 'Lumen Field', city: 'Seattle' },
  { matchNumber: 16, phase: 'GROUP', groupLetter: 'D', slotId: 'GRP-D-03', homeTeam: 'USA', awayTeam: 'AUS', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-19T01:00:00Z', venue: 'Lumen Field', city: 'Seattle' },
  { matchNumber: 21, phase: 'GROUP', groupLetter: 'D', slotId: 'GRP-D-04', homeTeam: 'TUR', awayTeam: 'PAR', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-20T19:00:00Z', venue: 'SoFi Stadium', city: 'Los Angeles' },
  { matchNumber: 55, phase: 'GROUP', groupLetter: 'D', slotId: 'GRP-D-05', homeTeam: 'TUR', awayTeam: 'USA', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-25T00:00:00Z', venue: 'SoFi Stadium', city: 'Los Angeles' },
  { matchNumber: 56, phase: 'GROUP', groupLetter: 'D', slotId: 'GRP-D-06', homeTeam: 'PAR', awayTeam: 'AUS', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-25T00:00:00Z', venue: 'Lumen Field', city: 'Seattle' },

  // ── Group E ──
  { matchNumber: 8,  phase: 'GROUP', groupLetter: 'E', slotId: 'GRP-E-01', homeTeam: 'CIV', awayTeam: 'ECU', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-14T16:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { matchNumber: 10, phase: 'GROUP', groupLetter: 'E', slotId: 'GRP-E-02', homeTeam: 'GER', awayTeam: 'CUW', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-14T17:00:00Z', venue: 'NRG Stadium', city: 'Houston' },
  { matchNumber: 22, phase: 'GROUP', groupLetter: 'E', slotId: 'GRP-E-03', homeTeam: 'ECU', awayTeam: 'GER', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-19T22:00:00Z', venue: 'NRG Stadium', city: 'Houston' },
  { matchNumber: 23, phase: 'GROUP', groupLetter: 'E', slotId: 'GRP-E-04', homeTeam: 'CUW', awayTeam: 'CIV', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-20T16:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { matchNumber: 57, phase: 'GROUP', groupLetter: 'E', slotId: 'GRP-E-05', homeTeam: 'GER', awayTeam: 'CIV', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-26T16:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { matchNumber: 58, phase: 'GROUP', groupLetter: 'E', slotId: 'GRP-E-06', homeTeam: 'ECU', awayTeam: 'CUW', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-26T16:00:00Z', venue: 'NRG Stadium', city: 'Houston' },

  // ── Group F ──
  { matchNumber: 9,  phase: 'GROUP', groupLetter: 'F', slotId: 'GRP-F-01', homeTeam: 'NED', awayTeam: 'JPN', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-14T22:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { matchNumber: 11, phase: 'GROUP', groupLetter: 'F', slotId: 'GRP-F-02', homeTeam: 'SWE', awayTeam: 'TUN', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-15T19:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { matchNumber: 24, phase: 'GROUP', groupLetter: 'F', slotId: 'GRP-F-03', homeTeam: 'TUN', awayTeam: 'JPN', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-21T02:00:00Z', venue: 'Estadio BBVA', city: 'Monterrey' },
  { matchNumber: 25, phase: 'GROUP', groupLetter: 'F', slotId: 'GRP-F-04', homeTeam: 'NED', awayTeam: 'SWE', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-21T19:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { matchNumber: 59, phase: 'GROUP', groupLetter: 'F', slotId: 'GRP-F-05', homeTeam: 'JPN', awayTeam: 'SWE', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-27T16:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { matchNumber: 60, phase: 'GROUP', groupLetter: 'F', slotId: 'GRP-F-06', homeTeam: 'TUN', awayTeam: 'NED', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-27T16:00:00Z', venue: 'Estadio BBVA', city: 'Monterrey' },

  // ── Group G ──
  { matchNumber: 12, phase: 'GROUP', groupLetter: 'G', slotId: 'GRP-G-01', homeTeam: 'BEL', awayTeam: 'EGY', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-15T22:00:00Z', venue: 'Lumen Field', city: 'Seattle' },
  { matchNumber: 26, phase: 'GROUP', groupLetter: 'G', slotId: 'GRP-G-02', homeTeam: 'IRN', awayTeam: 'NZL', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-16T22:00:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },
  { matchNumber: 27, phase: 'GROUP', groupLetter: 'G', slotId: 'GRP-G-03', homeTeam: 'EGY', awayTeam: 'IRN', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-21T22:00:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },
  { matchNumber: 28, phase: 'GROUP', groupLetter: 'G', slotId: 'GRP-G-04', homeTeam: 'NZL', awayTeam: 'BEL', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-22T01:00:00Z', venue: 'Lumen Field', city: 'Seattle' },
  { matchNumber: 61, phase: 'GROUP', groupLetter: 'G', slotId: 'GRP-G-05', homeTeam: 'BEL', awayTeam: 'IRN', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-27T19:00:00Z', venue: 'Lumen Field', city: 'Seattle' },
  { matchNumber: 62, phase: 'GROUP', groupLetter: 'G', slotId: 'GRP-G-06', homeTeam: 'NZL', awayTeam: 'EGY', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-27T19:00:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },

  // ── Group H ──
  { matchNumber: 29, phase: 'GROUP', groupLetter: 'H', slotId: 'GRP-H-01', homeTeam: 'ESP', awayTeam: 'CPV', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-15T16:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { matchNumber: 30, phase: 'GROUP', groupLetter: 'H', slotId: 'GRP-H-02', homeTeam: 'KSA', awayTeam: 'URU', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-17T22:00:00Z', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { matchNumber: 31, phase: 'GROUP', groupLetter: 'H', slotId: 'GRP-H-03', homeTeam: 'ESP', awayTeam: 'KSA', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-21T16:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { matchNumber: 32, phase: 'GROUP', groupLetter: 'H', slotId: 'GRP-H-04', homeTeam: 'URU', awayTeam: 'CPV', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-22T19:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { matchNumber: 63, phase: 'GROUP', groupLetter: 'H', slotId: 'GRP-H-05', homeTeam: 'URU', awayTeam: 'ESP', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-27T22:00:00Z', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { matchNumber: 64, phase: 'GROUP', groupLetter: 'H', slotId: 'GRP-H-06', homeTeam: 'CPV', awayTeam: 'KSA', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-27T22:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },

  // ── Group I ──
  { matchNumber: 33, phase: 'GROUP', groupLetter: 'I', slotId: 'GRP-I-01', homeTeam: 'FRA', awayTeam: 'SEN', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-17T16:00:00Z', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { matchNumber: 34, phase: 'GROUP', groupLetter: 'I', slotId: 'GRP-I-02', homeTeam: 'IRQ', awayTeam: 'NOR', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-17T19:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { matchNumber: 35, phase: 'GROUP', groupLetter: 'I', slotId: 'GRP-I-03', homeTeam: 'NOR', awayTeam: 'FRA', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-22T22:00:00Z', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { matchNumber: 36, phase: 'GROUP', groupLetter: 'I', slotId: 'GRP-I-04', homeTeam: 'SEN', awayTeam: 'IRQ', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-23T16:00:00Z', venue: 'Hard Rock Stadium', city: 'Miami' },
  { matchNumber: 65, phase: 'GROUP', groupLetter: 'I', slotId: 'GRP-I-05', homeTeam: 'SEN', awayTeam: 'NOR', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-28T00:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { matchNumber: 66, phase: 'GROUP', groupLetter: 'I', slotId: 'GRP-I-06', homeTeam: 'IRQ', awayTeam: 'FRA', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-28T00:00:00Z', venue: 'MetLife Stadium', city: 'East Rutherford' },

  // ── Group J ──
  { matchNumber: 37, phase: 'GROUP', groupLetter: 'J', slotId: 'GRP-J-01', homeTeam: 'ARG', awayTeam: 'ALG', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-18T22:00:00Z', venue: 'Hard Rock Stadium', city: 'Miami' },
  { matchNumber: 38, phase: 'GROUP', groupLetter: 'J', slotId: 'GRP-J-02', homeTeam: 'AUT', awayTeam: 'JOR', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-18T19:00:00Z', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { matchNumber: 39, phase: 'GROUP', groupLetter: 'J', slotId: 'GRP-J-03', homeTeam: 'ARG', awayTeam: 'AUT', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-23T22:00:00Z', venue: 'Hard Rock Stadium', city: 'Miami' },
  { matchNumber: 40, phase: 'GROUP', groupLetter: 'J', slotId: 'GRP-J-04', homeTeam: 'JOR', awayTeam: 'ALG', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-23T19:00:00Z', venue: 'NRG Stadium', city: 'Houston' },
  { matchNumber: 67, phase: 'GROUP', groupLetter: 'J', slotId: 'GRP-J-05', homeTeam: 'ALG', awayTeam: 'AUT', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-28T16:00:00Z', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { matchNumber: 68, phase: 'GROUP', groupLetter: 'J', slotId: 'GRP-J-06', homeTeam: 'JOR', awayTeam: 'ARG', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-28T16:00:00Z', venue: 'NRG Stadium', city: 'Houston' },

  // ── Group K ──
  { matchNumber: 41, phase: 'GROUP', groupLetter: 'K', slotId: 'GRP-K-01', homeTeam: 'POR', awayTeam: 'COD', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-19T16:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { matchNumber: 42, phase: 'GROUP', groupLetter: 'K', slotId: 'GRP-K-02', homeTeam: 'COL', awayTeam: 'UZB', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-20T19:00:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },
  { matchNumber: 43, phase: 'GROUP', groupLetter: 'K', slotId: 'GRP-K-03', homeTeam: 'POR', awayTeam: 'COL', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-24T19:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { matchNumber: 44, phase: 'GROUP', groupLetter: 'K', slotId: 'GRP-K-04', homeTeam: 'UZB', awayTeam: 'COD', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-24T22:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { matchNumber: 69, phase: 'GROUP', groupLetter: 'K', slotId: 'GRP-K-05', homeTeam: 'COD', awayTeam: 'UZB', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-27T23:30:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { matchNumber: 70, phase: 'GROUP', groupLetter: 'K', slotId: 'GRP-K-06', homeTeam: 'COL', awayTeam: 'POR', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-27T23:30:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },

  // ── Group L ──
  { matchNumber: 45, phase: 'GROUP', groupLetter: 'L', slotId: 'GRP-L-01', homeTeam: 'ENG', awayTeam: 'CRO', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-16T16:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { matchNumber: 46, phase: 'GROUP', groupLetter: 'L', slotId: 'GRP-L-02', homeTeam: 'PAN', awayTeam: 'GHA', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-17T01:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },
  { matchNumber: 47, phase: 'GROUP', groupLetter: 'L', slotId: 'GRP-L-03', homeTeam: 'CRO', awayTeam: 'PAN', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-22T16:00:00Z', venue: 'BMO Field', city: 'Toronto' },
  { matchNumber: 48, phase: 'GROUP', groupLetter: 'L', slotId: 'GRP-L-04', homeTeam: 'GHA', awayTeam: 'ENG', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-23T01:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },
  { matchNumber: 71, phase: 'GROUP', groupLetter: 'L', slotId: 'GRP-L-05', homeTeam: 'GHA', awayTeam: 'CRO', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-28T19:00:00Z', venue: 'BMO Field', city: 'Toronto' },
  { matchNumber: 72, phase: 'GROUP', groupLetter: 'L', slotId: 'GRP-L-06', homeTeam: 'PAN', awayTeam: 'ENG', homeOrigin: null, awayOrigin: null, parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-28T19:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },
];

// ═══════════════════════════════════════════════════════════
// KNOCKOUT STAGE — 32 matches (June 28 - July 19, 2026)
// homeTeam/awayTeam = null (resolved at runtime)
// homeOrigin/awayOrigin = bracket position references
// parentSlot1/2 = bracket dependency tree
// ═══════════════════════════════════════════════════════════

const KNOCKOUT_MATCHES: MatchSeed[] = [
  // ── R32: 16 matches (June 28 - July 3) ──
  { matchNumber: 73,  phase: 'R32', groupLetter: null, slotId: 'R32-01', homeTeam: null, awayTeam: null, homeOrigin: '2A', awayOrigin: '2B', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-28T19:00:00Z', venue: 'SoFi Stadium', city: 'Los Angeles' },
  { matchNumber: 74,  phase: 'R32', groupLetter: null, slotId: 'R32-02', homeTeam: null, awayTeam: null, homeOrigin: '1E', awayOrigin: '3ABCDF', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-29T20:30:00Z', venue: 'Gillette Stadium', city: 'Boston' },
  { matchNumber: 75,  phase: 'R32', groupLetter: null, slotId: 'R32-03', homeTeam: null, awayTeam: null, homeOrigin: '1F', awayOrigin: '2C', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-30T01:00:00Z', venue: 'Estadio BBVA', city: 'Monterrey' },
  { matchNumber: 76,  phase: 'R32', groupLetter: null, slotId: 'R32-04', homeTeam: null, awayTeam: null, homeOrigin: '1C', awayOrigin: '2F', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-29T17:00:00Z', venue: 'NRG Stadium', city: 'Houston' },
  { matchNumber: 77,  phase: 'R32', groupLetter: null, slotId: 'R32-05', homeTeam: null, awayTeam: null, homeOrigin: '1I', awayOrigin: '3CDFGH', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-30T21:00:00Z', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { matchNumber: 78,  phase: 'R32', groupLetter: null, slotId: 'R32-06', homeTeam: null, awayTeam: null, homeOrigin: '2E', awayOrigin: '2I', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-06-30T17:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { matchNumber: 79,  phase: 'R32', groupLetter: null, slotId: 'R32-07', homeTeam: null, awayTeam: null, homeOrigin: '1A', awayOrigin: '3CEFHI', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-07-01T01:00:00Z', venue: 'Estadio Azteca', city: 'Mexico City' },
  { matchNumber: 80,  phase: 'R32', groupLetter: null, slotId: 'R32-08', homeTeam: null, awayTeam: null, homeOrigin: '1L', awayOrigin: '3EHIJK', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-07-01T16:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { matchNumber: 81,  phase: 'R32', groupLetter: null, slotId: 'R32-09', homeTeam: null, awayTeam: null, homeOrigin: '1D', awayOrigin: '3BEFIJ', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-07-02T00:00:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },
  { matchNumber: 82,  phase: 'R32', groupLetter: null, slotId: 'R32-10', homeTeam: null, awayTeam: null, homeOrigin: '1G', awayOrigin: '3AEHIJ', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-07-01T20:00:00Z', venue: 'Lumen Field', city: 'Seattle' },
  { matchNumber: 83,  phase: 'R32', groupLetter: null, slotId: 'R32-11', homeTeam: null, awayTeam: null, homeOrigin: '2K', awayOrigin: '2L', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-07-02T23:00:00Z', venue: 'BMO Field', city: 'Toronto' },
  { matchNumber: 84,  phase: 'R32', groupLetter: null, slotId: 'R32-12', homeTeam: null, awayTeam: null, homeOrigin: '1H', awayOrigin: '2J', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-07-02T19:00:00Z', venue: 'SoFi Stadium', city: 'Los Angeles' },
  { matchNumber: 85,  phase: 'R32', groupLetter: null, slotId: 'R32-13', homeTeam: null, awayTeam: null, homeOrigin: '1B', awayOrigin: '3EFGIJ', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-07-03T03:00:00Z', venue: 'BC Place', city: 'Vancouver' },
  { matchNumber: 86,  phase: 'R32', groupLetter: null, slotId: 'R32-14', homeTeam: null, awayTeam: null, homeOrigin: '1J', awayOrigin: '2H', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-07-03T22:00:00Z', venue: 'Hard Rock Stadium', city: 'Miami' },
  { matchNumber: 87,  phase: 'R32', groupLetter: null, slotId: 'R32-15', homeTeam: null, awayTeam: null, homeOrigin: '1K', awayOrigin: '3DEIJL', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-07-04T01:30:00Z', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { matchNumber: 88,  phase: 'R32', groupLetter: null, slotId: 'R32-16', homeTeam: null, awayTeam: null, homeOrigin: '2D', awayOrigin: '2G', parentSlot1: null, parentSlot2: null, scheduledAt: '2026-07-03T18:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },

  // ── R16: 8 matches (July 4-7) ──
  { matchNumber: 89,  phase: 'R16', groupLetter: null, slotId: 'R16-01', homeTeam: null, awayTeam: null, homeOrigin: 'W74', awayOrigin: 'W77', parentSlot1: 'R32-02', parentSlot2: 'R32-05', scheduledAt: '2026-07-04T21:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { matchNumber: 90,  phase: 'R16', groupLetter: null, slotId: 'R16-02', homeTeam: null, awayTeam: null, homeOrigin: 'W73', awayOrigin: 'W75', parentSlot1: 'R32-01', parentSlot2: 'R32-03', scheduledAt: '2026-07-04T17:00:00Z', venue: 'NRG Stadium', city: 'Houston' },
  { matchNumber: 91,  phase: 'R16', groupLetter: null, slotId: 'R16-03', homeTeam: null, awayTeam: null, homeOrigin: 'W76', awayOrigin: 'W78', parentSlot1: 'R32-04', parentSlot2: 'R32-06', scheduledAt: '2026-07-05T20:00:00Z', venue: 'MetLife Stadium', city: 'East Rutherford' },
  { matchNumber: 92,  phase: 'R16', groupLetter: null, slotId: 'R16-04', homeTeam: null, awayTeam: null, homeOrigin: 'W79', awayOrigin: 'W80', parentSlot1: 'R32-07', parentSlot2: 'R32-08', scheduledAt: '2026-07-06T00:00:00Z', venue: 'Estadio Azteca', city: 'Mexico City' },
  { matchNumber: 93,  phase: 'R16', groupLetter: null, slotId: 'R16-05', homeTeam: null, awayTeam: null, homeOrigin: 'W83', awayOrigin: 'W84', parentSlot1: 'R32-11', parentSlot2: 'R32-12', scheduledAt: '2026-07-05T16:00:00Z', venue: 'Lumen Field', city: 'Seattle' },
  { matchNumber: 94,  phase: 'R16', groupLetter: null, slotId: 'R16-06', homeTeam: null, awayTeam: null, homeOrigin: 'W81', awayOrigin: 'W82', parentSlot1: 'R32-09', parentSlot2: 'R32-10', scheduledAt: '2026-07-06T20:00:00Z', venue: 'SoFi Stadium', city: 'Los Angeles' },
  { matchNumber: 95,  phase: 'R16', groupLetter: null, slotId: 'R16-07', homeTeam: null, awayTeam: null, homeOrigin: 'W86', awayOrigin: 'W88', parentSlot1: 'R32-14', parentSlot2: 'R32-16', scheduledAt: '2026-07-07T16:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { matchNumber: 96,  phase: 'R16', groupLetter: null, slotId: 'R16-08', homeTeam: null, awayTeam: null, homeOrigin: 'W85', awayOrigin: 'W87', parentSlot1: 'R32-13', parentSlot2: 'R32-15', scheduledAt: '2026-07-08T00:00:00Z', venue: 'BC Place', city: 'Vancouver' },

  // ── QF: 4 matches (July 9-11) ──
  { matchNumber: 97,  phase: 'QF', groupLetter: null, slotId: 'QF-01', homeTeam: null, awayTeam: null, homeOrigin: 'W89', awayOrigin: 'W90', parentSlot1: 'R16-01', parentSlot2: 'R16-02', scheduledAt: '2026-07-09T20:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },
  { matchNumber: 98,  phase: 'QF', groupLetter: null, slotId: 'QF-02', homeTeam: null, awayTeam: null, homeOrigin: 'W93', awayOrigin: 'W94', parentSlot1: 'R16-05', parentSlot2: 'R16-06', scheduledAt: '2026-07-10T19:00:00Z', venue: 'SoFi Stadium', city: 'Los Angeles' },
  { matchNumber: 99,  phase: 'QF', groupLetter: null, slotId: 'QF-03', homeTeam: null, awayTeam: null, homeOrigin: 'W91', awayOrigin: 'W92', parentSlot1: 'R16-03', parentSlot2: 'R16-04', scheduledAt: '2026-07-11T21:00:00Z', venue: 'Hard Rock Stadium', city: 'Miami' },
  { matchNumber: 100, phase: 'QF', groupLetter: null, slotId: 'QF-04', homeTeam: null, awayTeam: null, homeOrigin: 'W95', awayOrigin: 'W96', parentSlot1: 'R16-07', parentSlot2: 'R16-08', scheduledAt: '2026-07-12T01:00:00Z', venue: 'Arrowhead Stadium', city: 'Kansas City' },

  // ── SF: 2 matches (July 14-15) ──
  { matchNumber: 101, phase: 'SF', groupLetter: null, slotId: 'SF-01', homeTeam: null, awayTeam: null, homeOrigin: 'W97', awayOrigin: 'W98', parentSlot1: 'QF-01', parentSlot2: 'QF-02', scheduledAt: '2026-07-14T19:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { matchNumber: 102, phase: 'SF', groupLetter: null, slotId: 'SF-02', homeTeam: null, awayTeam: null, homeOrigin: 'W99', awayOrigin: 'W100', parentSlot1: 'QF-03', parentSlot2: 'QF-04', scheduledAt: '2026-07-15T19:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },

  // ── Third place: 1 match (July 18) — USES LOSERS OF SF (N6) ──
  { matchNumber: 103, phase: 'THIRD', groupLetter: null, slotId: '3RD-01', homeTeam: null, awayTeam: null, homeOrigin: 'L101', awayOrigin: 'L102', parentSlot1: 'SF-01', parentSlot2: 'SF-02', scheduledAt: '2026-07-18T20:00:00Z', venue: 'Hard Rock Stadium', city: 'Miami' },

  // ── Final: 1 match (July 19) ──
  { matchNumber: 104, phase: 'FINAL', groupLetter: null, slotId: 'F-01', homeTeam: null, awayTeam: null, homeOrigin: 'W101', awayOrigin: 'W102', parentSlot1: 'SF-01', parentSlot2: 'SF-02', scheduledAt: '2026-07-19T20:00:00Z', venue: 'MetLife Stadium', city: 'East Rutherford' },
];

// ═══════════════════════════════════════════════════════════
// Export all matches
// ═══════════════════════════════════════════════════════════

export const ALL_MATCHES: MatchSeed[] = [...GROUP_MATCHES, ...KNOCKOUT_MATCHES];

// Validation
if (GROUP_MATCHES.length !== 72) throw new Error(`Expected 72 group matches, got ${GROUP_MATCHES.length}`);
if (KNOCKOUT_MATCHES.length !== 32) throw new Error(`Expected 32 knockout matches, got ${KNOCKOUT_MATCHES.length}`);
if (ALL_MATCHES.length !== 104) throw new Error(`Expected 104 total matches, got ${ALL_MATCHES.length}`);

// Verify unique match numbers
const nums = new Set(ALL_MATCHES.map(m => m.matchNumber));
if (nums.size !== 104) throw new Error('Duplicate match numbers detected');

// Verify unique slot IDs
const slots = new Set(ALL_MATCHES.map(m => m.slotId));
if (slots.size !== 104) throw new Error('Duplicate slot IDs detected');
