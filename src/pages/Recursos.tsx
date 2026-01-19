import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  BarChart3,
  CreditCard,
  Palette,
  FileText,
  Crown,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";

const Recursos = () => {
  const mainFeatures = [
    {
      icon: Users,
      title: "MATRIZ DE CLIENTES",
      description: "GESTÃO CENTRALIZADA DE DADOS PARA NOIVAS",
      features: [
        "FICHAS TÉCNICAS DIGITAIS",
        "HISTÓRICO DE ALERGIAS",
        "LOG DE DATAS CHAVE",
        "UPLOAD DE REFERÊNCIAS"
      ],
      id: "01"
    },
    {
      icon: BarChart3,
      title: "NÚCLEO FINANCEIRO",
      description: "RASTREAMENTO DE RECEITA E ANALYTICS DE DESPESAS",
      features: [
        "CONTROLE DE MRR",
        "RASTREAMENTO DE OPEX",
        "LUCRO POR EVENTO",
        "RELATÓRIOS FISCAIS"
      ],
      id: "02"
    },
    {
      icon: Crown,
      title: "COMANDO DE EQUIPE",
      description: "GESTÃO DE ASSISTENTES & FOLHA DE PAGAMENTO",
      features: [
        "COMISSÕES AUTOMÁTICAS",
        "CALENDÁRIO COMPARTILHADO",
        "CONTROLE DE ACESSO",
        "RELATÓRIOS DE PAGAMENTOS"
      ],
      id: "03"
    },
    {
      icon: FileText,
      title: "MOTOR DE DOCUMENTOS",
      description: "GERAÇÃO PROFISSIONAL DE CONTRATOS",
      features: [
        "GERADOR DE PDF",
        "ASSINATURAS DIGITAIS",
        "ORÇAMENTOS PERSONALIZADOS",
        "CONSTRUTOR DE LINHA DO TEMPO"
      ],
      id: "04"
    },
    {
      icon: MessageSquare,
      title: "OPERAÇÕES IA",
      description: "ASSISTENTE VIRTUAL DE VENDAS 24/7",
      features: [
        "ESTRATÉGIA DE MARKETING",
        "SUPORTE TÉCNICO",
        "RESPOSTAS A CLIETNES",
        "ANÁLISE DE DADOS"
      ],
      id: "05"
    },
    {
      icon: Palette,
      title: "QUADROS VISUAIS",
      description: "PLANEJAMENTO ESTÉTICO COLABORATIVO",
      features: [
        "UPLOAD DE MOODBOARD",
        "APROVAÇÃO DE LOOK",
        "COMENTÁRIOS DIRETOS",
        "LINKS PÚBLICOS"
      ],
      id: "06"
    }
  ];

  return (
    <>
      <SEOHead
        title="Recursos e Funcionalidades - Lumi"
        description="Conheça todos os recursos da Lumi: gestão de clientes, agenda inteligente, contratos digitais, dashboard financeiro, IA assistente e muito mais."
        keywords="funcionalidades lumi, recursos sistema beleza, crm para maquiadoras, agenda para profissionais beleza, contratos digitais noivas"
        url="https://lumihub.lovable.app/recursos"
        breadcrumbs={[
          { name: "Home", url: "https://lumihub.lovable.app" },
          { name: "Recursos", url: "https://lumihub.lovable.app/recursos" }
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Recursos da Lumi",
          "description": "Lista completa de funcionalidades da plataforma Lumi",
          "numberOfItems": mainFeatures.length,
          "itemListElement": mainFeatures.map((feature, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": feature.title,
            "description": feature.description
          }))
        }}
      />
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">

        {/* Header */}
        <section className="border-b border-white/20 pt-32 pb-16">
          <div className="container mx-auto px-4">
            <h1 className="font-mono text-xs uppercase tracking-[0.3em] text-white/60 mb-6">
              CAPACIDADES DO SISTEMA // MÓDULOS
            </h1>
            <h2 className="font-serif text-5xl md:text-7xl text-white max-w-4xl leading-[0.9]">
              PROJETADO PARA <br />
              <span className="italic font-light opacity-80">ALTA PERFORMANCE</span>
            </h2>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-b border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/20">
            {mainFeatures.map((feature, index) => (
              <div key={index} className="group p-8 md:p-12 min-h-[400px] flex flex-col justify-between hover:bg-white/5 transition-colors border-b lg:border-b-0 border-white/20 last:border-b-0">
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <feature.icon className="w-8 h-8 text-white opacity-80" strokeWidth={1} />
                    <span className="font-mono text-xs text-white/30">{feature.id}</span>
                  </div>
                  <h3 className="font-mono text-xl uppercase tracking-widest mb-2">{feature.title}</h3>
                  <p className="font-mono text-xs text-white/50 mb-8 max-w-[80%] uppercase leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <ul className="space-y-4 border-t border-white/10 pt-8">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-1 h-1 bg-white" />
                      <span className="font-mono text-xs text-white/70 uppercase tracking-wide group-hover:text-white transition-colors">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-4xl mb-8">STATUS DO SISTEMA: PRONTO</h2>
            <div className="flex flex-col md:flex-row justify-center gap-6">
              <Link to="/cadastro">
                <Button className="rounded-none bg-white text-black hover:bg-white/90 h-14 px-8 font-mono uppercase tracking-widest text-xs">
                  INICIALIZAR SETUP
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/planos">
                <Button variant="outline" className="rounded-none border-white text-white hover:bg-white hover:text-black h-14 px-8 font-mono uppercase tracking-widest text-xs">
                  VER BLUEPRINTS
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default Recursos;