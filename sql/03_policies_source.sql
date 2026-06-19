-- ═══════════════════════════════════════════════════════════
-- ProPanas 2026 — RLS Policies: Source of Truth tables
--
-- Per spec section 5.3.
-- Run this THIRD (after 02_enable_rls.sql).
--
-- Notes:
--   - service_role always bypasses RLS (no policies needed for it)
--   - Policy names follow: <table>_<action>_<role>
--   - All policies use propanas.is_member / is_admin helpers
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. pools — basic info, readable by members
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "pools_select_members" ON public.pools
  FOR SELECT TO authenticated
  USING (propanas.is_member(id));

CREATE POLICY "pools_update_admins" ON public.pools
  FOR UPDATE TO authenticated
  USING (propanas.is_admin(id))
  WITH CHECK (propanas.is_admin(id));

-- No INSERT/DELETE policies: pool creation is service_role only

-- ═══════════════════════════════════════════════════════════
-- 2. pool_scoring_concepts — readable by members, writable by admin
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "concepts_select_members" ON public.pool_scoring_concepts
  FOR SELECT TO authenticated
  USING (propanas.is_member("poolId"));

CREATE POLICY "concepts_all_admins" ON public.pool_scoring_concepts
  FOR ALL TO authenticated
  USING (propanas.is_admin("poolId"))
  WITH CHECK (propanas.is_admin("poolId"));

-- ═══════════════════════════════════════════════════════════
-- 3. pool_behavior_flags — readable by members, writable by admin
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "flags_select_members" ON public.pool_behavior_flags
  FOR SELECT TO authenticated
  USING (propanas.is_member("poolId"));

CREATE POLICY "flags_all_admins" ON public.pool_behavior_flags
  FOR ALL TO authenticated
  USING (propanas.is_admin("poolId"))
  WITH CHECK (propanas.is_admin("poolId"));

-- ═══════════════════════════════════════════════════════════
-- 4. pool_deadlines — readable by members, writable by admin
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "deadlines_select_members" ON public.pool_deadlines
  FOR SELECT TO authenticated
  USING (propanas.is_member("poolId"));

CREATE POLICY "deadlines_all_admins" ON public.pool_deadlines
  FOR ALL TO authenticated
  USING (propanas.is_admin("poolId"))
  WITH CHECK (propanas.is_admin("poolId"));

-- ═══════════════════════════════════════════════════════════
-- 5. users — each user can read+update own row
-- ═══════════════════════════════════════════════════════════
-- Note: user creation is handled by syncUserToPrisma (service_role)
-- after Supabase Auth signup.

CREATE POLICY "users_select_self" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid()::TEXT);

CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::TEXT)
  WITH CHECK (id = auth.uid()::TEXT);

-- Members can also see other users' displayName (needed for leaderboard enrichment)
-- Restricted to users in the same pool via a subquery
CREATE POLICY "users_select_pool_members" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pool_memberships pm1
      JOIN public.pool_memberships pm2 ON pm1."poolId" = pm2."poolId"
      WHERE pm1."userId" = auth.uid()::TEXT
        AND pm2."userId" = users.id
        AND pm1.status = 'ACTIVE'
        AND pm2.status = 'ACTIVE'
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 6. user_profiles — each user manages own profile
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "profiles_select_self" ON public.user_profiles
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::TEXT);

CREATE POLICY "profiles_select_admins" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (propanas.is_admin("poolId"));

CREATE POLICY "profiles_all_self" ON public.user_profiles
  FOR ALL TO authenticated
  USING ("userId" = auth.uid()::TEXT)
  WITH CHECK ("userId" = auth.uid()::TEXT);

-- ═══════════════════════════════════════════════════════════
-- 7. pool_memberships — read own, admin reads all in pool
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "memberships_select_self" ON public.pool_memberships
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::TEXT);

CREATE POLICY "memberships_select_admins" ON public.pool_memberships
  FOR SELECT TO authenticated
  USING (propanas.is_admin("poolId"));

CREATE POLICY "memberships_all_admins" ON public.pool_memberships
  FOR ALL TO authenticated
  USING (propanas.is_admin("poolId"))
  WITH CHECK (propanas.is_admin("poolId"));

-- ═══════════════════════════════════════════════════════════
-- 8. entries — user sees own, admin sees all, user updates if not locked
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "entries_select_self" ON public.entries
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::TEXT);

CREATE POLICY "entries_select_admins" ON public.entries
  FOR SELECT TO authenticated
  USING (propanas.is_admin("poolId"));

-- User can update their own entry ONLY if status != LOCKED
CREATE POLICY "entries_update_self_not_locked" ON public.entries
  FOR UPDATE TO authenticated
  USING (
    "userId" = auth.uid()::TEXT
    AND status != 'LOCKED'
  )
  WITH CHECK (
    "userId" = auth.uid()::TEXT
    -- Allow status transition to LOCKED only via service_role or admin
    AND (status != 'LOCKED' OR propanas.is_admin("poolId"))
  );

-- Admins can update any entry (force lock, etc.)
CREATE POLICY "entries_update_admins" ON public.entries
  FOR UPDATE TO authenticated
  USING (propanas.is_admin("poolId"))
  WITH CHECK (propanas.is_admin("poolId"));

-- ═══════════════════════════════════════════════════════════
-- 9. teams — readable by members (reference data)
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "teams_select_members" ON public.teams
  FOR SELECT TO authenticated
  USING (propanas.is_member("poolId"));

-- No INSERT/UPDATE/DELETE policies: teams are seeded via service_role

-- ═══════════════════════════════════════════════════════════
-- 10. matches — readable by members (reference data)
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "matches_select_members" ON public.matches
  FOR SELECT TO authenticated
  USING (propanas.is_member("poolId"));

-- Matches are seeded; knockout teams get resolved by service_role

-- ═══════════════════════════════════════════════════════════
-- 11. official_results — readable by members, writable by admin
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "results_select_members" ON public.official_results
  FOR SELECT TO authenticated
  USING (propanas.is_member("poolId"));

CREATE POLICY "results_insert_admins" ON public.official_results
  FOR INSERT TO authenticated
  WITH CHECK (propanas.is_admin("poolId"));

CREATE POLICY "results_update_admins" ON public.official_results
  FOR UPDATE TO authenticated
  USING (propanas.is_admin("poolId"))
  WITH CHECK (propanas.is_admin("poolId"));

-- No DELETE policy: results are append-only (use versioning)

-- ═══════════════════════════════════════════════════════════
-- 12. official_tournament_data — readable by members, writable by admin
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "tournament_data_select_members" ON public.official_tournament_data
  FOR SELECT TO authenticated
  USING (propanas.is_member("poolId"));

CREATE POLICY "tournament_data_all_admins" ON public.official_tournament_data
  FOR ALL TO authenticated
  USING (propanas.is_admin("poolId"))
  WITH CHECK (propanas.is_admin("poolId"));

-- ═══════════════════════════════════════════════════════════
-- 13. predictions — user reads/writes own (not locked), admin reads all
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "predictions_select_self" ON public.predictions
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::TEXT);

CREATE POLICY "predictions_select_admins" ON public.predictions
  FOR SELECT TO authenticated
  USING (propanas.is_admin("poolId"));

-- INSERT: user can only create predictions for themselves, entry not locked
CREATE POLICY "predictions_insert_self" ON public.predictions
  FOR INSERT TO authenticated
  WITH CHECK (
    "userId" = auth.uid()::TEXT
    AND NOT propanas.entry_is_locked("poolId", auth.uid()::TEXT)
  );

-- UPDATE: same constraints
CREATE POLICY "predictions_update_self" ON public.predictions
  FOR UPDATE TO authenticated
  USING (
    "userId" = auth.uid()::TEXT
    AND NOT propanas.entry_is_locked("poolId", auth.uid()::TEXT)
  )
  WITH CHECK (
    "userId" = auth.uid()::TEXT
    AND NOT propanas.entry_is_locked("poolId", auth.uid()::TEXT)
  );

-- No DELETE policy: use status=INVALIDATED_BY_CASCADE for soft delete

-- ═══════════════════════════════════════════════════════════
-- 14. top_scorer_predictions — same pattern as predictions
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "top_scorer_select_self" ON public.top_scorer_predictions
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::TEXT);

CREATE POLICY "top_scorer_select_admins" ON public.top_scorer_predictions
  FOR SELECT TO authenticated
  USING (propanas.is_admin("poolId"));

CREATE POLICY "top_scorer_insert_self" ON public.top_scorer_predictions
  FOR INSERT TO authenticated
  WITH CHECK (
    "userId" = auth.uid()::TEXT
    AND NOT propanas.entry_is_locked("poolId", auth.uid()::TEXT)
  );

CREATE POLICY "top_scorer_update_self" ON public.top_scorer_predictions
  FOR UPDATE TO authenticated
  USING (
    "userId" = auth.uid()::TEXT
    AND NOT propanas.entry_is_locked("poolId", auth.uid()::TEXT)
  )
  WITH CHECK (
    "userId" = auth.uid()::TEXT
    AND NOT propanas.entry_is_locked("poolId", auth.uid()::TEXT)
  );

-- ═══════════════════════════════════════════════════════════
-- 15. overrides — members can read, admin writes
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "overrides_select_members" ON public.overrides
  FOR SELECT TO authenticated
  USING (propanas.is_member("poolId"));

CREATE POLICY "overrides_all_admins" ON public.overrides
  FOR ALL TO authenticated
  USING (propanas.is_admin("poolId"))
  WITH CHECK (propanas.is_admin("poolId"));

-- ═══════════════════════════════════════════════════════════
-- 16. audit_logs — admin reads, service_role writes (no user policies for INSERT)
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "audit_select_admins" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (propanas.is_admin("poolId"));

-- No INSERT/UPDATE/DELETE policies:
-- - INSERT only via service_role (recalc + admin actions)
-- - UPDATE/DELETE never (append-only)
