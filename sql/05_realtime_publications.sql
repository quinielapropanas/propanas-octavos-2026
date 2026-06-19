-- ═══════════════════════════════════════════════════════════
-- ProPanas 2026 — Supabase Realtime Configuration
--
-- Enables Realtime subscriptions on tables where we need
-- near real-time updates to all connected clients.
--
-- Per spec decision D11: "Near real-time via Supabase Realtime"
--
-- Run this FIFTH (after all RLS policies are in place).
-- RLS policies are respected by Realtime, so users only
-- receive broadcasts for rows they're allowed to SELECT.
-- ═══════════════════════════════════════════════════════════

-- Create or use the default Realtime publication
-- (Supabase creates `supabase_realtime` by default; we add tables to it)

-- ─── Rankings: live leaderboard updates ─────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.rankings;

-- ─── Official results: live score tickers ───────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.official_results;

-- ─── Bracket slots: bracket propagation in real-time ────
ALTER PUBLICATION supabase_realtime ADD TABLE public.bracket_slots;

-- ─── Group standings: live standings tables ─────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_standings;

-- ─── Entries: so participants see their own status updates ─
ALTER PUBLICATION supabase_realtime ADD TABLE public.entries;

-- ═══════════════════════════════════════════════════════════
-- NOTES:
-- ═══════════════════════════════════════════════════════════
--
-- Realtime respects RLS policies. The subscriptions below work correctly:
--
--   Client subscribes to `rankings` WHERE poolId = X
--   → Supabase checks user has SELECT policy match for each row
--   → Only broadcasts rows the user can read
--
-- We do NOT expose predictions or score_breakdowns via Realtime
-- because they're private per-user and the UI fetches them on demand.
-- Exposing them would leak write patterns to other users.
--
-- audit_logs is deliberately excluded from Realtime to avoid
-- performance issues (high write volume) and information disclosure.
-- ═══════════════════════════════════════════════════════════
