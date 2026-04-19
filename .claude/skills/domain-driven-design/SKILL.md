---
name: domain-driven-design
description: Apply DDD principles to Khaos Kontrol feature modules. Use when creating new features, hooks, or deciding where code belongs. Helps determine if something is a domain service, application service, or UI concern.
---

# Domain-Driven Design — Khaos Kontrol

## Bounded Contexts (Feature Modules)

Each `src/features/<domain>/` is an isolated bounded context:

| Domain | Responsibility | Key Entities |
|--------|---------------|--------------|
| `clients` | Wedding clients lifecycle | WeddingClient, ClientPortal |
| `calendar` | Events and scheduling | Event, StudioCalendar |
| `contracts` | Digital contracts + signatures | Contract, ContractTemplate |
| `financial` | Revenue and billing | Transaction, Invoice |
| `assistants` | Team management | Assistant, AssistantAccess |
| `projects` | Event project management | Project, ProjectService |
| `pipeline` | Lead funnel | Lead, PipelineStage |
| `portal` | Client-facing portal | BrideDashboard |
| `microsite` | Public professional profile | Microsite |
| `billing` | Payment processing | Checkout, Subscription |
| `admin` | Platform administration | AdminStats, AdminUser |

## Ubiquitous Language

Use these domain terms consistently in code:
- **Profissional** = the makeup artist (maps to `profiles` table)
- **Cliente / Noiva** = the client (maps to `wedding_clients`)
- **Assistente** = team member (maps to `assistants`)
- **Organização** = the professional's workspace (maps to `organization_id`)
- **Evento** = calendar event (maps to `events`)
- **Projeto** = event project (maps to `projects`)
- **Contrato** = digital contract (maps to `contracts`)

## Layered Architecture Per Feature

```
src/features/<domain>/
  pages/          # Application layer — thin, wires hooks to UI
  components/     # Presentation layer — pure UI
  hooks/          # Application services — useQuery/useMutation wrappers
  api/            # Domain services — raw Supabase calls
```

**Rule**: Pages never call Supabase directly. Components never call hooks that fetch data. Domain logic stays in `hooks/` or `api/`.

## Where to Put New Code

| Question | Answer |
|----------|--------|
| "Is this a new page route?" | `features/<domain>/pages/` |
| "Is this a form or display component?" | `features/<domain>/components/` |
| "Is this fetching or mutating data?" | `features/<domain>/hooks/use<Domain><Action>.ts` |
| "Is this pure Supabase query logic?" | `features/<domain>/api/<domain>Api.ts` |
| "Is this used across 2+ domains?" | `src/hooks/` or `src/services/` |
| "Is this a UI utility?" | `src/components/ui/` |

## Aggregates

Each entity owns its data. Never bypass aggregate boundaries:
```ts
// ❌ Querying assistants from client context
supabase.from('assistants').select('*').eq('user_id', clientOwnerId)

// ✅ Use the domain's own hook
const { assistants } = useAssistants() // owns the query
```

## Cross-Context Communication

Contexts communicate via shared IDs, not shared objects:
```ts
// ✅ Calendar links to Client by ID only
const { data: event } = useQuery({
  queryKey: ['event', eventId],
  queryFn: () => supabase.from('events').select('*, wedding_clients(name)').eq('id', eventId)
})
```

## RLS = Domain Boundary Enforcement

Supabase RLS policies enforce the domain rules at the database level. Never duplicate this logic in the application layer — trust RLS:
```ts
// No need to filter by user_id if RLS does it automatically
const { data } = await supabase.from('wedding_clients').select('*') // RLS filters automatically
```
