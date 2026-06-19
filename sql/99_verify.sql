-- ═══════════════════════════════════════════════════════════
-- ProPanas 2026 — RLS Verification Queries
--
-- Run these AFTER 01-05 to confirm everything is wired correctly.
-- Expected outputs documented inline.
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Confirm RLS enabled on all 21 tables ────────────
-- Expected: 21 rows, all with rowsecurity = true

SELECT
  tablename,
  rowsecurity AS rls_enabled,
  forcerowsecurity AS force_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'pools','pool_scoring_concepts','pool_behavior_flags','pool_deadlines',
    'users','user_profiles','pool_memberships','entries',
    'teams','matches','official_results','official_tournament_data',
    'predictions','top_scorer_predictions','overrides','audit_logs',
    'group_standings','best_thirds','bracket_slots','score_breakdowns','rankings'
  )
ORDER BY tablename;

-- ─── 2. List all policies by table ───────────────────────
-- Expected: multiple policies per table

SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ─── 3. Confirm helper functions exist ───────────────────
-- Expected: 4 rows

SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  t.typname AS return_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_type t ON t.oid = p.prorettype
WHERE n.nspname = 'propanas'
ORDER BY p.proname;

-- ─── 4. Confirm Realtime publications ────────────────────
-- Expected: 5 tables (rankings, official_results, bracket_slots, group_standings, entries)

SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
ORDER BY tablename;

-- ─── 5. Test as anonymous (should see nothing from private tables) ──
-- Run this in a session where auth.uid() returns NULL:

-- SET LOCAL role anon;
-- SELECT count(*) FROM public.predictions;       -- Expected: 0
-- SELECT count(*) FROM public.official_results;  -- Expected: 0
-- SELECT count(*) FROM public.rankings;           -- Expected: 0
-- RESET role;

-- ─── 6. Policy coverage matrix ───────────────────────────
-- Lists which tables have policies for each operation

SELECT
  tablename,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') AS select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') AS insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') AS update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') AS delete_policies,
  COUNT(*) FILTER (WHERE cmd = 'ALL') AS all_policies,
  COUNT(*) AS total
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
