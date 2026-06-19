// ═══════════════════════════════════════════════════════════
// Shared Data Types — Used by server queries and client API
// ═══════════════════════════════════════════════════════════

export type EntryStatus = 'DRAFT' | 'SUBMITTED' | 'LOCKED';
export type MatchPhase = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'THIRD' | 'FINAL';

export interface TeamBrief {
  id: string;
  name: string;
  shortName: string;
  flagAssetKey: string | null;
  groupLetter: string;
}

export interface MatchBrief {
  id: string;
  matchNumber: number;
  phase: MatchPhase;
  groupLetter: string | null;
  slotId: string;
  scheduledAt: Date;
  venue: string;
  city: string;
  homeTeam: TeamBrief | null;
  awayTeam: TeamBrief | null;
  homeOrigin: string | null;
  awayOrigin: string | null;
}

export interface PredictionBrief {
  matchId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  status: 'VALID' | 'INVALIDATED_BY_CASCADE';
  lockedAt: Date | null;
}

export interface OfficialResultBrief {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  homePenalties: number | null;
  awayPenalties: number | null;
}

// ─── Dashboard ──────────────────────────────────────────

export interface DashboardData {
  position: number | null;
  totalPoints: number;
  completionPct: number;
  matchesPredicted: number;
  totalMatches: 104;
  entryStatus: EntryStatus;
  nextDeadlineAt: Date | null;
  nextMatch: MatchBrief | null;
  groupCompletion: Record<string, { predicted: number; total: 6 }>;
}

// ─── Groups ─────────────────────────────────────────────

export interface GroupMatchWithPrediction {
  match: MatchBrief;
  prediction: PredictionBrief | null;
  result: OfficialResultBrief | null;
  pointsEarned: number | null;
  locked: boolean;
}

export interface GroupStandingRow {
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
}

export interface GroupData {
  groupLetter: string;
  teams: TeamBrief[];
  matches: GroupMatchWithPrediction[];
  participantStandings: GroupStandingRow[] | null;
  officialStandings: GroupStandingRow[] | null;
  locked: boolean;
}

// ─── Leaderboard ────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string;
  entryId?: string;
  displayName: string;
  totalPoints: number;
  phase1Points: number;
  phase2Points: number;
  position: number;
  matchesPredicted: number;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  myPosition: number | null;
  myPoints: number;
  total: number;
  page: number;
  pages: number;
}

// ─── Breakdown ──────────────────────────────────────────

export interface ConceptBreakdownDetail {
  matchId: string | null;
  slotId: string | null;
  pointsAwarded: number;
  explanation: string;
  matchNumber?: number;
}

export interface ConceptBreakdown {
  conceptId: number;
  name: string;
  maxPoints: number;
  isActive: boolean;
  totalAwarded: number;
  details: ConceptBreakdownDetail[];
}

export interface BreakdownData {
  userId: string;
  displayName: string;
  totalPoints: number;
  phase1Points: number;
  phase2Points: number;
  position: number | null;
  concepts: ConceptBreakdown[];
}

// ─── Profile ────────────────────────────────────────────

export interface TopScorerPrediction {
  playerName: string | null;
  teamId: string | null;
  goals: number | null;
}

export interface ProfileData {
  userId: string;
  email: string;
  displayName: string;
  fullName: string | null;
  country: string | null;
  city: string | null;
  entryStatus: EntryStatus;
  entrySubmittedAt: Date | null;
  entryLockedAt: Date | null;
  entryLockedReason: string | null;
  completionPct: number;
  topScorer: TopScorerPrediction | null;
  canSubmit: boolean;
  canUnsubmit: boolean;
}

// ─── Bracket ────────────────────────────────────────────

export interface BracketSlot {
  slotId: string;
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'THIRD' | 'FINAL';
  matchNumber: number;
  homeTeam: TeamBrief | null;
  awayTeam: TeamBrief | null;
  homeGoals: number | null;
  awayGoals: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  winnerTeamId: string | null;
  loserTeamId: string | null;
  status: 'pending' | 'completed' | 'invalidated' | 'locked' | 'unresolved';
  locked: boolean;
  pointsEarned: number | null;
}

export interface BracketData {
  participantSlots: BracketSlot[];
  officialSlots: BracketSlot[];
  thirdPlaceMatrixResolved: boolean;
}

// ─── Admin ──────────────────────────────────────────────

export interface AdminDashboardData {
  poolId: string;
  matchesPlayed: number;
  totalMatches: 104;
  participantCount: number;
  activeOverrides: number;
  lastRecalcAt: Date | null;
  lastRecalcDurationMs: number | null;
  matrixComplete: boolean;
  matrixMissing: string[];
}

export interface PendingMatchRow extends MatchBrief {
  hasResult: boolean;
  name: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorDisplayName: string | null;
  createdAt: Date;
  summary: string;
}
