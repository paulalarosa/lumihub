# Project Status & History
**Last Updated:** January 29, 2026

## 1. System Overview
**Lumihub** is a high-end business management platform (CRM/ERP) featuring "Industrial Noir" aesthetics, specialized for the wedding industry (but adaptable).

### Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind/Shadcn.
- **Backend Service**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **State**: React Query (Server) + Zustand (Client).

---

## 2. Recent Implementations (Jan 2026)

### Admin Panel Overhaul
- **New Dashboard**: `/admin` route with "Command Center" theme.
- **HUD Metrics**: 3-Column display of Total Clients, Active Contracts, and Leads.
- **Data Grid**: Professional table with Sort/Filter and Deletion capabilities.
- **Navigation**: Segregated "WORKSPACE" (Daily ops) from "SYSTEM" (Admin tools) in Sidebar.

### Global Features
- **Global Search**: `SearchBar` component integrated with Zustand store.
- **Data Layer**: Standardized `clientService` and custom hooks (`useClients`, `useDeleteClient`, `useDashboardMetrics`).

---

## 3. Infrastructure & Integrations Audit
*(Consolidated from Jan 9, 2026 Audit)*

### ✅ Operational
- **Supabase Core**: Auth, DB, Storage fully integrated.
- **Email**: Resend API integrated (keys in local env).
- **Admin Functions**: Ghost login verified.

### ⚠️ Pending Configuration
- **Google Calendar**: Requires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. Currently returns 401.
- **Mercado Pago**: Requires `ACCESS_TOKEN`. Payments disabled.
- **Google Maps**: Requires `VITE_GOOGLE_MAPS_API_KEY`. Maps returning 404.
- **Lovable AI**: check `LOVABLE_API_KEY`.

### Action Items for Infrastructure
1.  Add missing keys to Supabase Secrets.
2.  Verify OAuth Redirect URIs for Google.

---

## 4. Development Notes
- **Scripts**: A script concept for upgrading user tiers (`scripts/upgrade_notes.md`) was deprecated in favor of Admin Panel controls.
- **Security**: RLS enabled on `wedding_clients` and `profiles`.
- **Testing**: `vitest` suite in place (14/14 passing).
