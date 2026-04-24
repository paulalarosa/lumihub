# GEMINI.md

This file provides guidance to Gemini CLI when working with code in this repository.

## Project Overview

**Lumihub / Khaos Kontrol** is a high-end CRM/ERP for the wedding industry with an "Industrial Noir" aesthetic. React SPA backed by Supabase (PostgreSQL, Auth, Storage, Edge Functions).

## Commands

**Use npm only** — enforced via `preinstall`. Do not use yarn, pnpm, or bun.

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

Run a single Vitest test file:
```bash
npx vitest run src/utils/format.test.ts
```

Analyze production bundle:
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

- **Server state**: TanStack Query v5. Default stale time 5 min, no refetch on window focus. Always use `useQuery`/`useMutation` for Supabase data. Do **not** use `useEffect` to fetch data.
- **Client/UI state**: Zustand stores in `src/stores/`.

### Path Alias

`@/` maps to `src/`. Always use this alias for imports within the project.

### Authentication & Roles

- Auth via `AuthContext` — use `useAuth()` to access the current user.
- Roles determined by checking Supabase tables (`makeup_artists`, `assistants`) via `useRole()`.
- Feature access and plan limits via `usePlanAccess()` — calls Supabase RPC `check_feature_access` and `check_usage_limit`.
- Route protection: `<ProtectedRoute>` for authenticated users, `<AdminRoute>` for admin-only.

### Supabase

- Client: `src/integrations/supabase/client.ts`.
- Generated types: `src/integrations/supabase/types.ts` — regenerate with `npm run type-gen` after schema changes.
- **Validate that columns exist in `types.ts` before writing queries.**
- RLS enabled on all user-data tables.
- Two environments: **dev** (`nqufpfpqtycxxqtnkkfh`) and **prod** (`pymdkngcpbmcnayxieod`).

### Environment Variables

Required (validated at startup via Zod in `src/lib/env.ts`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional: `VITE_GOOGLE_CLIENT_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_SENTRY_DSN`

Google Maps Places é server-side only: secret `GOOGLE_MAPS_API_KEY` nas edge functions (passa pelo `places-proxy`, não vai pro bundle do browser).

### Error Handling & Observability

- Use `logger` service (`src/services/logger.ts`) for all errors — integrates with Sentry.
- Critical actions (delete, financial updates) must write to `system_logs` or `audit_logs`.
- All async functions require `try/catch` with toast feedback via `sonner`.
- Debug-only UI must be gated behind `import.meta.env.DEV`.

### Code Standards

- No `any` in TypeScript — define explicit interfaces for all data shapes.
- All data-driven components require Loading, Error, and Empty states (skeletons).
- All pages use `React.lazy()` + `<Suspense>` for code splitting.
- `console.log` / `debugger` stripped from production builds automatically.

### Testing

- Unit tests: Vitest with jsdom. Setup: `src/test/setup.ts`.
- E2E tests: Playwright.

### Deployment

- AWS S3 + CloudFront via `npm run deploy`.
- CI/CD via GitHub Actions, requires Node ≥ 20.
