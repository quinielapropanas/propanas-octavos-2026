// ═══════════════════════════════════════════════════════════
// Client-Side API Client — Typed fetch wrappers for mutations
//
// Used by Client Components to POST/PUT to /api/* routes.
// Auth is handled by cookies (middleware refreshes the JWT).
// ═══════════════════════════════════════════════════════════

'use client';

export interface ApiError {
  error: string;
  [key: string]: any;
}

export class ApiClientError extends Error {
  constructor(public status: number, public data: ApiError) {
    super(data.error || `API error ${status}`);
    this.name = 'ApiClientError';
  }
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  const data = await res.json().catch(() => ({ error: 'Invalid response' }));

  if (!res.ok) {
    throw new ApiClientError(res.status, data);
  }

  return data as T;
}

// ─── Predictions ─────────────────────────────────────────

export interface UpdatePredictionInput {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  homePenalties?: number;
  awayPenalties?: number;
  entryId?: string;
  confirmCascade?: boolean;
}

export interface CascadePreview {
  requiresConfirmation: true;
  cascade: {
    affectedSlotIds: string[];
    affectedMatchIds: string[];
    description: string;
  };
  message: string;
}

export interface PredictionSaved {
  success: true;
  prediction: {
    matchId: string;
    homeGoals: number;
    awayGoals: number;
    status: string;
  };
}

export function updatePrediction(input: UpdatePredictionInput) {
  return call<PredictionSaved | CascadePreview>('/api/predictions', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function updateTopScorer(input: {
  playerName: string;
  teamId?: string;
  goals: number;
}) {
  return call<{ success: true }>('/api/predictions/scorer', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ─── Entry lifecycle ─────────────────────────────────────

export function submitEntry() {
  return call<{ success: true; lockedAt?: string }>('/api/entries/submit', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function unsubmitEntry() {
  return call<{ success: true }>('/api/entries/unsubmit', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ─── Admin: results ──────────────────────────────────────

export interface LoadResultInput {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  homePenalties?: number;
  awayPenalties?: number;
  fairPlayHome?: number;
  fairPlayAway?: number;
}

export interface LoadResultOutput {
  success: true;
  resultId: string;
  matchNumber: number;
  slotId: string;
  groupsRecalculated: string[];
  bracketSlotsUpdated: number;
  participantsScored: number;
  elapsedMs: number;
}

export function loadResult(input: LoadResultInput) {
  return call<LoadResultOutput>('/api/admin/results', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ─── Admin: overrides ────────────────────────────────────

export interface CreateOverrideInput {
  type: 'GROUP_STANDING' | 'BEST_THIRDS';
  targetGroup?: string;
  payload: any;
  reason?: string;
}

export function createOverride(input: CreateOverrideInput) {
  return call<{ success: true; overrideId: string; elapsedMs: number }>('/api/admin/overrides', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ─── Admin: config ───────────────────────────────────────

export interface UpdateConfigInput {
  concepts?: Array<{
    conceptId: number; name: string; points: number; isActive: boolean;
    description?: string;
  }>;
  flags?: {
    knockoutMatchScoringEnabled?: boolean;
    penaltiesCountForScore?: boolean;
    absoluteGoalDifference?: boolean;
    goleadaThreshold?: number;
    golPromedioBandas?: any[];
  };
}

export function updateConfig(input: UpdateConfigInput) {
  return call<{ success: true }>('/api/admin/config', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

// ─── Admin: manual rebuild ───────────────────────────────

export function triggerRebuild() {
  return call<{ success: true; participantsScored: number; elapsedMs: number }>(
    '/api/admin/recalc-fast',
    { method: 'POST', body: JSON.stringify({}) },
  );
}

// ─── Helper: translate API errors to Spanish ─────────────

export function translateError(err: unknown): string {
  if (err instanceof ApiClientError) {
    const msg = err.data.error || err.message;
    if (msg.includes('Not authenticated')) return 'Sesión expirada, recarga la página';
    if (msg.includes('Not a member')) return 'No eres miembro de esta quiniela';
    if (msg.includes('Requires ADMIN role')) return 'Requiere permisos de administrador';
    if (msg.includes('past its deadline')) return 'Este partido está cerrado (pasó el deadline)';
    if (msg.includes('entry is locked')) return 'Tu quiniela ya está cerrada';
    if (msg.includes('penalties are required')) return 'Empate en eliminatoria: los penales son obligatorios';
    if (msg.includes('Penalties cannot be tied')) return 'Los penales no pueden empatar — un equipo debe ganar';
    if (msg.includes('Match not found')) return 'Partido no encontrado';
    return msg;
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}
