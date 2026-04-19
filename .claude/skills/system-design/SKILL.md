---
name: system-design
description: Architecture decisions for Khaos Kontrol — Supabase patterns, RLS, Edge Functions, React Query caching, real-time subscriptions, and performance. Use when designing new features, migrations, or debugging data flow issues.
---

# System Design — Khaos Kontrol Architecture

## Stack Overview

```
Frontend          React 18 + Vite (SWC) + TypeScript
Routing           React Router v6 (lazy pages)
State — server    TanStack Query v5 (staleTime: 5min, no refetch on focus)
State — UI        Zustand (sidebar, filters, UI toggles)
Backend           Supabase (Postgres + Auth + Storage + Edge Functions)
Styling           Tailwind CSS v3
Analytics         Custom useAnalytics hook → GA4
Payments          Stripe (embedded checkout)
Email             Resend / AWS SES
```

## Supabase Patterns

### Query Keys — Always Granular
```ts
// ✅ Include all filter params in key
queryKey: ['clients', organizationId, filters.status, filters.search]

// ❌ Too broad — over-invalidates
queryKey: ['clients']
```

### Invalidation After Mutation
```ts
onSuccess: () => {
  // Invalidate exactly what changed
  queryClient.invalidateQueries({ queryKey: ['clients', organizationId] })
  queryClient.invalidateQueries({ queryKey: ['client-stats'] })
}
```

### Real-time Subscriptions — Cleanup Required
```ts
useEffect(() => {
  const channel = supabase
    .channel('unique-channel-name')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, 
      () => queryClient.invalidateQueries({ queryKey: ['events'] }))
    .subscribe()

  return () => { supabase.removeChannel(channel) } // Always cleanup
}, [queryClient])
```

### Edge Functions
```ts
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { param1, param2 }
})
if (error) throw error
```

Available Edge Functions:
- `create-checkout-session` — Stripe checkout
- `verify-payment` — confirm Stripe payment
- `google-calendar-sync` — Calendar sync
- `check-stripe-status` / `check-ses-status` — health checks
- `send-marketing-campaign` — email blast
- `admin-ghost-login` — admin impersonation

### Column Type Gotcha
The `profiles.created_at` column is stored as `text` (not `timestamp`). Never use Postgres `>=` timestamp comparisons on it — compare text-to-text with ISO strings:
```ts
// ✅ Text-to-text comparison
.gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
```

## RLS Architecture

RLS filters happen at the DB level. Org isolation pattern:
```sql
-- Policy: users see only their org's data
CREATE POLICY "org_isolation" ON wedding_clients
  USING (user_id = auth.uid() OR user_id IN (
    SELECT user_id FROM assistants WHERE id = auth.uid()
  ));
```

Never rely on application-level filters when RLS is in place — it's redundant. Only add `.eq('user_id', id)` when RLS is not configured for that table.

## Performance Patterns

### Code Splitting — All Pages Lazy
```ts
const ClientsPage = lazy(() => import('@/features/clients/pages/ClientsPage'))
// Wrap in <Suspense fallback={<PageLoader />}>
```

### Avoid N+1 Queries — Use Joins
```ts
// ❌ N+1
const clients = await getClients()
for (const client of clients) {
  client.projects = await getProjects(client.id) // N extra queries
}

// ✅ Single query with join
supabase.from('wedding_clients').select('*, projects(id, name, status)')
```

### Batch Fetch — Never Loop Supabase Calls
```ts
// ❌ N calls in parallel (N+1 pattern)
await Promise.all(ids.map(id => supabase.from('profiles').select('*').eq('id', id)))

// ✅ One call with .in()
await supabase.from('profiles').select('id, full_name, email').in('id', ids)
```

## Data Flow

```
User action
  → Component calls useMutation hook
  → Mutation calls Supabase (create/update/delete)
  → onSuccess: invalidateQueries
  → React Query refetches affected queries
  → UI re-renders with fresh data
```

## Environment Separation

| | Dev | Prod |
|---|---|---|
| Supabase | `nqufpfpqtycxxqtnkkfh` | `pymdkngcpbmcnayxieod` |
| Push migrations | `npm run db:push:dev` | `npm run db:push:prod` |
| Regen types | `npm run type-gen` | — |
