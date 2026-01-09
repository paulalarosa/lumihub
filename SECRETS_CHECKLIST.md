# 🚀 CHECKLIST RÁPIDO - SECRETS DO SUPABASE

## ✅ O QUE VOCÊ DEVE FAZER AGORA

### 1️⃣ ACESSE O SUPABASE DASHBOARD
```
https://app.supabase.com/project/pymdkngcpbmcnayxieod/settings/functions
```

### 2️⃣ VÁ PARA "Edge Functions" → "Secrets"

### 3️⃣ CLIQUE EM "New Secret" E ADICIONE CADA UM:

---

## 📋 SECRETS PARA COPIAR E COLAR

### 🔴 CRÍTICOS (Adicione PRIMEIRO)

```
Nome: GOOGLE_CLIENT_ID
Valor: [obter em https://console.cloud.google.com]

Nome: GOOGLE_CLIENT_SECRET
Valor: [obter em https://console.cloud.google.com]

Nome: MERCADO_PAGO_ACCESS_TOKEN
Valor: [obter em https://www.mercadopago.com.br/developers]

Nome: MERCADO_PAGO_WEBHOOK_SECRET
Valor: [obter em https://www.mercadopago.com.br/developers]
```

---

### 🟡 IMPORTANTES (Adicione DEPOIS)

```
Nome: VITE_GOOGLE_MAPS_API_KEY
Valor: [obter em https://console.cloud.google.com/apis]

Nome: RESEND_API_KEY
Valor: re_LT41kFmK_N88jnFT4PJFHEmGjkYB1w9MT

Nome: RESEND_TO
Valor: prenata@gmail.com
```

---

### 🟢 VERIFICAR (Opcional)

```
Nome: LOVABLE_API_KEY
Valor: [obter se necessário]
```

---

## 🔗 COMO OBTER CADA CHAVE

### **GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET**
1. Acesse: https://console.cloud.google.com/
2. Crie novo projeto ou selecione existente
3. Vá para "APIs & Services" → "Credentials"
4. Clique em "Create Credentials" → "OAuth 2.0 Client ID"
5. Tipo: **Web Application**
6. Authorized redirect URIs: `https://pymdkngcpbmcnayxieod.supabase.co/auth/v1/callback`
7. Clique "Create" e copie Client ID e Secret

---

### **MERCADO_PAGO_ACCESS_TOKEN + WEBHOOK_SECRET**
1. Acesse: https://www.mercadopago.com.br/developers
2. Faça login com sua conta
3. Vá para "Your integrations"
4. Selecione a aplicação (ou crie uma)
5. Em "Credentials" copie: **Access Token**
6. Em "Webhooks" copie: **Signature Key** (= WEBHOOK_SECRET)

---

### **VITE_GOOGLE_MAPS_API_KEY**
1. Acesse: https://console.cloud.google.com/
2. Vá para "APIs & Services" → "Enable APIs and Services"
3. Procure por "Maps JavaScript API"
4. Clique em "Enable"
5. Vá para "Credentials"
6. Clique "Create Credentials" → "API Key"
7. Copie a chave gerada

---

### **RESEND_API_KEY + RESEND_TO**
✅ **JÁ TEMOS NO .env LOCAL!**
- API Key: `re_LT41kFmK_N88jnFT4PJFHEmGjkYB1w9MT`
- Recipient: `prenata@gmail.com`
- Apenas copie para o Supabase

---

## 📝 PASSO A PASSO VISUAL

```
Supabase Dashboard
    ↓
Project Settings (engrenagem no canto superior direito)
    ↓
Sidebar esquerdo → "Functions"
    ↓
Aba "Secrets"
    ↓
Botão "New Secret" (canto superior direito)
    ↓
Insira Nome (ex: GOOGLE_CLIENT_ID)
    ↓
Insira Valor
    ↓
Clique "Add Secret"
    ↓
Repita para cada secret da lista
```

---

## ✅ VERIFICAÇÃO APÓS ADICIONAR

Depois de adicionar todos os secrets, teste cada função:

```
1. Agenda → Sincronizar Google Calendar
   Esperado: ✅ Funciona
   Se falhar: Verificar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

2. Projetos → Criar Pagamento
   Esperado: ✅ Gera link de pagamento
   Se falhar: Verificar MERCADO_PAGO_ACCESS_TOKEN

3. Eventos → Mostrar localização no mapa
   Esperado: ✅ Mapa carrega
   Se falhar: Verificar VITE_GOOGLE_MAPS_API_KEY

4. Contato → Enviar formulário
   Esperado: ✅ Email recebido
   Se falhar: Verificar RESEND_API_KEY, RESEND_TO
```

---

## 🆘 ERROS COMUNS

| Erro | Causa | Solução |
|------|-------|---------|
| `GOOGLE_CLIENT_ID not configured` | Secret não foi adicionado | Adicionar secret no Supabase |
| `401 Unauthorized` (Google Calendar) | Chave errada ou expirada | Regenerar no Google Console |
| `MERCADO_PAGO_ACCESS_TOKEN not configured` | Secret faltando | Adicionar secret |
| `Google Maps API Key não configurada` | Secret faltando | Adicionar secret |
| `RESEND_API_KEY not configured` | Secret faltando | Copiar do .env local |

---

## ⏱️ TEMPO ESTIMADO
- Obter todas as chaves: **45 min**
- Adicionar ao Supabase: **5 min**
- Testar: **5 min**
- **TOTAL: ~55 minutos**

---

## 📞 SUPORTE

Se tiver dúvidas:
1. Consulte `INTEGRACAO_AUDITORIA_COMPLETA.md` para detalhes técnicos
2. Acesse a documentação oficial dos serviços
3. Verifique os logs de Edge Functions no Supabase Dashboard

---

**Versão:** 1.0  
**Atualizado em:** 9 de janeiro de 2026
