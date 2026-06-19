# ProPanas 2026 — UI Wiring Package

Replaces demo data in all pages with real data from Prisma + API routes + Supabase Realtime.

## 📦 What this package does

Every page previously shipped with hardcoded demo arrays (`DEMO_RANKING`, `DEMO_MATCHES`, `DEMO_BREAKDOWN`, etc.). This package rewrites them to:

- **Reads** → Server Components that call Prisma directly via `lib/data/queries.ts` (zero HTTP hops, RLS respected via the session cookie)
- **Writes** → Client Components that `fetch` to `/api/*` routes via `lib/api/client.ts` (typed, Spanish error messages)
- **Live updates** → `useRankingsLive` hook that subscribes to Supabase Realtime broadcasts on the `rankings` table

## 🏗️ Architecture pattern

Every interactive page follows this split:

```
app/(participant)/groups/
├── page.tsx            ← Server Component
│                         1. Reads cookie session
│                         2. Queries Prisma via lib/data/queries
│                         3. Passes data as props to Client Component
│
└── groups-client.tsx   ← Client Component
                          1. Receives initial data from server
                          2. Handles local state (score inputs)
                          3. Mutates via lib/api/client (POST/PUT to /api/*)
                          4. Calls router.refresh() to re-fetch server data
```

### Why this split

| Concern | Server side | Client side |
|---------|-------------|-------------|
| Session cookie reading | ✅ Natural | ❌ Impossible |
| Prisma queries | ✅ Direct | ❌ Not allowed |
| RLS enforcement | ✅ Via cookie | ✅ Via cookie (for /api/* calls) |
| Loading states | ❌ Blocks page | ✅ Granular per mutation |
| Form state | ❌ Requires server actions | ✅ Idiomatic `useState` |
| Supabase Realtime | ❌ No subscriptions | ✅ `useEffect` subscribe |

### Data flow for a mutation

```
1. User changes score in MatchCard
2. onBlur fires in groups-client.tsx
3. updatePrediction() → fetch PUT /api/predictions
4. API route runs:
   - requireAuth (checks cookie session + pool membership)
   - Deadline check (D6: MATCH > PHASE > GLOBAL)
   - Cascade detection (D2): returns {requiresConfirmation:true} if group-phase change affects bracket
   - If confirmed: UPDATE prediction, INVALIDATE affected downstream
   - Returns JSON success
5. Client calls router.refresh()
6. Server Component re-renders with fresh Prisma data
7. Updated state flows back to client props
```

## 📁 Files in this package (24)

### Data layer (4 files)

```
lib/
├── data/
│   ├── types.ts              Shared types across server and client
│   └── queries.ts            Server-side Prisma queries (10 functions)
├── api/
│   └── client.ts             Client-side typed fetch wrappers + error translation
└── hooks/
    └── use-rankings-live.ts  Supabase Realtime subscription hook
```

### Wired pages (16 files)

```
app/
├── (participant)/
│   ├── loading.tsx                    (new)
│   ├── error.tsx                      (new)
│   ├── dashboard/page.tsx             (rewritten — real stats)
│   ├── groups/
│   │   ├── page.tsx                   (rewritten — server fetch)
│   │   └── groups-client.tsx          (new — cascade-aware)
│   ├── leaderboard/
│   │   ├── page.tsx                   (rewritten — server fetch)
│   │   └── leaderboard-live.tsx       (new — Realtime)
│   ├── breakdown/[userId]/page.tsx    (rewritten — real breakdown)
│   ├── bracket/
│   │   ├── page.tsx                   (rewritten — server fetch)
│   │   └── bracket-client.tsx         (new — view toggle)
│   └── profile/
│       ├── page.tsx                   (rewritten — server fetch)
│       └── profile-form.tsx           (new — submit/unsubmit/scorer)
└── (admin)/
    ├── loading.tsx                    (new)
    ├── error.tsx                      (new)
    ├── dashboard/
    │   ├── page.tsx                   (rewritten — real stats)
    │   └── rebuild-button.tsx         (new — triggers full rebuild)
    ├── results/
    │   ├── page.tsx                   (rewritten — pending matches)
    │   └── results-form.tsx           (new — load + recalc)
    ├── config/
    │   ├── page.tsx                   (rewritten — current config)
    │   └── config-form.tsx            (new — D3 exclusion enforced)
    ├── overrides/
    │   ├── page.tsx                   (new — real teams + overrides)
    │   └── overrides-form.tsx         (new — group + thirds)
    └── audit/page.tsx                 (rewritten — real log with filters)
```

### New API routes (2 files)

The original 8 API routes don't cover entry lifecycle transitions that `profile-form.tsx` needs. Added:

```
app/api/entries/
├── submit/route.ts        POST — transitions DRAFT → SUBMITTED
└── unsubmit/route.ts      POST — transitions SUBMITTED → DRAFT (if no deadline passed)
```

## 🔌 Integration checklist

### 1. Copy files into your Next.js project

```bash
# From this package, copy everything into your project root:
cp -r wiring-pkg/lib/*    your-project/lib/
cp -r wiring-pkg/app/*    your-project/app/
```

Most `app/*` files overwrite demo versions. Review git diffs — you're replacing the demo `DEMO_MATCHES`/`DEMO_RANKING` constants with real queries.

### 2. Verify required imports exist

This package assumes these files are already present (from previous deliverables):

- `@/lib/db/client` — exports `prisma` singleton
- `@/lib/supabase/clients` — exports `getSessionUser`, `createBrowserSupabase`
- `@/lib/supabase/auth-context` — exports `useAuth` hook
- `@/lib/auth` — exports `requireAuth`, `isAuthError`
- `@/components/ui` — exports all visual components
- `@/lib/domain/tournament/fifa-matrix` — exports `validateMatrixCompleteness`

If any are missing, re-apply the earlier packages (`ProPanas2026_Auth_Wiring`, `ProPanas2026_Backend_Complete`, `ProPanas2026_UI_Complete`, `ProPanas2026_FIFA_Matrix`).

### 3. Verify Prisma relations

Some queries assume specific relation names. Spot-check `schema.prisma`:

- `Entry.displayName` — snapshot field used by leaderboard
- `Match.homeTeam` / `Match.awayTeam` / `Match.result` / `Match.predictions` — included relations
- `AuditLog.actor` — FK to User for actor display name
- `User.displayName` — fallback when entry.displayName is null

### 4. Verify Realtime is enabled

From the RLS package (`ProPanas2026_RLS_Policies/sql/05_realtime_publications.sql`), confirm the `rankings` table is in the `supabase_realtime` publication:

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'rankings';
```

Without this, the leaderboard's live updates won't broadcast.

### 5. Run end-to-end smoke test

```bash
npm run dev
```

Test flow:
1. Log in as a PARTICIPANT
2. `/dashboard` should show real stats (not hardcoded "Miguel Pérez" / 147 pts)
3. `/groups?group=A` — change a score, tab away → "Guardando..." → "✓ Guardado"
4. `/leaderboard` — shows the pulsing "En vivo" indicator
5. Open a second browser as ADMIN → `/admin/results` → load a result
6. First browser (`/leaderboard` still open) → position updates in real time via Realtime broadcast
7. `/profile` → "Enviar quiniela final" → status changes to SUBMITTED

## 🎯 Key patterns worth calling out

### Cascade confirmation (D2)

`groups-client.tsx` implements the UX required by spec decision D2:

```typescript
// First call — no confirmation
const result = await updatePrediction({ matchId, homeGoals, awayGoals });

// If server detects cascade impact, it returns without saving:
if ('requiresConfirmation' in result) {
  // Show modal listing affected slots
  setPendingCascade({ matchId, input, preview: result.cascade });
  return;
}

// User clicks "Confirmar" → second call with flag
await updatePrediction({ matchId, homeGoals, awayGoals, confirmCascade: true });
// → server now invalidates downstream + persists
```

### Optimistic UI with server refresh

After any mutation, we call `router.refresh()`. Next.js re-runs the Server Component (new Prisma query) and diffs the result against the tree. The client-side `useState` for the score inputs keeps the local value while the server data refreshes in the background.

### Error translation

`lib/api/client.ts` exports `translateError(err)` that maps API error messages to Spanish user-facing strings. Each form catches errors and surfaces via the `error` state + `Card accent="danger"` UI.

### Authorization split

- Middleware redirects unauthenticated → `/login`
- Layout verifies role (ADMIN routes redirect non-admins to `/dashboard`)
- API routes double-check via `requireAuth(req, 'ADMIN')`
- RLS policies provide a third layer of defense in the database

Every request goes through all three layers.

## 🐛 Known edge cases handled

| Case | Behavior |
|------|----------|
| User has no ranking yet (0 results loaded) | `/dashboard` shows position `–` and 0 points |
| User views leaderboard before any predictions exist | Empty state card with helpful message |
| User changes group match after deadline | API returns 403, form shows "Este partido está cerrado" |
| User confirms cascade but already locked | API re-checks lock, returns 403 before invalidating |
| Admin loads result mid-game → penalty required | Form detects `isKnockout && isTied`, shows penalty inputs inline |
| Realtime connection drops | Hook sets `connected=false`, UI shows gray dot + "Reconectando..." |
| FIFA matrix has missing entry | Dashboard shows warning banner listing missing combinations |
| Entry submitted but deadline passed → cannot unsubmit | `canUnsubmit` computed on server, button hidden |

## 🚧 What this doesn't cover

Deliberately out of scope for this delivery:

- **Public routes (`/fixtures`, `/teams`)** — still use demo data. They need wiring but are read-only and less critical
- **E2E tests** — not included, but the typed API client makes them straightforward to write
- **Optimistic rollback** — on network error we show the error but don't revert local input; user can retry
- **Bulk predictions import** — add one-at-a-time only
- **Attachments in audit log** — not exposed in UI yet

## 📚 Related packages

- `ProPanas2026_Backend_Complete.zip` — API routes + recalculator
- `ProPanas2026_Auth_Wiring.zip` — Supabase Auth + middleware + shells
- `ProPanas2026_UI_Complete.zip` — Visual components (unchanged)
- `ProPanas2026_RLS_Policies.zip` — Database security policies
- `ProPanas2026_PWA.zip` — Service worker + install prompts
- `ProPanas2026_FIFA_Matrix.zip` — Third-place lookup (493/495 entries)
