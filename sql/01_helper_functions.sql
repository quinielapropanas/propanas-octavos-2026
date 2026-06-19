-- ═══════════════════════════════════════════════════════════
-- ProPanas 2026 — RLS Helper Functions
--
-- Reusable auth/role check functions used across all policies.
-- Placed in a dedicated `propanas` schema for clarity.
-- Run this FIRST, before 02_enable_rls.sql.
-- ═══════════════════════════════════════════════════════════

-- Create dedicated schema for helpers
CREATE SCHEMA IF NOT EXISTS propanas;

-- ─── propanas.current_user_id() ──────────────────────────
-- Returns the authenticated user's UUID as TEXT (our users.id is TEXT).
-- Returns NULL if no auth context (service role or unauthenticated).

CREATE OR REPLACE FUNCTION propanas.current_user_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT auth.uid()::TEXT;
$$;

-- ─── propanas.is_member(pool_id) ─────────────────────────
-- Returns true if the current user has ACTIVE membership in the pool.

CREATE OR REPLACE FUNCTION propanas.is_member(p_pool_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pool_memberships
    WHERE "poolId" = p_pool_id
      AND "userId" = auth.uid()::TEXT
      AND status = 'ACTIVE'
  );
$$;

-- ─── propanas.is_admin(pool_id) ──────────────────────────
-- Returns true if the current user is an ACTIVE ADMIN of the pool.

CREATE OR REPLACE FUNCTION propanas.is_admin(p_pool_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pool_memberships
    WHERE "poolId" = p_pool_id
      AND "userId" = auth.uid()::TEXT
      AND role = 'ADMIN'
      AND status = 'ACTIVE'
  );
$$;

-- ─── propanas.entry_is_locked(pool_id, user_id) ──────────
-- Returns true if the user's entry for this pool is LOCKED.
-- Used to prevent writes to predictions when entry is closed.

CREATE OR REPLACE FUNCTION propanas.entry_is_locked(p_pool_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entries
    WHERE "poolId" = p_pool_id
      AND "userId" = p_user_id
      AND status = 'LOCKED'
  );
$$;

-- ─── Grant execute to authenticated role ─────────────────

GRANT USAGE ON SCHEMA propanas TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION propanas.current_user_id() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION propanas.is_member(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION propanas.is_admin(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION propanas.entry_is_locked(TEXT, TEXT) TO authenticated, anon, service_role;

COMMENT ON SCHEMA propanas IS 'ProPanas 2026 helper functions for RLS policies';
COMMENT ON FUNCTION propanas.is_member(TEXT) IS 'True if current user is active member of given pool';
COMMENT ON FUNCTION propanas.is_admin(TEXT) IS 'True if current user is active admin of given pool';
COMMENT ON FUNCTION propanas.entry_is_locked(TEXT, TEXT) IS 'True if given user''s entry is LOCKED in given pool';
