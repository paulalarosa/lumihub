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