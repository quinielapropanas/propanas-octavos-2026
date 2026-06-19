# ProPanas 2026 — RLS Deployment Guide

Row Level Security (RLS) policies for all 21 tables, aligned with spec section 5.3.

## 📁 Files

| File | Purpose |
|------|---------|
| `01_helper_functions.sql` | Reusable functions: `is_member`, `is_admin`, `entry_is_locked` |
| `02_enable_rls.sql` | Enables RLS on all 21 tables (+ FORCE RLS) |
| `03_policies_source.sql` | Policies for 16 source-of-truth tables |
| `04_policies_derived.sql` | Policies for 5 derived-state tables |
| `05_realtime_publications.sql` | Exposes rankings, results, bracket for Realtime |
| `99_verify.sql` | Verification queries — run after deployment |

## 🚀 Deployment

### Step 1: Run migrations first

Make sure Prisma migrations have run and all 21 tables exist:

```bash
npx prisma migrate deploy
npx tsx prisma/seeds/index.ts
```

### Step 2: Run SQL files in order

**Option A — Supabase SQL Editor** (recommended for dev):

1. Open Supabase Dashboard → SQL Editor
2. Paste each file's contents in order (01 → 02 → 03 → 04 → 05)
3. Click **Run** for each

**Option B — psql via DIRECT_URL**:

```bash
export PGPASSWORD="your-db-password"
PSQL="psql $DIRECT_URL"

$PSQL -f sql/01_helper_functions.sql
$PSQL -f sql/02_enable_rls.sql
$PSQL -f sql/03_policies_source.sql
$PSQL -f sql/04_policies_derived.sql
$PSQL -f sql/05_realtime_publications.sql
```

### Step 3: Verify

```bash
$PSQL -f sql/99_verify.sql
```

Expected outputs:
- Query 1: 21 rows, all `rls_enabled = true`, all `force_rls = true`
- Query 2: ~50+ policies across all tables
- Query 3: 4 functions in `propanas` schema
- Query 4: 5 tables in `supabase_realtime` publication

## 🔒 Policy Summary

| Table | Read | Write |
|-------|------|-------|
| `pools` | Members | Admins (update only) |
| `pool_scoring_concepts` | Members | Admins |
| `pool_behavior_flags` | Members | Admins |
| `pool_deadlines` | Members | Admins |
| `users` | Self + pool co-members | Self (update only) |
| `user_profiles` | Self + admins | Self |
| `pool_memberships` | Self + admins | Admins |
| `entries` | Self + admins | Self (if not LOCKED) + admins |
| `teams` | Members | Service role only |
| `matches` | Members | Service role only |
| `official_results` | Members | Admins (insert/update) |
| `official_tournament_data` | Members | Admins |
| `predictions` | Self + admins | Self (if entry not LOCKED) |
| `top_scorer_predictions` | Self + admins | Self (if entry not LOCKED) |
| `overrides` | Members | Admins |
| `audit_logs` | Admins | Service role only |
| `group_standings` | Members (OFFICIAL) + self (PARTICIPANT) + admins | Service role only |
| `best_thirds` | Same pattern | Service role only |
| `bracket_slots` | Same pattern | Service role only |
| `score_breakdowns` | Self + admins | Service role only |
| `rankings` | Members | Service role only |

## 🎯 Architecture Notes

### service_role bypasses RLS

The backend uses TWO Supabase clients (per spec 5.3):

1. **User client** (anon key + cookies): respects RLS, used for participant queries
2. **Service role client** (service_role key): bypasses RLS, used by:
   - Recalculator (writes derived state)
   - Audit log writer
   - User sync (creates Users from Supabase Auth signups)

### No custom claims

Roles are resolved from `pool_memberships` table via `propanas.is_admin(pool_id)`,
not from JWT claims. This matches spec decision: "Custom claims: NO usados en MVP."

### Defense in depth

Even with RLS enabled, the app layer enforces business rules (deadlines, cascade,
exclusion). RLS is the secondary defense — it prevents data leaks even if the
app layer has a bug.

## 🐛 Troubleshooting

### "permission denied for table X"

The user's JWT cookies are missing or expired. Check:
1. `middleware.ts` is running (refreshes cookies)
2. User is actually logged in (`supabase.auth.getUser()` returns user)
3. User has `pool_memberships` row with `status = 'ACTIVE'`

### Policies not applying

```sql
-- Reset role and test
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM predictions;  -- Should only show own rows
RESET ROLE;
```

### Realtime not broadcasting

Verify table is in publication:
```sql
SELECT * FROM pg_publication_tables WHERE tablename = 'rankings';
```

And that the client subscribes with RLS auth context:
```js
supabase.channel('rankings')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'rankings' }, handler)
  .subscribe();
```

## 📚 References

- Spec section 5.3 — Security strategy (two layers)
- Spec section 5.4 — Locking policy
- [Supabase RLS docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
