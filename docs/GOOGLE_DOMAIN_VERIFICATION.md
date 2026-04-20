# Google Security Setup — 3 passos claros

Atualizado 2026-04-20 com a infra nova: botão **"Configurar stream"** no admin + recomendação DNS TXT.

## Atualização 2026-04-20 — Status

- Service Account JSON já foi setada como `GOOGLE_RISC_SA_JSON` em dev + prod (eu fiz)
- Meta tag placeholder já está em `index.html` (comentado — você só vai descomentar e preencher)

## Passo 1 — Domain verification (4 alternativas, escolhe a mais fácil)

**Truque:** no Search Console, se você tiver problemas com o método "Domínio" (que só aceita DNS), use **"Prefixo do URL"** em vez disso. Aí aparecem 4 métodos, **sem DNS**:

### Método A — Google Analytics (mais fácil, funciona em minutos)

Você já tem GA (ID `G-C24BXN2S6H`) integrado no site. Se você é **owner** dessa property no Analytics, o Search Console detecta e verifica automaticamente.

1. https://search.google.com/search-console/welcome
2. **Prefixo do URL** → digita `https://khaoskontrol.com.br`
3. Procura o método **"Google Analytics"** na lista
4. Clica "Verificar" — pronto

Se aparecer erro "você não é owner do GA": vá em https://analytics.google.com/ → Admin → Account Access Management → seu email deve ter role "Administrador".

### Método B — Meta tag HTML (preparado, só falta o código)

Eu já adicionei um placeholder comentado em [index.html](index.html):
```html
<!-- <meta name="google-site-verification" content="COLE_AQUI_O_CODIGO_DO_SEARCH_CONSOLE" /> -->
```

1. Search Console → **Prefixo do URL** → método **"HTML tag"**
2. Google gera uma tag tipo `<meta name="google-site-verification" content="abc123xyz..." />`
3. Me passa o valor do `content` OU você mesma descomenta a linha em `index.html` e cola
4. `npm run deploy` → Search Console → Verify

### Método C — Arquivo HTML (sem DNS, sem editar código)

1. Search Console → **Prefixo do URL** → método **"Arquivo HTML"**
2. Google gera arquivo tipo `google123abc.html` para download
3. Me passa o arquivo (posso só salvar em `public/`) OU você mesma põe em `public/`
4. `npm run deploy` → Search Console → Verify

### Método D — Google Tag Manager (só se você usa GTM)

Não vi GTM integrado no seu site, então não é o caminho. Pula.

---

**Minha recomendação final:** **Método A (Google Analytics)**. Você já tem GA configurado, é questão de 30 segundos. Só requer que você seja owner da property.

## Passo 1 antigo — DNS TXT (ainda disponível, mas só se preferir)

**Por que DNS e não HTML file ou meta tag?**
- DNS é permanente — não depende de deploy
- HTML file vai pra raiz (`/googleXXXX.html`) e precisa `npm run deploy` pra ativar
- Meta tag precisa editar `index.html` + deploy

**Passo a passo:**

1. Vá em https://search.google.com/search-console/welcome
2. **IMPORTANTE**: ter submetido sitemap NÃO significa domínio verified. Você precisa adicionar propriedade e provar.
3. Clique **Adicionar propriedade** → escolha **"Domínio"** (coluna da ESQUERDA, não "Prefixo do URL")
4. Digite: `khaoskontrol.com.br`
5. Google te dá uma string tipo:
   ```
   google-site-verification=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
6. Vá no **provedor de DNS** do seu domínio (onde você comprou/gerencia `khaoskontrol.com.br` — Registro.br, GoDaddy, Cloudflare, etc.)
7. Adicione um registro TXT:
   - **Tipo:** TXT
   - **Nome/Host:** `@` (ou em branco, depende do provedor — significa raiz do domínio)
   - **Valor:** cola a string inteira que o Google deu (com o `google-site-verification=` no começo)
   - **TTL:** deixa padrão (3600 ou auto)
8. Salva. Aguarda 5-30 minutos pra propagação.
9. Volta no Search Console e clica **Verificar**.

**Confirma que propagou** (antes de clicar Verify) no terminal:
```
nslookup -type=TXT khaoskontrol.com.br
```
Deve aparecer a linha `google-site-verification=...`.

---

## Passo 2 — OAuth consent screen: Authorized domains

Após domain verified:

1. Vá em https://console.cloud.google.com/apis/credentials/consent
2. Edite o OAuth consent screen (mesmo projeto onde a RISC API está)
3. Em **"Authorized domains"** adicione: `khaoskontrol.com.br`
4. Salvar

Isso some com o warning "domain not authorized".

---

## Passo 3 — RISC Stream (Cross-Account Protection)

### 3a. Criar Service Account

1. https://console.cloud.google.com/iam-admin/serviceaccounts
2. **+ Criar conta de serviço**
3. Nome: `risc-configuration` (qualquer nome)
4. Pula "Grant access" (vamos dar role depois)
5. Cria.

### 3b. Dar role de RISC Admin

1. Na lista, clica nos 3 pontinhos da SA criada → **Manage permissions**
2. OU vá em IAM → **+ Conceder acesso** → email da SA
3. Role: **RISC Configuration Admin**
4. Salva

### 3c. Baixar JSON key

1. Na página da SA → aba **Keys** → **Add key → Create new key → JSON**
2. Download automático. **Guarda esse arquivo** — é o único momento em que você consegue.

### 3d. Colar JSON como secret no Supabase

1. No terminal, abre o arquivo JSON baixado e **copia o conteúdo INTEIRO** (incluindo as chaves `{}`)
2. Rode (ou me manda o JSON e eu faço):
   ```bash
   npx supabase secrets set GOOGLE_RISC_SA_JSON='<cola-todo-o-conteudo-do-json-aqui>' --project-ref nqufpfpqtycxxqtnkkfh
   npx supabase secrets set GOOGLE_RISC_SA_JSON='<cola-todo-o-conteudo-do-json-aqui>' --project-ref pymdkngcpbmcnayxieod
   ```
   **Atenção:** escape as aspas do JSON (ou use `'...'` simples como no exemplo acima).

### 3e. Clicar "Configurar stream" no admin

1. Abre `/admin` → aba **Integrations**
2. Role até o card **"Google Cross-Account Protection (RISC)"**
3. Clica em **Verificar status** — deve mostrar que o stream não existe ainda
4. Clica em **Configurar stream** — Edge Function vai usar a SA pra cadastrar o receiver no Google
5. Clica em **Testar conexão** — Google manda um evento de verificação. Espera ~10s.
6. Pra conferir: no Supabase Dashboard → SQL Editor:
   ```sql
   select event_type, subject_email, received_at, action_taken
   from public.risc_events
   order by received_at desc limit 5;
   ```
   Deve aparecer um evento `https://schemas.openid.net/secevent/risc/event-type/verification`.

### 3f. (Segurança) Depois de confirmar, pode apagar a SA key local

O arquivo JSON baixado na etapa 3c não precisa ficar no teu computador. Pode apagar.

---

## Status atual

| Item | Status |
|---|---|
| Domain verification | ⏳ **Você faz** (Passo 1) |
| Authorized domain OAuth consent | ⏳ **Você faz** (Passo 2, após passo 1) |
| RISC receiver Edge Function | ✅ Deployed em dev + prod |
| `risc-setup` Edge Function | ✅ Deployed em dev + prod |
| OAuth state CSRF + PKCE | ✅ Implementado |
| RISC stream configurado | ⏳ **Você faz** (Passo 3a-3e) |
| `oauth_states` + `risc_events` tables | ✅ Criadas |

---

## Se der erro

- **"GOOGLE_RISC_SA_JSON secret not configured"** — pulou 3d.
- **"Token exchange failed: invalid_scope"** — a SA não tem o role RISC Configuration Admin (pulou 3b).
- **"Stream not found"** no Status — normal na primeira vez, é pra aparecer "Configurar stream" depois.
- **"DNS não encontra TXT"** — propagação ainda, espera mais 30 min. Teste com `nslookup`.
