-- ═══════════════════════════════════════════════════════════
-- ProPanas 2026 — Enable Row Level Security
--
-- Turns RLS on for all 21 tables from schema v4.
-- Without policies, RLS-enabled tables deny ALL access
-- (except service_role, which always bypasses RLS).
--
-- Run order: 01 → 02 → 03 → 04 → 05
-- Run this SECOND.
-- ═══════════════════════════════════════════════════════════

-- ─── Source of Truth (16 tables) ─────────────────────────
ALTER TABLE public.pools                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_scoring_concepts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_behavior_flags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_deadlines             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_memberships           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_results           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_tournament_data   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_scorer_predictions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overrides                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs                 ENABLE ROW LEVEL SECURITY;

-- ─── Derived State (5 tables) ────────────────────────────
ALTER TABLE public.group_standings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.best_thirds                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_slots              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_breakdowns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings                   ENABLE ROW LEVEL SECURITY;

-- ─── Force RLS on table owners too ───────────────────────
-- By default, the table owner bypasses RLS. In Supabase the owner
-- is the `postgres` superuser which is fine, but we force it
-- anyway for defense-in-depth. service_role still bypasses.

ALTER TABLE public.pools                      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pool_scoring_concepts      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pool_behavior_flags        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pool_deadlines             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.users                      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles              FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pool_memberships           FORCE ROW LEVEL SECURITY;
ALTER TABLE public.entries                    FORCE ROW LEVEL SECURITY;
ALTER TABLE public.teams                      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.matches                    FORCE ROW LEVEL SECURITY;
ALTER TABLE public.official_results           FORCE ROW LEVEL SECURITY;
ALTER TABLE public.official_tournament_data   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.predictions                FORCE ROW LEVEL SECURITY;
ALTER TABLE public.top_scorer_predictions     FORCE ROW LEVEL SECURITY;
ALTER TABLE public.overrides                  FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs                 FORCE ROW LEVEL SECURITY;
ALTER TABLE public.group_standings            FORCE ROW LEVEL SECURITY;
ALTER TABLE public.best_thirds                FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_slots              FORCE ROW LEVEL SECURITY;
ALTER TABLE public.score_breakdowns           FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rankings                   FORCE ROW LEVEL SECURITY;
