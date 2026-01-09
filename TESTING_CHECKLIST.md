# 🧪 Testing Checklist - Project Dashboard & Contract System

## 📋 Pré-Requisitos

- [ ] Supabase project criado e configurado
- [ ] Tabelas criadas: `projects`, `clients`, `tasks`, `contract_signatures`
- [ ] RLS policies aplicadas (se necessário)
- [ ] Storage bucket `briefing-files` criado
- [ ] Build completado sem erros: `npm run build`

---

## 🧪 Testes do Project Details (`/projects/:id`)

### **1. Carregamento da Página**
- [ ] Acessar `/projects/{valid-id}` carrega projeto
- [ ] Nome do projeto aparece no header
- [ ] Nome do cliente aparece no header
- [ ] Status badge com cor correta
- [ ] Prazo formatado em português
- [ ] Orçamento formatado com separador de milhares

### **2. Aba Visão Geral**
- [ ] 3 cards visíveis: Orçamento, Recebido, A Receber
- [ ] Valores estão corretos (budget, paid_amount, resta)
- [ ] Percentual de pagamento correto
- [ ] Barra de progresso atualiza visualmente
- [ ] Espaçamento e cores estão corretos

### **3. Aba Tarefas (Kanban)**
- [ ] 4 colunas carregam: A Fazer, Em Progresso, Revisão, Concluído
- [ ] Contador de tarefas correto em cada coluna
- [ ] Tarefas carregam do Supabase
- [ ] Cada tarefa mostra título
- [ ] Badge de prioridade aparece com cor certa
- [ ] Ícone de drag handle (≡) visível

### **4. Interação Kanban - Drag & Drop**
- [ ] Clicar em tarefa permite iniciar drag
- [ ] Cursor muda para grab durante hover
- [ ] Cursor muda para grabbing durante drag
- [ ] Arrastar para coluna diferente atualiza visualmente
- [ ] Ao soltar, Supabase é atualizado
- [ ] Toast de sucesso aparece
- [ ] Se falhar, tarefa volta para coluna original
- [ ] Toast de erro aparece em caso de falha

### **5. Criar Tarefa (Button "Nova Tarefa")**
- [ ] Botão "Nova Tarefa" aparece apenas na coluna "A Fazer"
- [ ] Clicar no botão abre dialog
- [ ] Dialog mostra campos: Título, Prioridade
- [ ] Prioridade padrão é "Média"
- [ ] Preenchendo título e clicando "Criar" insere no Supabase
- [ ] Pressionar Enter confirma (não precisa clicar botão)
- [ ] Nova tarefa aparece no topo da coluna "A Fazer"
- [ ] Dialog fecha após criação
- [ ] Toast de sucesso aparece
- [ ] Validação: Não permite criar sem título
- [ ] Loading spinner aparece durante criação

### **6. Aba Briefing**
- [ ] Se projeto tem briefing, mostra conteúdo formatado
- [ ] Se sem briefing, mostra mensagem "Nenhum briefing"
- [ ] Conteúdo é read-only (não editável)
- [ ] Formatação de JSONB é clara

### **7. Aba Contrato**
- [ ] Card decorativo com ícone de arquivo
- [ ] Descrição legível
- [ ] Botão "Abrir Contrato" visível
- [ ] Clicar no botão leva a `/projects/:id/contract`

### **8. Responsividade**
- [ ] Mobile (< 640px): Layout em coluna única
- [ ] Tablet (640-1024px): 2 colunas Kanban
- [ ] Desktop (> 1024px): 4 colunas Kanban
- [ ] Header mantém estrutura em todos os tamanhos
- [ ] Cards não ficam muito grandes

---

## 📝 Testes do Project Contract (`/projects/:id/contract`)

### **1. Carregamento**
- [ ] Acessar rota carrega projeto
- [ ] Nome do projeto aparece
- [ ] Editor TipTap carrega vazio ou com conteúdo salvo

### **2. Modo Editor (Sem `?mode=client`)**
- [ ] Toolbar de edição visível com botões:
  - [ ] Bold (B)
  - [ ] Italic (I)
  - [ ] Underline (U)
  - [ ] Heading (H)
  - [ ] List (≡)
  - [ ] Gerar Link (com ícone copy)
  - [ ] Download PDF (com ícone download)
- [ ] Clicar em botões aplica formatação no texto
- [ ] Barra de assinatura NOT VISIBLE
- [ ] Digitar conteúdo funciona

### **3. Botão "Gerar Link"**
- [ ] Clicar em "Gerar Link"
- [ ] Toast "Link de assinatura copiado" aparece
- [ ] URL copiada contém `?mode=client`
- [ ] Link é acessível e funciona

### **4. Modo Cliente (`?mode=client`)**
- [ ] Acessar com `?mode=client` detecta automaticamente
- [ ] Toolbar de edição desaparece
- [ ] Editor fica disabled (desabilitado, não editável)
- [ ] Barra de assinatura aparece no rodapé (sticky)

### **5. Barra de Assinatura**
- [ ] Checkbox "Li e concordo" visível
- [ ] Input "Nome completo" visível
- [ ] Botão "Assinar Contrato" visível
- [ ] Layout responsivo na barra

### **6. Validação de Assinatura**
- [ ] Deixar nome vazio + clicar "Assinar" → erro
- [ ] Deixar checkbox desmarcado + clicar → erro
- [ ] Preencher tudo + clicar "Assinar" → processa

### **7. Processo de Assinatura**
- [ ] Spinner "Assinando..." aparece no botão
- [ ] HTML é inserido no documento com bloco de assinatura:
  - [ ] Contém nome preenchido
  - [ ] Contém data/hora em formato correto
  - [ ] Contém IP (placeholder)
- [ ] PDF é gerado e baixado
- [ ] PDF é upado para Supabase Storage (`briefing-files/contracts/...`)
- [ ] Assinatura é salva em `contract_signatures` table
- [ ] Projeto é atualizado com `status='signed'` e `contract_url`
- [ ] Toast de sucesso aparece
- [ ] Formulário limpa após sucesso

### **8. Download PDF (Modo Editor)**
- [ ] Clicar "PDF" button baixa PDF
- [ ] PDF contém conteúdo do editor
- [ ] PDF tem formatação correta (Times New Roman, A4)
- [ ] Arquivo tem nome correto

---

## 🛠️ Testes de Integração

### **1. Fluxo Completo: Editor → Cliente → Assinado**
- [ ] Abrir `/projects/:id/contract` (editor)
- [ ] Editar contrato (adicionar texto)
- [ ] Clicar "Gerar Link"
- [ ] Copiar URL
- [ ] Abrir link em aba anônima/privada
- [ ] Link tem `?mode=client`
- [ ] Pode visualizar mas não editar
- [ ] Preencher nome + aceitar termo
- [ ] Clicar "Assinar"
- [ ] PDF gerado e baixado
- [ ] Voltar à aba editor
- [ ] Recarregar página
- [ ] Status mudou para "signed"
- [ ] Contract URL está preenchida

### **2. Integração ProjectDetails + ProjectContract**
- [ ] Em `/projects/:id` → aba "Contrato"
- [ ] Clicar "Abrir Contrato"
- [ ] Leva para `/projects/:id/contract`
- [ ] Volta e front volta a `/projects/:id`

### **3. Integração Kanban**
- [ ] Criar tarefa via dialog
- [ ] Tarefa aparece em "A Fazer"
- [ ] Arrastar para "Em Progresso"
- [ ] Recarregar página
- [ ] Tarefa mantém status (persisted)
- [ ] Mover novamente para "Revisão"
- [ ] Mover para "Concluído"
- [ ] Verficar dados no Supabase

---

## 🔐 Testes de Segurança

- [ ] Sem RLS: Qualquer usuário pode acessar
- [ ] Com RLS: Apenas proprietário do projeto pode ver
- [ ] Storage: PDFs não são acessíveis sem permissão
- [ ] XSS: Conteúdo do editor é sanitizado (TipTap)
- [ ] CSRF: Forms têm proteção adequada (Supabase auth)

---

## 🐛 Testes de Error Handling

- [ ] Projeto não existe → página 404
- [ ] Tarefas não carregam → toast erro
- [ ] Drag-drop falha → tarefa volta, toast erro
- [ ] Upload PDF falha → toast erro com mensagem
- [ ] Contrato não tem cliente → header graceful
- [ ] Briefing vazio → message apropriada

---

## 📊 Testes de Performance

- [ ] Carregar 100 tarefas → sem lag
- [ ] Drag 20 tarefas → responsivo
- [ ] Upload PDF 5MB → funciona (pode ser lento)
- [ ] Recarregar página → cache funciona

---

## 🎨 Testes de UI/UX

- [ ] Cores consistentes com design
- [ ] Fonts corretas (Times New Roman em contrato, sans em UI)
- [ ] Espaçamento uniforme
- [ ] Ícones aparecem corretamente
- [ ] Hover states visíveis
- [ ] Active states claros
- [ ] Disabled states corretos
- [ ] Loading states aparecem

---

## 📱 Testes de Responsividade

Testar em:
- [ ] iPhone 12 (390px)
- [ ] iPad (768px)
- [ ] MacBook (1440px)

Verificar:
- [ ] Texto legível
- [ ] Botões clicáveis
- [ ] Sem overflow horizontal
- [ ] Imagens respondem bem

---

## ✅ Checklist Final

Antes de ir para produção:

- [ ] Build com 0 errors: `npm run build`
- [ ] Todos os testes passaram
- [ ] Migrations aplicadas ao Supabase
- [ ] RLS policies verificadas
- [ ] Storage bucket criado
- [ ] Email configurado (para envio de links)
- [ ] Backup do banco feito
- [ ] Documentação lida e entendida
- [ ] Deploy em staging testado
- [ ] Monitoramento/logging configurado

---

## 📞 Troubleshooting Rápido

| Problema | Solução |
|---|---|
| Projeto não carrega | Verificar ID na URL, console para erro |
| Tarefas não aparecem | Verificar se existem no Supabase, RLS |
| Drag-drop não funciona | Browser antigo, tentar Chrome/Firefox |
| PDF não gera | Verificar html2pdf.js, console para erro |
| Storage upload falha | Verificar bucket, permissões, tamanho |
| Contrato não abre | Verificar se projeto existe, ID correto |

---

**Pronto para testar!** 🎉

Execute os testes em ordem e documente qualquer desvio.
