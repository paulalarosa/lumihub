# 🔐 Auditoria Completa de Integrações e API Keys - Lumihub

**Data:** 9 de janeiro de 2026  
**Status:** Análise de Produção Necessária ⚠️

---

## 1️⃣ SERVIÇOS EXTERNOS DETECTADOS

| # | Serviço | Tipo | Status | Prioridade |
|---|---------|------|--------|-----------|
| 1 | **Supabase Auth** | Auth | ✅ Integrado | CRÍTICO |
| 2 | **Supabase DB** | Database | ✅ Integrado | CRÍTICO |
| 3 | **Supabase Storage** | File Upload | ✅ Integrado | CRÍTICO |
| 4 | **Google Calendar** | Sincronização | ⚠️ Parcial | ALTO |
| 5 | **Resend** | Email | ✅ Parcial | MÉDIO |
| 6 | **Mercado Pago** | Pagamentos | ⚠️ Esperando Config | ALTO |
| 7 | **Google Maps** | Mapas | ❌ Faltando Chave | MÉDIO |
| 8 | **Lovable AI** | IA Assistant | ⚠️ Necessário Config | MÉDIO |

---

## 2️⃣ CHAVES FALTANTES - CHECKLIST DE AÇÃO ⚠️

### 🔴 CRÍTICAS (Aplicação não funciona sem estas)

#### **A. Google Calendar (3 Chaves Necessárias)**
```
Função: google-calendar-auth, google-calendar-assistant-sync, google-calendar-sync
Variáveis Esperadas:
  ✓ GOOGLE_CLIENT_ID
  ✓ GOOGLE_CLIENT_SECRET
```
**Ação Necessária:**
1. Acesse: https://console.cloud.google.com/
2. Crie OAuth 2.0 Credentials (tipo: Web Application)
3. Authorized redirect URI: `https://pymdkngcpbmcnayxieod.supabase.co/auth/v1/callback`
4. Copie Client ID e Client Secret
5. Adicione no Supabase (veja seção 3)

**Status Atual:** ❌ **NÃO CONFIGURADO** → Isso causa erro 401 ao sincronizar calendário

---

#### **B. Mercado Pago (2 Chaves Necessárias)**
```
Funções: create-payment, mercadopago-webhook
Variáveis Esperadas:
  ✓ MERCADO_PAGO_ACCESS_TOKEN (access_token)
  ✓ MERCADO_PAGO_WEBHOOK_SECRET (signature_key)
```
**Ação Necessária:**
1. Acesse: https://www.mercadopago.com.br/developers/pt/reference
2. Crie aplicação no Mercado Pago
3. Copie Access Token (começa com `APP_USR-`)
4. Copie Webhook Signature Secret
5. Adicione no Supabase (veja seção 3)

**Status Atual:** ⚠️ **PARCIALMENTE FALTANDO** → Pagamentos não funcionam

---

#### **C. Google Maps API Key**
```
Função: get-maps-key
Variável Esperada:
  ✓ VITE_GOOGLE_MAPS_API_KEY
```
**Ação Necessária:**
1. Acesse: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
2. Ative a API de Maps
3. Crie um API Key de restrição de aplicativo web
4. Copie a chave
5. Adicione no Supabase (veja seção 3)

**Status Atual:** ❌ **NÃO CONFIGURADO** → Mapas não carregam

---

### 🟡 IMPORTANTES (Aplicação funciona, mas features incompletas)

#### **D. Resend Email API**
```
Função: send-application
Variáveis Esperadas:
  ✓ RESEND_API_KEY (já em .env frontend)
  ✓ RESEND_TO (já em .env frontend)
```
**Status Atual:** ✅ **JÁ CONFIGURADO** (veja `.env` local)
- `RESEND_API_KEY`: `re_LT41kFmK_N88jnFT4PJFHEmGjkYB1w9MT`
- `RESEND_TO`: `prenata@gmail.com`

⚠️ **ALERTA:** Copie estes valores para o Supabase também!

---

#### **E. Lovable AI Assistant**
```
Função: ai-assistant
Variável Esperada:
  ✓ LOVABLE_API_KEY
```
**Ação Necessária:**
- Se Lovable for um serviço externo: obter chave
- Se Lovable for Lovable.dev: gerenciado nativamente (veja seção 3)

**Status Atual:** ⚠️ **NECESSÁRIO VERIFICAR**

---

### 🟢 JÁ CONFIGURADOS

#### **F. Supabase (Automático)**
```
Variáveis (automáticas no Supabase):
  ✓ SUPABASE_URL
  ✓ SUPABASE_ANON_KEY
  ✓ SUPABASE_SERVICE_ROLE_KEY
```
**Status:** ✅ Já integrado nativamente no Supabase

---

## 3️⃣ INTEGRAÇÕES LOVABLE (Out-of-the-Box)

| Serviço | Gerenciado por Lovable? | Ação Necessária |
|---------|-------------------------|-----------------|
| **Supabase Auth** | ✅ SIM | Nenhuma (automático) |
| **Supabase DB** | ✅ SIM | Nenhuma (automático) |
| **Supabase Storage** | ✅ SIM | Nenhuma (automático) |
| **Resend Email** | ❌ NÃO | Configurar manualmente |
| **Google Calendar** | ❌ NÃO | Configurar manualmente |
| **Mercado Pago** | ❌ NÃO | Configurar manualmente |
| **Google Maps** | ❌ NÃO | Configurar manualmente |
| **Lovable AI** | ✅ VERIFICAR | Dependente de integração |

---

## 4️⃣ CHECKLIST - COPIE E COLE NO SUPABASE 📋

### **PASSO 1: Acesse Supabase Dashboard**
```
https://app.supabase.com/project/pymdkngcpbmcnayxieod/settings/functions
```

### **PASSO 2: Vá para "Edge Functions" → "Secrets"**
(Ou: Project Settings → Edge Functions → Secrets)

### **PASSO 3: Adicione cada Secret clicando em "New Secret"**

---

### ✅ ADICIONE ESTES SECRETS NO SUPABASE

```bash
# 1️⃣ GOOGLE CALENDAR (CRÍTICO)
Key: GOOGLE_CLIENT_ID
Value: [obter de console.cloud.google.com]

Key: GOOGLE_CLIENT_SECRET
Value: [obter de console.cloud.google.com]

# 2️⃣ MERCADO PAGO (CRÍTICO)
Key: MERCADO_PAGO_ACCESS_TOKEN
Value: [obter de mercadopago.com/developers]

Key: MERCADO_PAGO_WEBHOOK_SECRET
Value: [obter de mercadopago.com/developers]

# 3️⃣ GOOGLE MAPS (IMPORTANTE)
Key: VITE_GOOGLE_MAPS_API_KEY
Value: [obter de console.cloud.google.com/apis]

# 4️⃣ RESEND EMAIL (IMPORTANTE - COPIE DO .env LOCAL)
Key: RESEND_API_KEY
Value: re_LT41kFmK_N88jnFT4PJFHEmGjkYB1w9MT

Key: RESEND_TO
Value: prenata@gmail.com

# 5️⃣ LOVABLE AI (VERIFICAR SE NECESSÁRIO)
Key: LOVABLE_API_KEY
Value: [obter se usar API externa]
```

---

## 5️⃣ FUNÇÕES COM ERROS - DIAGNÓSTICO

### 🔴 **Função: `google-calendar-auth`**
**Esperado por:** Sincronização de calendário com Google  
**Chaves Requeridas:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` (automático)

**Status:** ❌ FALHARÁ SEM AS CHAVES  
**Erro Esperado:** `401 Unauthorized` ao tentar OAuth

---

### 🔴 **Função: `google-calendar-sync`**
**Esperado por:** Sincronização em tempo real  
**Chaves Requeridas:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Status:** ❌ FALHARÁ SEM AS CHAVES

---

### 🔴 **Função: `create-payment`**
**Esperado por:** Criação de pagamentos  
**Chaves Requeridas:**
- `MERCADO_PAGO_ACCESS_TOKEN`

**Status:** ❌ FALHARÁ SEM A CHAVE  
**Erro Esperado:** `'Mercado Pago não configurado'`

---

### 🔴 **Função: `mercadopago-webhook`**
**Esperado por:** Confirmação de pagamento  
**Chaves Requeridas:**
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`

**Status:** ⚠️ FUNCIONA SEM SECRET (sem validação), MAS INSEGURO

---

### 🔴 **Função: `get-maps-key`**
**Esperado por:** Carregamento de Google Maps  
**Chaves Requeridas:**
- `VITE_GOOGLE_MAPS_API_KEY`

**Status:** ❌ RETORNA ERRO 404  
**Erro Esperado:** `'Google Maps API Key não configurada'`

---

### 🟡 **Função: `ai-assistant`**
**Esperado por:** AI Chat Assistant  
**Chaves Requeridas:**
- `LOVABLE_API_KEY` (se for API externa)

**Status:** ⚠️ NECESSÁRIO VERIFICAR  
**Erro Esperado:** `'LOVABLE_API_KEY is not configured'`

---

### 🟡 **Função: `send-application`**
**Esperado por:** Envio de emails de contato  
**Chaves Requeridas:**
- `RESEND_API_KEY` ✓ JÁ TEMOS
- `RESEND_TO` ✓ JÁ TEMOS

**Status:** ✅ PARCIALMENTE PRONTO  
**Ação:** Copiar do `.env` local para Supabase Secrets

---

### ✅ **Função: `settlement-process`**
**Esperado por:** Liquidação financeira  
**Chaves Requeridas:**
- `SUPABASE_SERVICE_ROLE_KEY` (automático)

**Status:** ✅ OK (não requer chaves externas)

---

### ✅ **Função: `admin-ghost-login`**
**Esperado por:** Login administrativo  
**Chaves Requeridas:**
- `SUPABASE_SERVICE_ROLE_KEY` (automático)

**Status:** ✅ OK

---

### ✅ **Função: `google-calendar-webhook`**
**Esperado por:** Webhook do Google Calendar  
**Chaves Requeridas:**
- Nenhuma (valida tokens JWT do Google)

**Status:** ✅ OK

---

## 6️⃣ RESUMO EXECUTIVO

### ⚠️ **O QUE ESTÁ QUEBRADO AGORA:**
1. ❌ Google Calendar sync → **ERRO 401** (chaves faltam)
2. ❌ Pagamentos Mercado Pago → **Não funciona** (chave falta)
3. ❌ Google Maps → **Retorna 404** (chave falta)
4. ⚠️ AI Assistant → **Pode falhar** (verificar LOVABLE_API_KEY)

### ✅ **O QUE FUNCIONA:**
1. ✅ Autenticação Supabase
2. ✅ Database Supabase
3. ✅ Storage Supabase
4. ✅ Emails (Resend) - precisa copiar chaves
5. ✅ Admin functions

### 🎯 **PRÓXIMOS PASSOS (em ordem de prioridade):**

1. **[15 min]** Obter GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
2. **[15 min]** Obter MERCADO_PAGO_ACCESS_TOKEN e WEBHOOK_SECRET
3. **[10 min]** Obter VITE_GOOGLE_MAPS_API_KEY
4. **[5 min]** Copiar RESEND_API_KEY e RESEND_TO do `.env` local
5. **[5 min]** Adicionar todos ao Supabase Secrets
6. **[5 min]** Testar cada função

---

## 7️⃣ COMO ADICIONAR SECRETS NO SUPABASE

### **Via Dashboard:**
```
1. Acesse: https://app.supabase.com/project/pymdkngcpbmcnayxieod
2. Sidebar → Project Settings
3. Edge Functions → Secrets
4. "New Secret" para cada chave
5. Digite o nome exato (case-sensitive!) e valor
6. Clique "Add secret"
7. Deploy automático
```

### **Via CLI (alternativa):**
```bash
supabase secrets set GOOGLE_CLIENT_ID=sua_chave_aqui
supabase secrets set GOOGLE_CLIENT_SECRET=sua_chave_aqui
supabase secrets set MERCADO_PAGO_ACCESS_TOKEN=sua_chave_aqui
# etc...
```

---

## 8️⃣ OBSERVAÇÕES CRÍTICAS

### ⚠️ **Segurança:**
- Nunca commit secrets em git (`.env` é local!)
- Sempre use Supabase Secrets para produção
- Mercado Pago webhook secret é case-sensitive

### 📱 **Google Calendar:**
- OAuth 2.0 requer redirect URI exato
- Tokens expiram (refresh automático implementado)
- Cada assistente precisa de token válido

### 💳 **Mercado Pago:**
- Access Token = `APP_USR-` + caracteres
- Webhook Secret = SHA256 signing key
- IPN = Instant Payment Notification (deprecated, usar Webhooks)

### 🗺️ **Google Maps:**
- API Key pode ter restrições por domínio
- Configure em Google Console: `pymdkngcpbmcnayxieod.supabase.co`

---

## 9️⃣ REFERÊNCIAS RÁPIDAS

| Serviço | Link | Documento |
|---------|------|-----------|
| **Google Cloud Console** | https://console.cloud.google.com | OAuth 2.0, Maps API |
| **Mercado Pago Devs** | https://www.mercadopago.com.br/developers | Access Token, Webhooks |
| **Supabase Secrets** | https://app.supabase.com/project/pymdkngcpbmcnayxieod/settings/functions | Add secrets aqui |
| **Resend Docs** | https://resend.com/docs | Já configurado |

---

## 🔟 PRÓXIMAS MELHORIAS SUGERIDAS

- [ ] Implementar retry logic para APIs externas
- [ ] Adicionar monitoring de falhas de integração
- [ ] Criar dashboard de status de APIs
- [ ] Implementar rate limiting para Mercado Pago
- [ ] Cache de Google Maps responses
- [ ] Fallback para quando Google Calendar falha

---

**Gerado em:** 9 de janeiro de 2026  
**Projeto:** Lumihub CRM  
**Stack:** React + TypeScript + Supabase + Deno Edge Functions
