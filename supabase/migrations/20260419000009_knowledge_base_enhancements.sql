-- Turn knowledge_base into a usable Help Center table.
-- Adds slug for URL routing, is_published toggle, excerpt, RLS, and seed content.

BEGIN;

ALTER TABLE public.knowledge_base
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_base_slug_idx
  ON public.knowledge_base(slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS knowledge_base_published_idx
  ON public.knowledge_base(is_published, sort_order, created_at DESC);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published articles" ON public.knowledge_base;
CREATE POLICY "Public can read published articles"
  ON public.knowledge_base FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage articles" ON public.knowledge_base;
CREATE POLICY "Admins can manage articles"
  ON public.knowledge_base FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

INSERT INTO public.knowledge_base (slug, title, category, excerpt, content, tags, is_published, sort_order)
VALUES
  (
    'como-comecar',
    'Como começar no Khaos Kontrol',
    'Primeiros passos',
    'Guia rápido para configurar sua conta e começar a organizar seus clientes em 10 minutos.',
    E'<h2>Bem-vinda ao Khaos Kontrol</h2><p>Em 10 minutos você tem sua operação organizada. Siga os passos abaixo:</p><h3>1. Complete seu perfil</h3><p>Vá em Configurações e preencha seu nome profissional, CPF, endereço e telefone. Esses dados aparecem automaticamente nos contratos.</p><h3>2. Cadastre seus serviços</h3><p>Em "Serviços", crie os pacotes que você oferece (noiva, social, editorial…). Inclua duração e preço — eles serão usados em contratos e agendamentos públicos.</p><h3>3. Conecte seu Google Calendar</h3><p>Em Integrações, autorize o Google Calendar. Seus eventos do Khaos vão sincronizar automaticamente.</p><h3>4. Cadastre sua primeira noiva</h3><p>Em Clientes, clique em "Nova cliente". Preencha os dados básicos — o portal exclusivo dela é criado automaticamente.</p>',
    ARRAY['onboarding', 'primeiros-passos'],
    true,
    1
  ),
  (
    'convidar-assistentes',
    'Como convidar assistentes para seu time',
    'Time',
    'Adicione maquiadoras do seu time com acesso controlado ao calendário e clientes.',
    E'<h2>Time + assistentes</h2><p>No plano Studio, você pode convidar até 10 assistentes pra colaborar com você.</p><h3>Enviar o convite</h3><p>Em <strong>Assistentes</strong>, clique em "Novo convite". Digite o email da assistente. Ela recebe um link que permite ela criar a própria senha e acessar.</p><h3>O que a assistente vê</h3><p>Ela vê os clientes, agenda e eventos — mas NÃO vê a tela de assinatura nem dados financeiros consolidados. Isso é controlado automaticamente.</p><h3>Remover acesso</h3><p>Na mesma tela, clique no botão de remover ao lado da assistente. O acesso é cortado na hora.</p>',
    ARRAY['time', 'assistentes'],
    true,
    2
  ),
  (
    'gerar-contratos',
    'Como gerar e enviar contratos digitais',
    'Contratos',
    'Contratos com assinatura digital em 2 cliques — sem papel, sem cartório.',
    E'<h2>Contratos digitais</h2><p>Todo projeto pode gerar um contrato automaticamente com os dados da cliente, serviço e valor.</p><h3>Gerar o contrato</h3><p>Abra o projeto da noiva. Clique em "Gerar contrato". O PDF é criado com seus dados profissionais, os dados da noiva e o serviço contratado.</p><h3>Enviar pra assinatura</h3><p>O link de assinatura é enviado automaticamente por email e WhatsApp. A noiva assina digitalmente pelo celular.</p><h3>Validade jurídica</h3><p>A assinatura é certificada com timestamp e IP, tendo a mesma validade de uma assinatura em papel conforme a Lei 14.063/20.</p>',
    ARRAY['contratos', 'assinatura'],
    true,
    3
  ),
  (
    'agendamento-publico',
    'Link público de agendamento',
    'Agendamento',
    'Compartilhe um link e receba agendamentos direto no seu calendário, sem digitar nada.',
    E'<h2>Agendamento automático</h2><p>Cada profissional tem um link único tipo <code>khaoskontrol.com.br/b/seu-slug</code> que a cliente usa pra agendar sozinha.</p><h3>Configurar</h3><p>Em Configurações > Agendamento Público, defina seu slug (ex: "maria-makeup"). Ele vira a URL do seu link.</p><h3>Como funciona pra cliente</h3><p>Ela escolhe o serviço, vê os horários disponíveis (já filtrando seus compromissos do Google Calendar), preenche nome + WhatsApp e confirma.</p><h3>Como chega pra você</h3><p>O agendamento aparece no calendário e na lista de clientes automaticamente. Você recebe notificação no sino do app.</p>',
    ARRAY['agendamento', 'booking'],
    true,
    4
  ),
  (
    'cancelar-assinatura',
    'Como cancelar ou trocar seu plano',
    'Assinatura',
    'Cancele a qualquer momento sem burocracia. Seu acesso continua até o fim do período já pago.',
    E'<h2>Cancelar assinatura</h2><p>Você pode cancelar ou trocar de plano a qualquer momento.</p><h3>Cancelamento</h3><p>Vá em <strong>Assinatura</strong> no menu lateral. Na seção "Zona de risco", clique em "Cancelar assinatura". Seu acesso permanece ativo até o fim do período que você já pagou.</p><h3>Reativar antes de expirar</h3><p>Se mudou de ideia, volte em Assinatura e clique em "Reativar assinatura" antes da data de expiração.</p><h3>Trocar de plano</h3><p>Em Assinatura > "Trocar de plano", você vai pra página de planos e escolhe o novo. O valor é ajustado proporcionalmente.</p>',
    ARRAY['assinatura', 'billing'],
    true,
    5
  )
ON CONFLICT DO NOTHING;

COMMIT;
