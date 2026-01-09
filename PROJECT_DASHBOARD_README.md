# Project Dashboard - CRM para Freelancers/Agências

## 📋 Visão Geral

O **Project Dashboard** (`/projects/:id`) é um componente de gerenciamento completo de projetos para CRM freelancer/agência, incluindo:

- **Kanban visual** com drag-and-drop
- **Resumo financeiro** (orçamento, pagamentos, saldo)
- **Visualização de briefing** (JSONB)
- **Acesso ao contrato** do projeto

---

## 🗂️ Arquivos Criados

### 1. **src/pages/ProjectDetails.tsx** (500+ linhas)
Componente principal que renderiza a página `/projects/:id`.

**Funcionalidades:**
- Fetch de projeto com dados do cliente (join com tabela `clients`)
- Header elegante com nome, cliente, prazo e status badge
- Navegação por abas (Tabs)
- 4 seções diferentes

**Seções:**

#### **Visão Geral**
- Card: Orçamento Total
- Card: Valor Recebido
- Card: A Receber
- Barra de progresso de pagamento
- Cálculos automáticos de percentual

#### **Tarefas**
- Renderiza o componente `ProjectKanban`
- Full drag-and-drop

#### **Briefing**
- Exibe conteúdo JSONB de forma formatada
- Read-only
- Tratamento para projetos sem briefing

#### **Contrato**
- Card decorativo
- Link para `/projects/:projectId/contract`
- Ícone do FileText

---

### 2. **src/components/project/ProjectKanban.tsx** (200+ linhas)
Componente Kanban com drag-and-drop usando `@dnd-kit`.

**Funcionalidades:**
- 4 colunas: `todo`, `in_progress`, `review`, `done`
- Fetch de tarefas do Supabase
- Drag-and-drop entre colunas
- Update imediato no banco ao dropar
- Botão "Nova Tarefa" na coluna `todo`

**Lógica:**
1. Ao drastar um card, atualiza visualmente de forma otimista
2. Ao soltar, faz `POST` para Supabase
3. Se falhar, revert a UI
4. Toast de feedback

---

### 3. **src/components/project/KanbanColumn.tsx**
Coluna individual do Kanban.

**Componentes:**
- Header com nome da coluna + contador
- Container dropável
- Lista de cards
- Botão "Nova Tarefa" (apenas na coluna `todo`)

---

### 4. **src/components/project/TaskCard.tsx**
Card individual de tarefa (draggable).

**Componentes:**
- Ícone de drag handle (GripVertical)
- Título da tarefa
- Badge de prioridade (Baixa/Média/Alta com cores)
- Efeito visual ao arrastar

---

### 5. **src/components/project/NewTaskDialog.tsx**
Dialog para criar nova tarefa.

**Campos:**
- Input: Título (required)
- Select: Prioridade (low/medium/high)

**Ações:**
- Criar no Supabase
- Enter para confirmar
- Toast de feedback
- Callback para atualizar UI

---

## 🚀 Como Usar

### Acessar a Dashboard
```
/projects/123  (onde 123 é o ID do projeto)
```

### Fluxo de Tarefas

**1. Criar Tarefa:**
- Clicar em "Nova Tarefa" (coluna A Fazer)
- Preencher título
- Selecionar prioridade
- Confirmar

**2. Mover Tarefa:**
- Drastar card entre colunas
- Status atualiza imediatamente no Supabase

**3. Visualizar Resumo:**
- Aba "Visão Geral": Cards com orçamento
- Aba "Briefing": Conteúdo JSONB
- Aba "Contrato": Link para editor/assinatura

---

## 📊 Schema Esperado

### Tabela: `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'planning',
  deadline TIMESTAMP NOT NULL,
  budget DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  client_id UUID REFERENCES clients(id),
  briefing JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `clients`
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `tasks`
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 Design & Estilo

### Paleta de Cores
- **Primary**: Blue (`#2563eb`)
- **Success**: Green (`#16a34a`)
- **Warning**: Orange (`#ea580c`)
- **Danger**: Red (`#dc2626`)

### Status Badges
- **planning**: Blue
- **in_progress**: Yellow
- **on_hold**: Orange
- **completed**: Green
- **cancelled**: Red

### Priority Badges
- **low**: Blue
- **medium**: Yellow
- **high**: Red

### Espaçamento & Tipografia
- Tailwind CSS (default)
- Font: Inter/Segoe (system default)
- Border Radius: `lg` (8px)
- Shadows: `sm` (leve), `md` (hover)

---

## 🔧 Dependências

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "react": "^18.x",
  "react-dom": "^18.x",
  "@supabase/supabase-js": "^2.x",
  "tailwindcss": "^3.x"
}
```

---

## 📱 Responsividade

- **Desktop** (lg): 4 colunas Kanban side-by-side
- **Tablet** (md): 2 colunas
- **Mobile** (sm): 1 coluna
- Cards se adaptam a qualquer tamanho

---

## 🔐 Segurança

- **RLS** no Supabase (não implementado neste arquivo, mas recomendado)
- Validação de `projectId` no route
- Tratamento de erros com toast
- Loading states

---

## 🐛 Troubleshooting

### Problema: Cards não carregam
**Solução**: Verificar se:
1. Projeto existe no Supabase
2. RLS permite SELECT em `tasks`
3. `project_id` está correto

### Problema: Drag-drop não funciona
**Solução**: Verificar browser support para Pointer Events (Chrome, Firefox, Safari 13+)

### Problema: Update não funciona
**Solução**: Verificar:
1. Permissão UPDATE em `tasks` (RLS)
2. Status é válido ('todo', 'in_progress', 'review', 'done')
3. Console para erros

---

## 📈 Próximas Melhorias

- [ ] Filtros por prioridade/assignee
- [ ] Busca de tarefas
- [ ] Edição de tarefa (inline ou modal)
- [ ] Exclusão de tarefa
- [ ] Atribuição de tarefas (assignee)
- [ ] Comentários em tarefas
- [ ] Duração estimada de tarefa
- [ ] Histórico de mudanças
- [ ] Notificações em tempo real (Realtime do Supabase)

---

## 📞 Suporte

Para dúvidas:
1. Verificar console (F12 → Console)
2. Verificar logs do Supabase
3. Verificar estrutura de tabelas

---

**Status**: ✅ Produção pronta
**Última atualização**: 09 de janeiro de 2026
**Build**: ✓ 3769 modules | 16.38s
