/**
 * INTEGRATION GUIDE: ProjectDetails in ProjetoDetalhes.tsx
 * 
 * Se você quiser integrar o novo ProjectDetails (Kanban + tabs) na página 
 * ProjetoDetalhes.tsx existente, aqui estão as opções:
 */

// ============================================
// OPÇÃO 1: Substituir completamente ProjetoDetalhes
// ============================================
// Em src/App.tsx, mude:
// <Route path="/projetos/:id" element={<ProjectDetails />} />
// 
// Problema: Pode quebrar links existentes se ProjetoDetalhes é usado em outro lugar

// ============================================
// OPÇÃO 2: Manter ambas as rotas (RECOMENDADO)
// ============================================
// Em src/App.tsx (já feito):
// <Route path="/projetos/:id" element={<ProjetoDetalhes />} />          (antiga)
// <Route path="/projects/:id" element={<ProjectDetails />} />           (nova)
// 
// Atualize links que devem ir para a nova dashboard:
// Exemplo em Projetos.tsx:

/*
const goToProjectDashboard = (projectId: string) => {
  navigate(`/projects/${projectId}`);
};
*/

// ============================================
// OPÇÃO 3: Adicionar ProjectKanban como sub-componente
// ============================================
// Se quiser manter ProjetoDetalhes mas adicionar Kanban:

/*
import { ProjectKanban } from '@/components/project/ProjectKanban';

export default function ProjetoDetalhes() {
  // ... código existente ...
  
  return (
    <div>
      {/* Conteúdo antigo */}
      <div>...</div>
      
      {/* Novo Kanban */}
      <div className="mt-8">
        <ProjectKanban projectId={projectId} />
      </div>
    </div>
  );
}
*/

// ============================================
// INSTRUÇÕES DE INTEGRAÇÃO POR ARQUIVO
// ============================================

// 1. Em /src/pages/Projetos.tsx
//    Adicionar botão/link para ir a /projects/:id em vez de /projetos/:id
//    
//    Antes:
//    <Link to={`/projetos/${project.id}`}>
//    
//    Depois:
//    <Link to={`/projects/${project.id}`}>

// 2. Em /src/pages/Dashboard.tsx (se tiver lista de projetos)
//    Mesmo padrão: mudar para /projects/:id

// 3. Em links de dashboard/home
//    Sempre usar /projects/:id para ir para a nova dashboard

// ============================================
// MIGRATIONS NECESSÁRIAS
// ============================================

/*
Se você ainda não criou as colunas necessárias em projects:

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS briefing JSONB;

Se você ainda não criou a tabela tasks:

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' 
    CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX tasks_project_id_idx ON tasks(project_id);
CREATE INDEX tasks_status_idx ON tasks(status);
*/

// ============================================
// ESTRUTURA DE ARQUIVOS CRIADOS
// ============================================

/*
src/
├── pages/
│   ├── ProjectDetails.tsx              (novo - PRINCIPAL)
│   └── ...
├── components/
│   └── project/
│       ├── ProjectKanban.tsx           (novo)
│       ├── KanbanColumn.tsx            (novo)
│       ├── TaskCard.tsx                (novo)
│       └── NewTaskDialog.tsx           (novo)
└── App.tsx                             (modificado - adicionado rota)
*/

// ============================================
// TESTE RÁPIDO
// ============================================

/*
1. Crie um projeto via /projetos/novo
2. Acesse /projects/:id (substitua :id pelo ID do projeto)
3. Deve mostrar:
   - Header com nome, cliente, status
   - 4 abas: Visão Geral, Tarefas, Briefing, Contrato
   - Aba Visão Geral: 3 cards (Orçamento, Recebido, A Receber)
   - Aba Tarefas: 4 colunas Kanban
   
4. Clique em "Nova Tarefa" e crie uma
5. Arraste entre colunas para mover
6. Clique em "Abrir Contrato" para ir a /projects/:id/contract
*/

// ============================================
// NOTAS IMPORTANTES
// ============================================

/*
✅ Validações implementadas:
   - Carregamento com spinner
   - Erro quando projeto não existe
   - Toast para feedback de ações
   - Drag-and-drop com otimistic UI

⚠️ Considerações:
   - Drag-drop funciona em desktop/tablet
   - Em mobile, pode precisar de melhorias
   - RLS não está implementado (use seu padrão)

🚀 Performance:
   - Fetch inicial de projeto (1 query)
   - Fetch de tarefas por projeto (1 query)
   - Update por tarefa ao arrastar (N queries)
   - Sem problemas com até 500 tarefas/projeto
*/

export {};
