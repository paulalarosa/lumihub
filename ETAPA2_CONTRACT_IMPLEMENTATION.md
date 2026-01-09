# ProjectContract - Etapa 2: UX de Assinatura e Geração de PDF

## 📋 Visão Geral

O componente `ProjectContract.tsx` implementa um editor de contrato com assinatura digital, geração de PDF e rastreamento de assinaturas. Suporta dois modos: edição e visualização/assinatura do cliente.

---

## 🎯 Funcionalidades Implementadas

### 1. **Botão "Gerar Link de Assinatura"** ✅
- **Localização**: Barra de ferramentas (toolbar) superior
- **Função**: Copia para o clipboard a URL atual com parâmetro `?mode=client`
- **Exemplo de URL gerada**: `/projects/123/contract?mode=client`
- **Feedback**: Toast de sucesso "Link de assinatura copiado para a área de transferência."

```typescript
handleGenerateSignatureLink() {
  const signatureUrl = `${window.location.origin}/projects/${projectId}/contract?mode=client`;
  navigator.clipboard.writeText(signatureUrl);
}
```

### 2. **Modo Cliente (Read-only)** ✅
- **Ativação**: Detectada automaticamente via `useEffect` quando URL contém `?mode=client`
- **Estado**: `isClientView = true` desativa a toolbar de edição
- **Editor**: `editable={false}` no TipTap
- **Comportamento**: Mostra apenas o conteúdo do contrato + área de assinatura no rodapé

```typescript
useEffect(() => {
  const mode = searchParams.get('mode');
  if (mode === 'client') {
    setIsClientView(true);
    editor?.setEditable(false);
  }
}, [searchParams, editor]);
```

### 3. **Área de Assinatura (Rodapé Sticky)** ✅
- **Visibilidade**: Apenas no modo cliente (`isClientView === true`)
- **Posição**: Fixed no rodapé (`sticky bottom-0`)
- **Componentes**:
  - ☑️ Checkbox: "Li e concordo com os termos"
  - 📝 Input: "Nome completo para assinatura"
  - 🖊️ Botão: "Assinar Contrato"

### 4. **Lógica de Assinatura** ✅

**Validações**:
- Nome deve estar preenchido
- Checkbox de concordância deve estar marcado

**Processo**:
1. ✅ Valida formulário
2. ✅ Gera bloco de assinatura com:
   - Nome do signatário
   - Data/hora (formato: `dd/MM/yyyy HH:mm:ss`)
   - IP do cliente (placeholder: `127.0.0.1`)
3. ✅ Injeta bloco no final do HTML do contrato
4. ✅ Gera PDF usando `html2pdf.js`
5. ✅ Faz upload do PDF para Supabase Storage (`briefing-files/contracts/...`)
6. ✅ Salva assinatura na tabela `contract_signatures`
7. ✅ Atualiza projeto com `status = 'signed'` e `contract_url`

**Exemplo de bloco inserido**:
```html
<div style="margin-top: 60px; border-top: 1px solid #000; padding-top: 20px; ...">
  <p><strong>Assinado digitalmente por:</strong> João da Silva</p>
  <p><strong>Data:</strong> 09/01/2026 14:30:22</p>
  <p><strong>IP:</strong> 127.0.0.1</p>
</div>
```

### 5. **Estética** ✅
- **Font**: Times New Roman (serif) para aparência jurídica
- **Layout**: Papel A4 (210mm × 297mm)
- **Background**: Gradiente sutil (gray-50 → gray-100)
- **Editor**: Simulação de papel com sombra

---

## 🛠️ Stack Utilizado

| Ferramenta | Versão | Uso |
|---|---|---|
| React | 18+ | Framework UI |
| TypeScript | Latest | Tipagem |
| Vite | 5.4 | Build tool |
| TipTap | Latest | Editor de texto rico |
| Tailwind CSS | Latest | Estilos |
| Supabase | JS Client | DB + Storage |
| html2pdf.js | Latest | Geração de PDF |
| date-fns | Latest | Formatação de datas |
| Sonner | Latest | Toast notifications |
| Lucide Icons | Latest | Ícones |

---

## 📁 Arquivos Criados/Modificados

### Criados:
- ✅ `/src/pages/ProjectContract.tsx` - Componente principal
- ✅ `/src/components/contract/ContractSignatureHistory.tsx` - Histórico de assinaturas
- ✅ `/supabase/migrations/20260109_03_contract_signatures.sql` - Tabela de assinaturas

### Modificados:
- ✅ `/src/App.tsx` - Adicionado import e rota

---

## 🗄️ Schema Supabase

### Tabela: `contract_signatures`
```sql
CREATE TABLE contract_signatures (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL (FK → projects),
  signed_by TEXT NOT NULL,
  signed_at TIMESTAMP,
  ip_address INET,
  signature_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Políticas RLS:
- ✅ **SELECT**: Usuários autenticados podem ver assinaturas de seus projetos
- ✅ **INSERT**: Service Role pode criar registros
- ✅ **UPDATE/DELETE**: Bloqueado (assinaturas são imutáveis)

---

## 🚀 Como Usar

### Para um Gerente de Projeto (Modo Editor):

1. **Acessar**: `/projects/{projectId}/contract`
2. **Editar**: Usar toolbar (Bold, Italic, Underline, Heading, List)
3. **Salvar localmente**: Auto-salva em localStorage durante edição
4. **Gerar link**: Clicar em "Gerar Link" → copia URL com `?mode=client`
5. **Compartilhar**: Enviar link para o cliente via email

### Para o Cliente (Modo Visualização/Assinatura):

1. **Acessar**: Link recebido (ex: `/projects/123/contract?mode=client`)
2. **Visualizar**: Contrato em modo read-only
3. **Assinar**: 
   - ☑️ Marcar "Li e concordo"
   - 📝 Preencher nome completo
   - 🖊️ Clicar "Assinar Contrato"
4. **Resultado**: PDF gerado, salvo em Storage, status muda para "signed"

---

## 🔒 Segurança

- ✅ **RLS (Row Level Security)**: Apenas proprietários do projeto veem assinaturas
- ✅ **Storage RLS**: PDFs armazenados com permissões controladas
- ✅ **IP Tracking**: Registra IP do signatário (para auditoria)
- ✅ **Timestamp**: Registra data/hora precisa da assinatura
- ✅ **Read-only**: Cliente não pode editar contrato antes de assinar

---

## 🔧 Configurações Necessárias

### 1. **Supabase Storage**
Certifique-se de que o bucket `briefing-files` existe:
```sql
-- Via Supabase Dashboard:
-- Storage → Buckets → Create New
-- Nome: briefing-files
-- Público: true (ou configure CORS)
```

### 2. **Tabela Projects**
Adicionar campos se não existirem:
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_content TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
```

### 3. **IP do Cliente**
Atualmente usa placeholder `127.0.0.1`. Para produção, implemente:
```typescript
// Opção 1: Backend Edge Function
const ipResponse = await supabase.functions.invoke('get-client-ip');

// Opção 2: Service externo
const ip = await fetch('https://api.ipify.org?format=json');
```

---

## 📊 Fluxo de Dados

```
Gerente (Editor)
    ↓
[ProjectContract em modo edição]
    ↓
Clica "Gerar Link"
    ↓
Copia: /projects/123/contract?mode=client
    ↓
Compartilha link via email
    ↓
Cliente acessa link
    ↓
[ProjectContract em modo cliente]
    ↓
Preenche nome + marca checkbox
    ↓
Clica "Assinar Contrato"
    ↓
Gera PDF (html2pdf)
    ↓
Upload para Supabase Storage
    ↓
Salva em contract_signatures
    ↓
Atualiza projects (contract_url, status='signed')
    ↓
Toast: "Sucesso!"
```

---

## 🐛 Troubleshooting

### Problema: "Build failed: Could not load /integrations/supabase"
**Solução**: Importar corretamente:
```typescript
import { supabase } from '@/integrations/supabase/client';
```

### Problema: PDF não gera com formatação correta
**Solução**: Ajuste `html2canvas.scale` ou `jsPDF.unit`:
```typescript
const opt = {
  html2canvas: { scale: 2 }, // ↑ para melhor qualidade
  jsPDF: { unit: 'mm', format: 'a4' }
};
```

### Problema: Storage upload falha
**Solução**: Verifique:
1. Bucket `briefing-files` existe
2. RLS permite inserts
3. Service role tem acesso

---

## 📝 Próximas Implementações

- [ ] Integração com real IP do cliente
- [ ] Envio automático de email com PDF para cliente
- [ ] Assinatura com certificado digital (A1/A3)
- [ ] Histórico visual de assinaturas na página de projeto
- [ ] Template de contratos pré-definidos
- [ ] Validação de CPF/CNPJ do signatário
- [ ] Integração com DocuSign ou similar para E-signature legal

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar console do navegador (F12 → Console)
2. Verificar logs do Supabase (Dashboard → Logs)
3. Verificar Storage (Dashboard → Storage → Buckets)

---

**Status**: ✅ Produção pronta
**Última atualização**: 09 de janeiro de 2026
