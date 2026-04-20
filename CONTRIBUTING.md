# Contributing to Khaos Kontrol

Internal conventions consolidated during active development. These patterns exist because each one was born from a bug or a refactor — follow them and save yourself (and the user) pain.

Start with [CLAUDE.md](./CLAUDE.md) for the architectural overview. This document is the tactical layer: how to write code that doesn't break in production.

---

## 1. Edge Function invocation

**Use `invokeEdgeFunction` for any Edge Function that validates a user token.** Do NOT use `supabase.functions.invoke` directly for those.

```ts
import { invokeEdgeFunction } from '@/lib/invokeEdge'

const { data, error } = await invokeEdgeFunction<ResponseShape>(
  'lgpd-delete-account',
  { action: 'request', reason },
  { passUserToken: true },
)
```

**Why:** the Supabase API gateway (Kong) rejects ES256-signed user tokens with `UNSUPPORTED_TOKEN_ALGORITHM` before the function ever runs. `invokeEdgeFunction` authenticates the request with the anon key and passes the caller's access token in the body. The Edge Function then validates via `supabase.auth.getUser(body.user_token)`.

**When to use:**
- Any function that reads `user_token` from the body
- Admin-only functions (`admin-ghost-login`, `check-stripe-status`, `risc-setup`, etc.)
- User-context operations (`lgpd-*`, `google-calendar-sync`, `google-token-refresh`)

**When `supabase.functions.invoke` is fine:**
- Public endpoints (`send-application`, `send-booking-confirmed`)
- Functions authenticated via service role on the server side
- Stripe webhooks (no user context)

Edge Function side:
```ts
const authHeader = req.headers.get('Authorization')
const bearerFromHeader = authHeader?.replace('Bearer ', '') ?? null
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
const token =
  body.user_token ||
  (bearerFromHeader && bearerFromHeader !== anonKey ? bearerFromHeader : null)

if (!token) return json({ error: 'Missing user token' }, 401)

const { data: authData } = await supabase.auth.getUser(token)
const userId = authData?.user?.id
if (!userId) return json({ error: 'Invalid token' }, 401)
```

---

## 2. Realtime subscriptions

**Use `useRealtimeInvalidate` for every postgres_changes subscription.** Do NOT subscribe manually.

```ts
useRealtimeInvalidate({
  table: ['profiles', 'invoices', 'data_deletion_requests'],
  invalidate: [['admin-activity']],
  channelName: 'rt-admin-activity',
})
```

**Why:** manual `supabase.channel().on().subscribe()` in `useEffect` always leaks — either by not cleaning up, or by re-subscribing every render when the caller passes inline array literals. `useRealtimeInvalidate` derives stable string keys via `useMemo` and only re-subscribes when the content of `table`/`invalidate` actually changes.

**Add new tables to the publication** before subscribing. Create a migration:
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'your_table'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.your_table;
    ALTER TABLE public.your_table REPLICA IDENTITY FULL;
  END IF;
END $$;
```

`REPLICA IDENTITY FULL` ensures UPDATE/DELETE events carry the full row (not just PK).

---

## 3. Null-safe field access

**Assume any text field typed `string | null` in `types.ts` IS null somewhere in production.** Always guard before calling string methods.

```ts
// BAD — crashes if name is null (Paula saw this on /clientes)
{client.name.substring(0, 2).toUpperCase()}

// GOOD
{(client.name ?? '—').substring(0, 2).toUpperCase()}

// GOOD when you care about the empty case specifically
{client.name ? client.name.substring(0, 2).toUpperCase() : '??'}
```

**Nullable columns we've hit in the wild:**
- `wedding_clients.name`, `wedding_clients.full_name`
- `profiles.name`, `profiles.full_name`, `profiles.first_name`
- `leads.name`
- `services.name`, `services.title`
- `moodboard_images.title`

**Columns that are NOT null (safe to access directly):**
- `assistants.full_name`
- `projects.name`
- `events.title`
- `contracts.title`

When in doubt, check `src/integrations/supabase/types.ts` — if you see `string | null`, guard it.

---

## 4. Error handling in mutations

**Never expose raw `error.message` to users. Always log via the logger.**

```ts
// BAD
onError: (error) => {
  toast.error('Erro ao salvar: ' + error.message)
}

// GOOD
onError: (error) => {
  logger.error(error, 'featureName.operationName')
  toast.error('Não conseguimos salvar. Tente de novo em instantes.')
}
```

**Why:** raw error messages leak technical details to users (table names, SQL hints, stack fragments). They also make the app feel broken. `logger.error` routes to Sentry with full context; the toast stays friendly.

**Toast copy style:** direct, specific, action-oriented. "Não conseguimos [verbo] o [substantivo]. [O que o usuário pode fazer]."

---

## 5. Dropped tables — always verify

Before querying a table, verify it still exists in `src/integrations/supabase/types.ts`. The orphan cleanup migration `20260420000002_drop_orphan_tables.sql` removed 26 tables. Code referencing dropped tables compiles but crashes at runtime with `PGRST200` "relationship not found."

**Known dropped tables (DO NOT reference):**
- `plan_configs` → use `plan_limits` keyed by `plan_type`
- `assistants_legacy` → use `assistants`
- `team_members` → never existed here (the column `max_team_members` in `plan_limits` is unrelated)

When there's no FK between two tables, do a **manual join** client-side:
```ts
const { data: artist } = await supabase
  .from('makeup_artists')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle()

let planLimits = null
if (artist?.plan_type) {
  const { data } = await supabase
    .from('plan_limits')
    .select('features, max_clients, max_team_members')
    .eq('plan_type', artist.plan_type)
    .maybeSingle()
  planLimits = data
}
```

Do NOT try to add a new FK without strict data-cleanup first — existing rows may have values that break the constraint.

---

## 6. Admin RLS bypass

**Admin-visible tables need an explicit `is_admin()` bypass policy.**

```sql
CREATE POLICY "admins_select_all_<table>"
  ON public.<table> FOR SELECT
  USING (public.is_admin());
```

RLS policies are OR'd per-operation, so adding this does NOT relax existing restrictions for non-admins. The `is_admin()` helper lives in `base_schema.sql`.

**Without this policy:** admin queries come back empty because the existing user-scoped policies (`user_id = auth.uid()`) filter out other users' rows.

---

## 7. Prerender / SEO

Public routes get prerendered HTML via `@prerenderer/rollup-plugin` (`vite.config.ts`). The list of routes is `PRERENDER_ROUTES` at the top of that file. Adding a new public route:

1. Add the path to `PRERENDER_ROUTES`
2. Build locally — verify the generated `dist/<route>/index.html` has the right title/content
3. If the site is served via AWS Amplify, add a matching rewrite rule in Amplify Console:
   ```json
   { "source": "/<route>", "target": "/<route>/index.html", "status": "200" }
   ```
   Without the rewrite, Amplify's default SPA rule `</^[^.]+$/>` rewrites `/<route>` → `/index.html` before S3 can serve the prerendered file.
4. `SKIP_PRERENDER=1 npm run build` bypasses the prerender step for faster dev builds.

Puppeteer in Amplify's build env needs `launchOptions.args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']` — already set.

---

## 8. Admin critical alerts

**Three DB triggers email `khaoskontrol07` when things break** (migration `20260420000013_critical_alerts_triggers.sql`):
- `notify_payment_failed` — invoices → failed/overdue
- `notify_system_error` — system_logs level=error
- `notify_workflow_failed` — workflow_executions status=failed

Each is debounced 5 min via `critical_alert_cooldown` to prevent spam. If you log an error via `logger.error`, it lands in `system_logs` and triggers an alert. Be intentional about what you log at error level.

---

## 9. Commands you'll run often

```bash
npm run dev                 # port 8080
npm run build               # includes prerender (2 min) — SKIP_PRERENDER=1 to bypass
npm run lint                # eslint
npm run test                # vitest
npm run test:e2e            # playwright
npm run db:push:dev         # migrations → dev Supabase
npm run db:push:prod        # migrations → prod Supabase
npm run type-gen            # regen types from local schema — DO NOT hand-edit types.ts
ANALYZE=true npm run build  # opens bundle visualizer
```

**Deploying an Edge Function:**
```bash
npx supabase functions deploy <fn-name> --project-ref nqufpfpqtycxxqtnkkfh  # dev
npx supabase functions deploy <fn-name> --project-ref pymdkngcpbmcnayxieod  # prod
```

---

## 10. Industrial Noir copy rules

- No emojis anywhere — not in UI, not in toasts, not in email templates.
- No cyan accents, no rounded corners (`rounded-none` is the default here, not a typo).
- No fake/hardcoded data in dashboards. Empty states get a CTA linking to the action that fills them.
- Avoid UPPERCASE_SCREAMING copy in user-facing text (admin internal logs are exempt). Prefer serif for aspirational headlines, mono for technical labels, sans for prose.
- Error toasts: first-person plural, active voice ("Não conseguimos [verbo]…"). Never just "Erro X" or "Falha Y".

---

## 11. Testing essentials

E2E tests live under `e2e/` and use Playwright. Authenticated tests skip gracefully when `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` are unset:

```ts
test.skip(
  !email || !password,
  'E2E_USER_EMAIL and E2E_USER_PASSWORD must be set.',
)
```

Run a specific test file:
```bash
E2E_USER_EMAIL=... E2E_USER_PASSWORD=... npm run test:e2e -- e2e/lgpd-deletion.spec.ts
```

Unit tests use Vitest + jsdom and live next to the source file they cover. Keep the test boundary at user-visible behavior — test the hook's return shape, not its internal SQL.
