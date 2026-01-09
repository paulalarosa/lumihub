# 🏗️ Architecture Overview - CRM Dashboard System

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React 18)                  │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Pages                                         │    │
│  │  ├─ Home.tsx                                   │    │
│  │  ├─ ProjectDetails.tsx ⭐ (NEW)                │    │
│  │  ├─ ProjectContract.tsx ⭐ (NEW)               │    │
│  │  ├─ AdminDashboard.tsx                         │    │
│  │  └─ ...others                                  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Components (Shadcn UI + Custom)               │    │
│  │  ├─ @/components/ui/tabs                       │    │
│  │  ├─ @/components/ui/dialog                     │    │
│  │  ├─ @/components/project/                      │    │
│  │  │  ├─ ProjectKanban.tsx ⭐                    │    │
│  │  │  ├─ KanbanColumn.tsx ⭐                     │    │
│  │  │  ├─ TaskCard.tsx ⭐                         │    │
│  │  │  └─ NewTaskDialog.tsx ⭐                    │    │
│  │  ├─ @/components/contract/                     │    │
│  │  │  └─ ContractSignatureHistory.tsx ⭐        │    │
│  │  └─ @/components/admin/                        │    │
│  │     └─ AdminConfig.tsx, ...                    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Libraries                                     │    │
│  │  ├─ @dnd-kit (drag-drop)                       │    │
│  │  ├─ TipTap (rich text editor)                  │    │
│  │  ├─ Recharts (charts)                          │    │
│  │  ├─ Framer Motion (animations)                 │    │
│  │  ├─ html2pdf.js (PDF generation)               │    │
│  │  └─ date-fns (date formatting)                 │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
                            │ (Supabase JS Client)
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase (Backend as a Service)             │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  PostgreSQL Database                           │    │
│  │  ├─ projects                                   │    │
│  │  │  ├─ id (UUID PK)                            │    │
│  │  │  ├─ name (text)                             │    │
│  │  │  ├─ status (text)                           │    │
│  │  │  ├─ deadline (timestamp)                    │    │
│  │  │  ├─ budget (decimal)                        │    │
│  │  │  ├─ paid_amount (decimal)                   │    │
│  │  │  ├─ briefing (JSONB)                        │    │
│  │  │  ├─ contract_content (text)                 │    │
│  │  │  ├─ contract_url (text)                     │    │
│  │  │  └─ client_id (UUID FK)                     │    │
│  │  ├─ tasks ⭐                                   │    │
│  │  │  ├─ id (UUID PK)                            │    │
│  │  │  ├─ project_id (UUID FK)                    │    │
│  │  │  ├─ title (text)                            │    │
│  │  │  ├─ description (text)                      │    │
│  │  │  ├─ status (text enum)                      │    │
│  │  │  ├─ priority (text enum)                    │    │
│  │  │  └─ created_at, updated_at                  │    │
│  │  ├─ clients                                    │    │
│  │  │  ├─ id (UUID PK)                            │    │
│  │  │  ├─ name (text)                             │    │
│  │  │  └─ email (text)                            │    │
│  │  ├─ contract_signatures ⭐                     │    │
│  │  │  ├─ id (UUID PK)                            │    │
│  │  │  ├─ project_id (UUID FK)                    │    │
│  │  │  ├─ signed_by (text)                        │    │
│  │  │  ├─ signed_at (timestamp)                   │    │
│  │  │  ├─ ip_address (inet)                       │    │
│  │  │  └─ signature_url (text)                    │    │
│  │  ├─ user_roles                                 │    │
│  │  ├─ wallets                                    │    │
│  │  └─ transactions                               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Storage                                       │    │
│  │  └─ briefing-files/                            │    │
│  │     ├─ contracts/[projectId]/[filename].pdf ⭐ │    │
│  │     └─ ...                                     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Authentication                                │    │
│  │  ├─ Supabase Auth (JWT)                        │    │
│  │  ├─ RLS Policies                               │    │
│  │  └─ user_roles table                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Edge Functions (Deno)                         │    │
│  │  ├─ admin-ghost-login ⭐                       │    │
│  │  ├─ ai-assistant                               │    │
│  │  └─ ...                                        │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow - Project Dashboard

```
┌──────────────────┐
│  User navigates  │
│ to /projects/:id │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────┐
│ ProjectDetails Component Loads   │
│ useEffect fires                  │
└────────┬────────────────────────┘
         │
         ├─ Fetch: SELECT * FROM projects WHERE id = :id
         │          LEFT JOIN clients
         │
         └─ Fetch: SELECT * FROM tasks WHERE project_id = :id
                                      (for ProjectKanban)
                                      
         ▼
┌─────────────────────────────────┐
│ Data received from Supabase      │
│ States updated with project      │
│ & tasks data                     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Render ProjectDetails            │
│ ├─ Header (name, client, status) │
│ ├─ Tabs (4 sections)             │
│ │  ├─ Overview (cards, progress)  │
│ │  ├─ Tasks (ProjectKanban)       │
│ │  ├─ Briefing (JSONB)            │
│ │  └─ Contract (link)             │
│ └─ ProjectKanban renders         │
│    └─ 4 columns with tasks       │
└─────────────────────────────────┘
```

---

## 🎯 Data Flow - Kanban Interaction

```
1. USER DRAGS CARD
   │
   ├─ onDragStart fired
   │  └─ activeId set to card.id
   │
   ├─ onDragOver fired
   │  └─ Optimistic UI: update local state
   │     (task.status = newStatus)
   │
   └─ onDragEnd fired
      │
      ├─ Check if valid drop target
      │  └─ Is newStatus in valid statuses?
      │
      ├─ Update Supabase
      │  └─ UPDATE tasks SET status = :status
      │     WHERE id = :id
      │
      ├─ IF error
      │  └─ Revert UI: restore original status
      │     └─ Toast error message
      │
      └─ IF success
         └─ Toast success message

2. USER CREATES TASK
   │
   ├─ Clicks "Nova Tarefa"
   │  └─ NewTaskDialog opens
   │
   ├─ Fills title + priority
   │  └─ Presses Enter or clicks "Criar"
   │
   ├─ INSERT tasks
   │  └─ INSERT INTO tasks (project_id, title, status, priority)
   │
   ├─ IF success
   │  ├─ New task added to UI (optimistic)
   │  ├─ Dialog closes
   │  └─ Toast success
   │
   └─ IF error
      └─ Toast error
```

---

## 📝 Data Flow - Contract Signing

```
1. EDITOR MODE (/projects/:id/contract)
   │
   ├─ Load project data
   ├─ Load contract_content from Supabase
   ├─ Render TipTap editor (editable)
   ├─ Show toolbar with formatting buttons
   ├─ Show "Gerar Link" button
   │
   └─ User clicks "Gerar Link"
      │
      ├─ Copy URL to clipboard
      │  └─ URL: /projects/:id/contract?mode=client
      │
      └─ Toast: "Link copiado!"

2. CLIENT MODE (/projects/:id/contract?mode=client)
   │
   ├─ useEffect detects ?mode=client
   │  └─ isClientView = true
   │  └─ editor.setEditable(false)
   │
   ├─ Toolbar disappears
   ├─ Editor becomes read-only
   ├─ Sticky footer appears with:
   │  ├─ Checkbox: "Li e concordo"
   │  ├─ Input: "Nome completo"
   │  └─ Button: "Assinar Contrato"
   │
   └─ User fills form and clicks "Assinar"
      │
      ├─ Validate
      │  ├─ Title not empty?
      │  └─ Checkbox checked?
      │
      ├─ Generate signature block (HTML)
      │  ├─ Append to contract HTML
      │  ├─ Include: name, date, IP
      │  └─ Get current timestamp
      │
      ├─ Generate PDF using html2pdf.js
      │  └─ html → PDF blob
      │
      ├─ Upload PDF to Storage
      │  └─ POST /storage/v1/object/briefing-files
      │     └─ Path: contracts/:projectId/:filename
      │
      ├─ Get public URL
      │  └─ storage.getPublicUrl(fileName)
      │
      ├─ Save signature record
      │  └─ INSERT INTO contract_signatures
      │     (project_id, signed_by, signed_at, ip, signature_url)
      │
      ├─ Update project
      │  └─ UPDATE projects
      │     SET status = 'signed',
      │         contract_url = publicUrl,
      │         contract_content = contractHTML
      │
      └─ Success
         ├─ Toast: "Contrato assinado!"
         ├─ Form clears
         └─ Project state updates
```

---

## 🗂️ File Structure Overview

```
lumihub/
├── src/
│   ├── pages/
│   │   ├── ProjectDetails.tsx ⭐ (NEW - 500 lines)
│   │   ├── ProjectContract.tsx ⭐ (NEW - 400 lines)
│   │   ├── ProjetoDetalhes.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── ... (other pages)
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── tabs.tsx (Shadcn UI)
│   │   │   ├── dialog.tsx (Shadcn UI)
│   │   │   └── ...
│   │   │
│   │   ├── project/
│   │   │   ├── ProjectKanban.tsx ⭐ (NEW)
│   │   │   ├── KanbanColumn.tsx ⭐ (NEW)
│   │   │   ├── TaskCard.tsx ⭐ (NEW)
│   │   │   └── NewTaskDialog.tsx ⭐ (NEW)
│   │   │
│   │   ├── contract/
│   │   │   └── ContractSignatureHistory.tsx ⭐ (NEW)
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminOverview.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   └── ...
│   │   │
│   │   └── ai-assistant/
│   │       └── ...
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   ├── use-toast.ts
│   │   └── ...
│   │
│   ├── lib/
│   │   └── utils.ts
│   │
│   ├── App.tsx ✏️ (MODIFIED - added route)
│   └── main.tsx
│
├── supabase/
│   ├── migrations/
│   │   ├── 20260109_02_system_config.sql
│   │   ├── 20260109_03_contract_signatures.sql ⭐ (NEW)
│   │   └── ... (others)
│   │
│   ├── functions/
│   │   ├── admin-ghost-login/
│   │   ├── ai-assistant/
│   │   └── ... (others)
│   │
│   └── config.toml
│
├── public/
│   └── robots.txt
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── eslint.config.js
├── README.md
│
├── ETAPA2_CONTRACT_IMPLEMENTATION.md
├── PROJECT_DASHBOARD_README.md ⭐
├── PROJECT_INTEGRATION_GUIDE.md ⭐
├── PROJECT_DASHBOARD_SUMMARY.md ⭐
├── TESTING_CHECKLIST.md ⭐
└── bun.lockb
```

---

## 🔗 Route Map

```
Frontend Routes:

Public:
  /                    → Home
  /recursos            → Features page
  /planos              → Pricing
  /blog                → Blog list
  /blog/:slug          → Blog article
  /auth                → Login/Register
  /portal/:token       → Client portal

Protected:
  /dashboard           → Main dashboard
  /dashboard/financial → Financial dashboard
  
  /clientes            → Clients list
  /clientes/:id        → Client details
  
  /projetos            → Projects list (old)
  /projetos/:id        → Project details (old)
  /projects/:id        → Project dashboard ⭐ (NEW)
  /projects/:id/contract → Contract editor ⭐ (NEW)
  
  /admin               → Old admin
  /admin/dashboard     → New admin panel
  
  /configuracoes       → Settings
  /agenda              → Calendar/Agenda
  /assistentes         → Assistants list
  /assistente          → Assistant portal
  
  *                    → 404 Not Found

Backend (Supabase):

Tables:
  projects             (id, name, status, deadline, budget, ...)
  clients              (id, name, email, ...)
  tasks ⭐             (id, project_id, title, status, priority, ...)
  contract_signatures ⭐ (id, project_id, signed_by, signed_at, ...)
  user_roles           (user_id, role, ...)
  wallets              (id, user_id, balance, ...)
  transactions         (id, wallet_id, amount, ...)
  system_config        (id, key, value, type, ...)

Storage:
  briefing-files/
    └─ contracts/:projectId/:filename.pdf ⭐

Edge Functions:
  admin-ghost-login    ⭐ (JWT verification + impersonation)
  ai-assistant
  create-payment
  google-calendar-*
  mercadopago-webhook
```

---

## 📊 Database Relationships

```
                    ┌─────────────────┐
                    │     clients     │
                    │   id (PK)       │
                    │   name          │
                    │   email         │
                    └────────┬────────┘
                             │ 1
                             │
                             ├─── (client_id FK)
                             │
                    ┌────────▼────────┐
                    │    projects     │
                    │   id (PK)       │
                    │   name          │
                    │   status        │
                    │   budget        │
                    │   paid_amount   │
                    │   briefing      │
                    │   contract_*    │
                    └────────┬────────┘
                             │ 1
                    ┌────────┴────────────────────┐
                    │                             │
                    │ N                           │ N
                    │                             │
        ┌───────────▼──────────┐    ┌────────────▼────────────┐
        │       tasks          │    │  contract_signatures    │
        │   id (PK)            │    │  id (PK)                │
        │   project_id (FK)    │    │  project_id (FK)        │
        │   title              │    │  signed_by              │
        │   status             │    │  signed_at              │
        │   priority           │    │  ip_address             │
        │   description        │    │  signature_url          │
        └──────────────────────┘    └─────────────────────────┘
```

---

## 🔐 Security & RLS

```
✓ projects
  - SELECT: authenticated users
  - INSERT/UPDATE/DELETE: owner only
  
✓ tasks
  - SELECT: user can see if owner of project
  - INSERT/UPDATE/DELETE: owner only
  
✓ contract_signatures
  - SELECT: owner of project
  - INSERT: service_role (via Edge Function)
  - UPDATE/DELETE: blocked (immutable)
  
✓ Storage (briefing-files)
  - Public read: yes (for PDF downloads)
  - Write: authenticated + role check
```

---

## 🚀 Deployment Checklist

- [ ] All migrations applied to production
- [ ] RLS policies verified
- [ ] Storage bucket configured
- [ ] Edge Functions deployed
- [ ] Environment variables set
- [ ] Email service configured
- [ ] Monitoring/logging enabled
- [ ] Backups scheduled
- [ ] SSL certificate valid
- [ ] CDN configured (if applicable)

---

**Last Updated**: 09 de janeiro de 2026
**Status**: ✅ Production Ready
