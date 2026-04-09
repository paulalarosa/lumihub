import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const articleData: Record<string, Record<string, string>> = {
  'vencer-na-carreira-maker': {
    title: 'A Ciência do Sucesso na Carreira de Makeup Artist',
    author: 'KHAOS KONTROL Editorial',
    date: '15 Mar 2025',
    image: '/blog/career-success.png',
    content: `
      <p>Em uma indústria onde a criatividade encontra o comércio, os profissionais de beleza de maior sucesso são aqueles que pensam além do projeto imediato. A gestão de carreira para maquiadores e empreendedores da beleza não trata apenas de executar um trabalho bonito — trata-se de construir um negócio sustentável e escalável que se alinhe aos seus valores e objetivos financeiros.</p>
      
      <p>O primeiro passo para projetar seu caminho artístico é entender onde você está agora. Faça um inventário de suas fontes de renda atuais. Você está dependendo de um único tipo de projeto? Você tem clientes recorrentes constantes ou sua agenda é instável? Muitos artistas se veem presos em um ciclo onde estão constantemente perseguindo o próximo trabalho, sem tempo para o pensamento estratégico. É precisamente quando o esgotamento aparece e a criatividade sofre.</p>
      
      <p>A diversificação é a pedra angular de carreiras sustentáveis. Considere como você pode expandir suas ofertas sem diluir sua expertise principal. Uma maquiadora de noivas pode adicionar aulas de maquiagem, consultoria editorial ou curadoria de produtos ao seu portfólio. Essas ofertas não apenas geram receita adicional, mas também posicionam você como uma líder de pensamento em seu espaço.</p>
    `,
  },
  'tendencias-noivas-2025': {
    title: 'Tendências de Maquiagem Nupcial para 2025: Minimalismo de Luxo',
    author: 'KHAOS KONTROL Editorial',
    date: '10 Mar 2025',
    image: '/blog/bridal-2025.png',
    content: `
      <p>Ao entrarmos em 2025, a beleza nupcial está passando por uma mudança profunda em direção ao minimalismo aliado ao luxo. Já se foram os dias de contorno pesado e traços exagerados. A noiva de hoje busca autenticidade — uma versão polida de si mesma que fotografa lindamente, mas que ainda se sente natural ao se olhar no espelho no dia do casamento.</p>
      
      <p>A abordagem "skin-first" domina. Isso significa investir em cuidados com a pele semanas antes do casamento, focando em hidratação, luminosidade e uma tez uniforme. A maquiagem em si torna-se uma segunda camada, realçando em vez de transformar. Pense em pele viçosa, base quase imperceptível e iluminação estratégica que captura a luz naturalmente.</p>
      
      <p>Em termos de tendência, o "soft sculpting" substituiu o contorno agressivo. Em vez de linhas duras, os maquiadores estão usando sombras de tons frios e finamente esfumadas para criar uma dimensão sutil. Os olhos tendem a tons neutros e terrosos com transições mais suaves. Para o trabalho editorial de noivas, acentos metálicos estão fazendo um retorno silencioso — mas executados com contenção.</p>
    `,
  },
  'contratos-digitais-luxo': {
    title: 'A Importância de Contratos Digitais no Mercado de Luxo',
    author: 'KHAOS KONTROL Editorial',
    date: '05 Mar 2025',
    image:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2000&auto=format&fit=crop',
    content: `
      <p>A independência financeira é o luxo máximo para profissionais criativos. É a liberdade de escolher seus clientes, recusar projetos que não se alinham com sua visão e investir em ferramentas e experiências que genuinamente servem ao seu ofício. No entanto, muitos artistas lutam com precificação, poupança e planejamento financeiro de longo prazo.</p>
      
      <p>A precificação é onde muitos criativos perdem dinheiro. Sua taxa deve refletir não apenas o tempo gasto com o cliente, mas sua expertise, custos de equipamento, educação contínua, seguro e o valor que você entrega. O preço de uma maquiadora não é apenas pelas horas de aplicação — é por anos de treinamento e pela confiança que você dá ao seu cliente.</p>
    `,
  },
  'marketing-digital-makeup': {
    title: 'Domine o Algoritmo: Marketing para Maquiadoras',
    author: 'KHAOS KONTROL Editorial',
    date: '01 Mar 2025',
    image:
      'https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=2000&auto=format&fit=crop',
    content: `
      <p>O networking é frequentemente mal compreendido como transacional. Mas para profissionais criativos, o networking é algo muito mais significativo: é a arte de construir relacionamentos genuínos que levam a colaborações, mentoria e crescimento mútuo. Quando feito de forma autêntica, torna-se a pedra angular de uma carreira próspera.</p>
      
      <p>As colaborações são onde a mágica acontece. A parceria com fotógrafos, designers de moda e estilistas expande seu portfólio e expõe você a novos públicos. As parcerias de marca representam o próximo nível de crescimento profissional. As marcas querem trabalhar com artistas que tenham uma voz distinta e uma audiência engajada.</p>
    `,
  },
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>()
  const article = articleData[slug || '']

  if (!article) {
    return (
      <div className="bg-background text-foreground">
        <main className="container mx-auto px-6 py-20">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Journal
          </Link>
          <div className="mt-12 text-center">
            <div className="text-center space-y-6">
              <h1 className="font-serif text-6xl italic">404</h1>
              <p className="text-muted-foreground tracking-widest uppercase text-xs">
                Página não encontrada | KHAOS KONTROL
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-6 py-12">
        {}
        <div className="sticky top-20 bg-background z-40 py-4 mb-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Journal
          </Link>
        </div>

        {}
        <article className="max-w-2xl mx-auto">
          {}
          <header className="mb-12">
            {article.image && (
              <div className="mb-12 aspect-[21/9] overflow-hidden rounded-[2.5rem] border border-border/5">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
            )}
            <h1 className="journal-title text-5xl mb-6 leading-tight text-foreground">
              {article.title}
            </h1>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-semibold tracking-widest">{article.author}</p>
              <p>{article.date}</p>
            </div>
          </header>

          {}
          <div className="article-body text-lg text-foreground/80 leading-8 space-y-6">
            {article.content
              .split('\n')
              .filter((p: string) => p.trim().startsWith('<p>'))
              .map((paragraph: string, idx: number) => (
                <p key={idx} className="text-foreground/80">
                  {paragraph.replace(/<p>|<\/p>/g, '')}
                </p>
              ))}
          </div>

          {}
          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Ready to scale your business?
            </p>
            <a href="/contact" className="kk-button inline-block">
              Apply for KHAOS KONTROL Pro
            </a>
          </div>
        </article>
      </main>
    </div>
  )
}
