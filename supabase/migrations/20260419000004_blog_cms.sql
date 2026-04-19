-- Blog CMS: move blog posts from hardcoded to database.
-- Public readable, admin-writable.

BEGIN;

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  category text,
  image_url text,
  author text DEFAULT 'KHAOS KONTROL Editorial',
  read_time text,
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT true,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx
  ON public.blog_posts(is_published, published_at DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published posts" ON public.blog_posts;
CREATE POLICY "Public can read published posts"
  ON public.blog_posts FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage posts" ON public.blog_posts;
CREATE POLICY "Admins can manage posts"
  ON public.blog_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.touch_blog_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_touch_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_touch_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_blog_posts_updated_at();

INSERT INTO public.blog_posts (
  slug, title, excerpt, content, category, image_url,
  read_time, is_featured, published_at
) VALUES
  (
    'vencer-na-carreira-maker',
    'A Ciência do Sucesso na Carreira de Makeup Artist',
    'Como estruturar sua carreira do zero ao reconhecimento internacional no mercado de beleza de luxo.',
    E'<p>Em uma indústria onde a criatividade encontra o comércio, os profissionais de beleza de maior sucesso são aqueles que pensam além do projeto imediato. A gestão de carreira para maquiadores e empreendedores da beleza não trata apenas de executar um trabalho bonito — trata-se de construir um negócio sustentável e escalável que se alinhe aos seus valores e objetivos financeiros.</p>\n\n<p>O primeiro passo para projetar seu caminho artístico é entender onde você está agora. Faça um inventário de suas fontes de renda atuais. Você está dependendo de um único tipo de projeto? Você tem clientes recorrentes constantes ou sua agenda é instável? Muitos artistas se veem presos em um ciclo onde estão constantemente perseguindo o próximo trabalho, sem tempo para o pensamento estratégico. É precisamente quando o esgotamento aparece e a criatividade sofre.</p>\n\n<p>A diversificação é a pedra angular de carreiras sustentáveis. Considere como você pode expandir suas ofertas sem diluir sua expertise principal. Uma maquiadora de noivas pode adicionar aulas de maquiagem, consultoria editorial ou curadoria de produtos ao seu portfólio. Essas ofertas não apenas geram receita adicional, mas também posicionam você como uma líder de pensamento em seu espaço.</p>',
    'CARREIRA',
    '/blog/career-success.png',
    '8 min',
    true,
    '2025-03-15T00:00:00Z'
  ),
  (
    'tendencias-noivas-2025',
    'Tendências de Maquiagem Nupcial para 2025',
    'Descubra as texturas, cores e acabamentos que vão dominar as cerimônias mais exclusivas da temporada.',
    E'<p>Ao entrarmos em 2025, a beleza nupcial está passando por uma mudança profunda em direção ao minimalismo aliado ao luxo. Já se foram os dias de contorno pesado e traços exagerados. A noiva de hoje busca autenticidade — uma versão polida de si mesma que fotografa lindamente, mas que ainda se sente natural ao se olhar no espelho no dia do casamento.</p>\n\n<p>A abordagem "skin-first" domina. Isso significa investir em cuidados com a pele semanas antes do casamento, focando em hidratação, luminosidade e uma tez uniforme. A maquiagem em si torna-se uma segunda camada, realçando em vez de transformar. Pense em pele viçosa, base quase imperceptível e iluminação estratégica que captura a luz naturalmente.</p>\n\n<p>Em termos de tendência, o "soft sculpting" substituiu o contorno agressivo. Em vez de linhas duras, os maquiadores estão usando sombras de tons frios e finamente esfumadas para criar uma dimensão sutil. Os olhos tendem a tons neutros e terrosos com transições mais suaves. Para o trabalho editorial de noivas, acentos metálicos estão fazendo um retorno silencioso — mas executados com contenção.</p>',
    'ESTILO',
    '/blog/bridal-2025.png',
    '6 min',
    false,
    '2025-03-10T00:00:00Z'
  ),
  (
    'contratos-digitais-luxo',
    'A Importância de Contratos Digitais no Mercado de Luxo',
    'Segurança jurídica e experiência do cliente: por que a automação é o novo padrão ouro.',
    E'<p>A independência financeira é o luxo máximo para profissionais criativos. É a liberdade de escolher seus clientes, recusar projetos que não se alinham com sua visão e investir em ferramentas e experiências que genuinamente servem ao seu ofício. No entanto, muitos artistas lutam com precificação, poupança e planejamento financeiro de longo prazo.</p>\n\n<p>A precificação é onde muitos criativos perdem dinheiro. Sua taxa deve refletir não apenas o tempo gasto com o cliente, mas sua expertise, custos de equipamento, educação contínua, seguro e o valor que você entrega. O preço de uma maquiadora não é apenas pelas horas de aplicação — é por anos de treinamento e pela confiança que você dá ao seu cliente.</p>',
    'NEGÓCIOS',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2000&auto=format&fit=crop',
    '10 min',
    false,
    '2025-03-05T00:00:00Z'
  ),
  (
    'marketing-digital-makeup',
    'Domine o Algoritmo: Marketing para Maquiadoras',
    'Estratégias avançadas de posicionamento para atrair clientes de alto ticket no Instagram e TikTok.',
    E'<p>O networking é frequentemente mal compreendido como transacional. Mas para profissionais criativos, o networking é algo muito mais significativo: é a arte de construir relacionamentos genuínos que levam a colaborações, mentoria e crescimento mútuo. Quando feito de forma autêntica, torna-se a pedra angular de uma carreira próspera.</p>\n\n<p>As colaborações são onde a mágica acontece. A parceria com fotógrafos, designers de moda e estilistas expande seu portfólio e expõe você a novos públicos. As parcerias de marca representam o próximo nível de crescimento profissional. As marcas querem trabalhar com artistas que tenham uma voz distinta e uma audiência engajada.</p>',
    'MARKETING',
    'https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=2000&auto=format&fit=crop',
    '12 min',
    false,
    '2025-03-01T00:00:00Z'
  )
ON CONFLICT (slug) DO NOTHING;

COMMIT;
