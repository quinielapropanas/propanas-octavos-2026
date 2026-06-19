-- ═══════════════════════════════════════════════════════════
-- ProPanas 2026 — RLS Policies: Derived State tables
--
-- Per spec section 5.3:
--   SELECT: any pool member
--   INSERT/UPDATE/DELETE: service_role only (no user policies)
--
-- The recalculator is always called from server-side route handlers
-- using the service_role client, which bypasses RLS entirely.
-- Therefore no user-facing write policies are needed.
--
-- Run this FOURTH.
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 17. group_standings — official + all participants' views
-- ═══════════════════════════════════════════════════════════

-- Any member can read OFFICIAL standings
CREATE POLICY "standings_select_official" ON public.group_standings
  FOR SELECT TO authenticated
  USING (
    "contextType" = 'OFFICIAL'
    AND propanas.is_member("poolId")
  );

-- Members can read their OWN participant standings
CREATE POLICY "standings_select_self_participant" ON public.group_standings
  FOR SELECT TO authenticated
  USING (
    "contextType" = 'PARTICIPANT'
    AND "contextKey" = auth.uid()::TEXT
  );

-- Admins can read any participant's standings
CREATE POLICY "standings_select_admins" ON public.group_standings
  FOR SELECT TO authenticated
  USING (
    "contextType" = 'PARTICIPANT'
    AND propanas.is_admin("poolId")
  );

-- ═══════════════════════════════════════════════════════════
-- 18. best_thirds — same pattern
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "thirds_select_official" ON public.best_thirds
  FOR SELECT TO authenticated
  USING (
    "contextType" = 'OFFICIAL'
    AND propanas.is_member("poolId")
  );

CREATE POLICY "thirds_select_self_participant" ON public.best_thirds
  FOR SELECT TO authenticated
  USING (
    "contextType" = 'PARTICIPANT'
    AND "contextKey" = auth.uid()::TEXT
  );

CREATE POLICY "thirds_select_admins" ON public.best_thirds
  FOR SELECT TO authenticated
  USING (
    "contextType" = 'PARTICIPANT'
    AND propanas.is_admin("poolId")
  );

-- ═══════════════════════════════════════════════════════════
-- 19. bracket_slots — same pattern
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "bracket_select_official" ON public.bracket_slots
  FOR SELECT TO authenticated
  USING (
    "contextType" = 'OFFICIAL'
    AND propanas.is_member("poolId")
  );

CREATE POLICY "bracket_select_self_participant" ON public.bracket_slots
  FOR SELECT TO authenticated
  USING (
    "contextType" = 'PARTICIPANT'
    AND "contextKey" = auth.uid()::TEXT
  );

CREATE POLICY "bracket_select_admins" ON public.bracket_slots
  FOR SELECT TO authenticated
  USING (
    "contextType" = 'PARTICIPANT'
    AND propanas.is_admin("poolId")
  );

-- ═══════════════════════════════════════════════════════════
-- 20. score_breakdowns — user reads own, admin reads all
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "breakdowns_select_self" ON public.score_breakdowns
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::TEXT);

CREATE POLICY "breakdowns_select_admins" ON public.score_breakdowns
  FOR SELECT TO authenticated
  USING (propanas.is_admin("poolId"));

-- ═══════════════════════════════════════════════════════════
-- 21. rankings — readable by all pool members (leaderboard)
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "rankings_select_members" ON public.rankings
  FOR SELECT TO authenticated
  USING (propanas.is_member("poolId"));

-- ═══════════════════════════════════════════════════════════
-- NOTE ON WRITES TO DERIVED TABLES:
-- ═══════════════════════════════════════════════════════════
-- No INSERT/UPDATE/DELETE policies are defined for any of the
-- 5 derived tables. This means authenticated users CANNOT write
-- to these tables directly.
--
-- All writes happen via the recalculator, which uses the
-- service_role client (createServiceSupabase in lib/supabase/clients.ts).
-- The service_role bypasses RLS by design.
--
-- This matches the spec:
--   "INSERT/UPDATE/DELETE: solo service role (backend)"
-- ═══════════════════════════════════════════════════════════
