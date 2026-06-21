// ═══════════════════════════════════════════════════════════
// Auth Helper — Server-side auth for API route handlers
//
// REWRITE: Now uses @supabase/ssr cookie-based server client
// instead of raw Bearer token extraction.
//
// The middleware already refreshes the session on every request,
// so by the time a route handler runs, the cookies contain a
// valid JWT. We just read it via createServerSupabase().
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// Auth Helper — Server-side auth for API route handlers
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from './supabase/server';
import { syncUserToPrisma } from './supabase/user-sync';
import { prisma } from './db/client';

export interface AuthContext {
  userId: string;
  email: string;
  displayName: string;
  poolId: string;
  role: 'ADMIN' | 'PARTICIPANT';
}

export async function requireAuth(
  req: NextRequest,
  requiredRole?: 'ADMIN' | 'PARTICIPANT',
): Promise<AuthContext | NextResponse> {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await syncUserToPrisma(user);
  } catch {}

  const url = new URL(req.url);
  const poolId = url.searchParams.get('poolId') ?? 'pool-propanas-octavos-2026';

  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId, userId: user.id } },
  });

  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Not a member of this pool' }, { status: 403 });
  }

  if (requiredRole && membership.role !== requiredRole) {
    return NextResponse.json(
      { error: `Requires ${requiredRole} role, you have ${membership.role}` },
      { status: 403 },
    );
  }

  const prismaUser = await prisma.user.findUnique({
    where: { id: user.id }, select: { displayName: true },
  });

  return {
    userId: user.id,
    email: user.email ?? '',
    displayName: prismaUser?.displayName ?? user.email?.split('@')[0] ?? '',
    poolId,
    role: membership.role as 'ADMIN' | 'PARTICIPANT',
  };
}

export function isAuthError(result: AuthContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

export async function isMatchLocked(poolId: string, matchId: string): Promise<boolean> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return true;

  const now = new Date();

  const matchDeadline = await prisma.poolDeadline.findFirst({
    where: { poolId, scope: 'MATCH', matchId },
  });
  if (matchDeadline) return now > matchDeadline.deadlineAt;

  const phaseDeadline = await prisma.poolDeadline.findFirst({
    where: { poolId, scope: 'PHASE', phase: match.phase },
  });
  if (phaseDeadline) return now > phaseDeadline.deadlineAt;

  const globalDeadline = await prisma.poolDeadline.findFirst({
    where: { poolId, scope: 'GLOBAL' },
  });
  if (globalDeadline) return now > globalDeadline.deadlineAt;

  return false;
}

export async function isEntryLocked(poolId: string, userId: string, entryId?: string): Promise<boolean> {
  // If specific entryId provided, check only that one
  if (entryId) {
    const entry = await prisma.entry.findUnique({ where: { id: entryId } });
    if (entry?.status === 'LOCKED' || entry?.status === 'SUBMITTED' || entry?.status === 'APPROVED') {
      return true;
    }
  }

  // Check global deadline
  const globalDeadline = await prisma.poolDeadline.findFirst({
    where: { poolId, scope: 'GLOBAL' },
  });
  if (globalDeadline && new Date() > globalDeadline.deadlineAt) return true;

  return false;
}
