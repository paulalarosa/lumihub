# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lumihub / Khaos Kontrol** is a high-end CRM/ERP for the wedding industry with an "Industrial Noir" aesthetic. It is a React SPA backed by Supabase (PostgreSQL, Auth, Storage, Edge Functions).

## Commands

**Use npm only** — the project enforces this via `preinstall`. Do not use yarn, pnpm, or bun.

```bash
npm run dev          # Dev server on port 8080
npm run build        # TypeScript check + Vite build + copy 404.html
npm run lint         # ESLint
npm test             # Vitest (unit tests, jsdom)
npm run test:e2e     # Playwright E2E tests
npm run coverage     # Vitest with coverage
npm run type-gen     # Regenerate Supabase TypeScript types from local schema
npm run db:push:dev  # Push migrations to dev Supabase project
npm run db:push:prod # Push migrations to prod Supabase project
```

To run a single Vitest test file:
```bash
npx vitest run src/utils/format.test.ts
```

To analyze the production bundle:
```bash
ANALYZE=true npm run build
```

## Architecture

### Directory Structure

```
src/
  features/       # Domain-driven feature modules (main business logic)
  components/     # Shared/reusable components (UI atoms, layouts, AI elements)
  hooks/          # Shared hooks (useAuth, useRole, usePlanAccess, etc.)
  stores/         # Zustand stores (client-side state only)
  lib/            # Utilities, queryClient, i18n, sentry, env
  integrations/supabase/  # Supabase client + generated types
  contexts/       # React contexts (Auth, AI, Language, Analytics)
  services/       # Business logic services (stripe, analytics, logger, etc.)
  pages/          # Marketing/public pages (thin route-level components)
  types/          # Shared TypeScript interfaces
supabase/
  functions/      # Deno Edge Functions (one directory per function)
  migrations/     # SQL migration files
```

### Feature Modules (`src/features/`)

Each feature follows a consistent structure with `pages/`, `components/`, `hooks/`, and `api/` subdirectories:

- `admin` — Admin panel (users, subscriptions, logs, config)
- `ai` — AI chat canvas and Khaos Agent
- `assistant-portal` — Portal for assistants (upgrade flow, shadow accounts)
- `assistants` — Manage the professional's team of assistants
- `auth` — Login, register, MFA, password reset
- `calendar` — Event calendar (react-big-calendar + Google Calendar sync)
- `clients` — Client management (wedding clients table)
- `contracts` — Contract editor, signature, PDF generation
- `dashboard` — Main app dashboard with metrics
- `financial` — Revenue, billing, transactions
- `microsite` — Public-facing microsite editor for professionals
- `pipeline` — Sales pipeline / lead management
- `portal` — Client-facing portal (bride dashboard)
- `projects` — Project/event management
- `public-booking` — Public booking form via `/b/:slug`

### State Management

- **Server state**: TanStack Query v5 (`@tanstack/react-query`). Default stale time is 5 minutes, no refetch on window focus. Always use `useQuery`/`useMutation` for Supabase data. QueryClient is instantiated in `App.tsx`.
- **Client/UI state**: Zustand stores in `src/stores/` (e.g., `useUIStore` for sidebar/search, `useClientFilterStore` for filters).
- Do **not** use `useEffect` to fetch data — always use React Query.

### Path Alias

`@/` maps to `src/`. Always use this alias for imports within the project.

### Authentication & Roles

- Auth is managed via `AuthContext` (`src/contexts/AuthContext.tsx`) wrapping the whole app.
- Use `useAuth()` hook to access the current user.
- Roles are determined by checking Supabase tables (`makeup_artists`, `assistants`) via `useRole()`.
- Feature access and plan limits are checked via `usePlanAccess()` which calls Supabase RPC functions `check_feature_access` and `check_usage_limit`.
- Route protection: `<ProtectedRoute>` for authenticated users, `<AdminRoute>` for admin-only routes.

### Supabase Integration

- Client is in `src/integrations/supabase/client.ts` — import `supabase` from there.
- Generated TypeScript types are in `src/integrations/supabase/types.ts` — regenerate with `npm run type-gen` after schema changes.
- **Always validate that columns exist in the schema before writing queries.** Do not assume columns exist — check `types.ts` first.
- RLS is enabled on all user-data tables. Edge Functions are Deno-based (TypeScript) in `supabase/functions/`.
- Two Supabase environments: **dev** (`nqufpfpqtycxxqtnkkfh`) and **prod** (`pymdkngcpbmcnayxieod`).

### Environment Variables

Required in `.env` (validated at startup via Zod in `src/lib/env.ts`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:
- `VITE_GOOGLE_CLIENT_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_SENTRY_DSN`, `VITE_GOOGLE_MAPS_API_KEY`

### Error Handling & Observability

- Use the `logger` service (`src/services/logger.ts`) for all errors, not `console.error` directly. It integrates with Sentry.
- Critical actions (delete, financial updates) must write to `system_logs` or `audit_logs` tables.
- All async functions must have `try/catch` with user-facing toast feedback (via `sonner`).
- `import.meta.env.DEV` — debug-only UI elements must be gated behind this check.

### Code Standards

- **No `any`** in TypeScript — define explicit interfaces for all data shapes.
- Wrap heavy components (tables, charts) with loading skeleton states and empty state handling.
- All pages use `React.lazy()` + `<Suspense>` for code splitting.
- `console.log` / `debugger` are stripped from production builds automatically by esbuild.

### Testing

- Unit tests use Vitest with jsdom environment. Test setup: `src/test/setup.ts`.
- Test files co-located with source (e.g., `src/utils/format.test.ts`) or in `src/test/`.
- E2E tests use Playwright.
- Exclude `e2e/` from Vitest, exclude `node_modules/` and `dist/` from both.

### Deployment

- Deployed to AWS S3 + CloudFront via `npm run deploy`.
- CI/CD via GitHub Actions (`.github/workflows/`), requires Node ≥ 20.
