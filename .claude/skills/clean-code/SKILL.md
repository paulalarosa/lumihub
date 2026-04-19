---
name: clean-code
description: Enforce Khaos Kontrol code standards — no any types, no console.log, React Query for data, Zustand for UI state, logger service for errors, toast for user feedback. Use when writing or reviewing TypeScript/React code.
---

# Clean Code — Khaos Kontrol Standards

## TypeScript

**No `any`** — always define the shape:
```ts
// ❌
const handler = (data: any) => {}

// ✅
interface ClientRow { id: string; name: string; email: string | null }
const handler = (data: ClientRow) => {}
```

**Explicit return types on exported functions:**
```ts
export function useClientActions(): ClientActions { ... }
```

**Null handling** — use `??` not `||` for falsy defaults:
```ts
const name = client.name ?? 'Sem nome'
```

## Data Fetching — React Query Only

Never `useEffect` + `useState` for remote data:
```ts
// ❌ Never
useEffect(() => { fetchClients().then(setClients) }, [])

// ✅ Always
const { data: clients = [], isLoading } = useQuery({
  queryKey: ['clients', organizationId],
  queryFn: () => supabase.from('wedding_clients').select('*'),
  enabled: !!organizationId,
})
```

## Error Handling

```ts
// ❌
console.error('Erro:', err)

// ✅
import { logger } from '@/services/logger'
import { toast } from 'sonner'

try {
  await action()
  toast.success('Mensagem de sucesso')
} catch (err) {
  logger.error(err, 'ComponentName.actionName', { showToast: false })
  toast.error('Mensagem amigável para o usuário')
}
```

## Mutations — always invalidate after success

```ts
const mutation = useMutation({
  mutationFn: async (data) => {
    const { error } = await supabase.from('table').insert(data)
    if (error) throw error
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] })
    toast.success('Salvo com sucesso')
  },
  onError: (err) => {
    logger.error(err, 'MutationName')
    toast.error('Erro ao salvar')
  },
})
```

## Component Structure

```tsx
// Order: imports → interfaces → component → exports
// No default + named export on same component
// Lazy load pages: const Page = lazy(() => import('./Page'))

export function ComponentName({ prop1, prop2 }: Props) {
  // 1. hooks
  // 2. derived state (useMemo/useCallback)
  // 3. handlers
  // 4. early returns (loading, empty, error)
  // 5. main render
}
```

## Path Aliases

Always `@/` — never relative paths across feature boundaries:
```ts
// ❌ import { supabase } from '../../../integrations/supabase/client'
// ✅ import { supabase } from '@/integrations/supabase/client'
```

## Supabase Patterns

Always check `types.ts` before querying:
```ts
// Before writing: grep the column name in src/integrations/supabase/types.ts
// Never assume a column exists
const { data, error } = await supabase
  .from('wedding_clients')
  .select('id, name, email, phone, wedding_date')
  .eq('user_id', organizationId)
  .order('created_at', { ascending: false })

if (error) throw error
```

## Comments

Write zero comments unless the WHY is non-obvious:
```ts
// ❌ // Fetch clients from database
// ✅ // Supabase RLS filters by org automatically — no need to filter by user_id here
```
