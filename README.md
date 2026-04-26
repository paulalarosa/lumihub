# 🏭 Khaos Kontrol

> **Industrial CRM & Dashboard.**
> Sistema de gestão de alta performance focado em controle de eventos, clientes e automação de processos.

![Project Status](https://img.shields.io/badge/status-active-success)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)
![Tests](https://img.shields.io/badge/tests-Vitest%20%7C%20Playwright-green)

---

## 🎯 Sobre o Projeto

O **Khaos Kontrol** é uma aplicação web desenvolvida para resolver problemas reais de gestão de dados. Diferente de dashboards comuns, ele foca em uma estética **Industrial/Brutalist** e em uma arquitetura de software robusta ("Senior-grade"), priorizando a integridade dos dados e a experiência do usuário (UX).

O objetivo técnico foi simular um ambiente corporativo real, implementando separação de ambientes, esteiras de CI/CD e padrões de projeto escaláveis.

---

## 🛠️ Tech Stack (Engenharia)

Este projeto foi construído alinhado com as demandas modernas de mercado (InsurTech/FinTech), focando em performance e segurança.

### Core
* **React (Vite):** SPA rápida e modular.
* **TypeScript:** Tipagem estrita para reduzir bugs em tempo de desenvolvimento.
* **Tailwind CSS:** Estilização utilitária para consistência visual (Design System industrial).

### Gestão de Estado & Dados (Architecture)
A aplicação utiliza uma separação clara de responsabilidades:
* **Server State (React Query / TanStack):** Gerenciamento de cache, revalidação automática, paginação no servidor e mutações otimistas.
* **Client State (Zustand):** Gerenciamento de estado global da UI (filtros, menus, notificações) sem prop-drilling.

### Qualidade & Segurança
* **Zod + React Hook Form:** Validação de schemas robusta no front-end para garantir integridade dos dados antes do envio.
* **Supabase:** Backend-as-a-Service (PostgreSQL) com Row Level Security (RLS).
* **Ambientes Isolados:** Configuração profissional de **DEV** (dados mock/teste) vs **PROD** (dados reais) via variáveis de ambiente.

### Testes
* **Vitest:** Testes unitários.
* **Playwright:** Testes E2E (End-to-End) para garantir fluxos críticos (Login, Dashboard).

---

## ⚡ Funcionalidades de Destaque

### 1. Painel Administrativo (CRUD Avançado)
* **Data Grid:** Tabela de clientes com paginação no servidor (Server-Side Pagination) para performance em larga escala.
* **Busca em Tempo Real:** Filtro via Zustand + React Query.
* **Feedback Visual:** Estados de `isLoading`, `isError` e `isPending` tratados visualmente (Skeletons e Loadings).

### 2. Segurança & UX
* **Validação Defensiva:** Formulários não permitem envio de dados inválidos (tratamento via Zod).
* **Proteção de Rotas:** Acesso restrito e ferramentas de debug (como botões de teste) visíveis apenas em ambiente de desenvolvimento (`import.meta.env.DEV`).

---

## 🚀 Como Rodar Localmente

Pré-requisitos: Node.js e Docker (opcional, para testes locais de banco).

```bash
# 1. Clone o repositório
git clone [https://github.com/seu-usuario/khaos-kontrol.git](https://github.com/seu-usuario/khaos-kontrol.git)

# 2. Instale as dependências
npm install

# 3. Configure as Variáveis de Ambiente
# Crie um arquivo .env.development baseado no .env.example
cp .env.example .env.development

# 4. Rode o projeto
npm run dev
```

---

## 🧰 CLI Reference

Todos os comandos abaixo são scripts NPM definidos em [package.json](package.json) ou usam `npx supabase`.

### Build & Dev

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Vite dev server (porta 5173). |
| `npm run build` | Build de produção: gera sitemap, roda `tsc`, `vite build` e copia `index.html → 404.html` para fallback SPA. |
| `npm run build:dev` | Build em modo `development` (sem prerender, mais rápido). |
| `npm run preview` | Serve `dist/` localmente (porta 4173) pra inspecionar build. |
| `npm run lint` | ESLint em todo o repo. |
| `npm run sitemap` | Regenera `public/sitemap.xml` a partir de blog + help (chamado automaticamente no `build`). |

### Testes

| Comando | O que faz |
| --- | --- |
| `npm test` | Vitest em watch. |
| `npm run coverage` | Vitest com cobertura (saída em `coverage/`). |
| `npm run test:ui` | Vitest UI no browser. |
| `npm run test:e2e` | Playwright E2E (sobe dev server na 5174 automaticamente). |
| `npm run lhci` | Lighthouse CI local — usa `.lighthouserc.json` (precisa de `dist/` pronto). |

Pra rodar **só mobile** (375px) no Playwright: `npx playwright test --project="Mobile Chrome"`. Os testes mobile são apenas os arquivos `e2e/mobile-*.spec.ts` (configurado em [playwright.config.ts](playwright.config.ts)).

### Storybook

| Comando | O que faz |
| --- | --- |
| `npm run storybook` | Dev server na porta 6006. |
| `npm run build-storybook` | Build estático em `storybook-static/`. |

### Supabase (DB + Edge Functions)

> **Regra de ouro:** toda migration ou function vai para **dev (`nqufpfpqtycxxqtnkkfh`) E prod (`pymdkngcpbmcnayxieod`)**. Nunca apenas um.

| Comando | O que faz |
| --- | --- |
| `npm run db:link:dev` / `db:link:prod` | Linka o CLI ao project ref correspondente. |
| `npm run db:push:dev` / `db:push:prod` | Aplica migrations pendentes em `supabase/migrations/`. |
| `npm run functions:deploy:dev` / `functions:deploy:prod` | Faz deploy de **todas** as edge functions em `supabase/functions/`. Para deploy de uma só: `npx supabase functions deploy <nome> --project-ref <ref>`. |
| `npm run types:generate` | Gera `src/integrations/supabase/types.ts` do **schema local** (precisa de `supabase start`). |
| `npm run types:prod` | Gera `src/integrations/supabase/types.ts` direto do project **prod** — preferível depois de aplicar migration nos dois ambientes. |

**Nunca edite `src/integrations/supabase/types.ts` na mão** — sempre regenere via `types:prod` (ou equivalente do dev).

Para deletar uma function: `npx supabase functions delete <nome> --project-ref <ref>` (rodar nos dois projects).

### Deploy do site (S3 + CloudFront)

```bash
npm run deploy        # build + s3 sync + invalidação CloudFront
```

Requer AWS CLI configurada com permissões pro bucket `khaos-kontrol-site` e distribution `E2QFIPXMPI0HCW`.

### Stripe CLI

Stripe CLI fica em `~/AppData/Local/Microsoft/WinGet/Packages/Stripe.StripeCli_*/stripe.exe` (Windows). Usar pra:

- Listenar webhook em local dev: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`
- Disparar evento de teste: `stripe trigger checkout.session.completed`

### Variáveis de ambiente

Edge Functions leem secrets do projeto Supabase (não do `.env` local):

```bash
npx supabase secrets list --project-ref <ref>
npx supabase secrets set FOO=bar --project-ref <ref>
```

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `GOOGLE_API_KEY`, `OFFICIAL_EMAIL_KHAOS` ficam aqui — **nunca** em `VITE_*` no client.