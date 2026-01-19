import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Zap,
  Crown,
  Star,
  Check,
  X
} from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";

const Planos = () => {
  const plans = [
    {
      name: "ACESSO ESSENCIAL",
      price: "39,90",
      period: "MÊS",
      description: "ACESSO SISTEMA NÍVEL 1",
      badge: null,
      icon: Zap,
      features: [
        { name: "10 CLIENTES ATIVOS", included: true },
        { name: "PACK TÉCNICO BÁSICO (PDF)", included: true },
        { name: "AGENDA INTELIGENTE", included: true },
        { name: "CONTRATOS DIGITAIS", included: true },
        { name: "PORTAL DA CLIENTE", included: true },
        { name: "DASHBOARD FINANCEIRO", included: false },
        { name: "CÁLCULO DE COMISSÃO", included: false },
        { name: "SUPORTE IA", included: false }
      ],
      limitations: "ARTISTA SOLO // INICIANTE",
      cta: "INICIAR_TESTE",
      ctaVariant: "outline" as const,
      highlight: false
    },
    {
      name: "ACESSO PROFISSIONAL",
      price: "89,90",
      period: "MÊS",
      description: "SUÍTE DE GESTÃO AVANÇADA",
      badge: "MAIS POPULAR",
      icon: Star,
      features: [
        { name: "CLIENTES ILIMITADOS", included: true },
        { name: "PACK TÉCNICO GOLD", included: true },
        { name: "ANALYTICS COMPLETO", included: true },
        { name: "PORTAL DA NOIVA CUSTOM", included: true },
        { name: "MOODBOARD INTERATIVO", included: true },
        { name: "FICHAS DE ANAMNESE", included: true },
        { name: "CÁLCULO DE COMISSÃO", included: false },
        { name: "SUPORTE IA", included: false }
      ],
      limitations: null,
      cta: "MIGRAR_AGORA",
      ctaVariant: "default" as const, // We will manually style this
      highlight: true
    },
    {
      name: "ACESSO STUDIO",
      price: "149,90",
      period: "MÊS",
      description: "SOLUÇÕES PARA EQUIPES & IMPÉRIOS",
      badge: "MELHOR VALOR",
      icon: Crown,
      features: [
        { name: "TUDO DO PRO", included: true },
        { name: "GESTÃO DE EQUIPE", included: true },
        { name: "AUTO COMISSÕES", included: true },
        { name: "IA OPERACIONAL", included: true },
        { name: "PERFORMANCE DO ARTISTA", included: true },
        { name: "ACESSO MULTI-USUÁRIO", included: true },
        { name: "SUPORTE PRIORITÁRIO", included: true },
        { name: "INTEGRAÇÃO API", included: true }
      ],
      limitations: null,
      cta: "MIGRAR_AGORA",
      ctaVariant: "outline" as const,
      highlight: false
    }
  ];

  const faqs = [
    {
      question: "POSSO CANCELAR A QUALQUER MOMENTO?",
      answer: "SIM. SEM CONTRATOS DE FIDELIDADE. CONTROLE TOTAL DO SEU ACESSO."
    },
    {
      question: "COMO FUNCIONA O TRIAL?",
      answer: "14 DIAS DE ACESSO TOTAL AO SISTEMA. SEM CARTÃO DE CRÉDITO NECESSÁRIO."
    },
    {
      question: "EXISTE SUPORTE TÉCNICO?",
      answer: "SIM. SUPORTE DEDICADO VIA CHAT E EMAIL. PRIORIDADE PARA PLANOS STUDIO."
    },
    {
      question: "TAXAS DE PAGAMENTO?",
      answer: "APENAS SOBRE TRANSAÇÕES PROCESSADAS. REPASSE LÍQUIDO AUTOMÁTICO."
    }
  ];

  return (
    <>
      <SEOHead
        title="Planos e Preços - Lumi"
        description="Escolha o plano ideal para seu negócio de beleza. Planos a partir de R$39,90/mês com teste gratuito de 14 dias. Sem cartão de crédito."
        keywords="preços lumi, planos lumi, quanto custa lumi, sistema gestão beleza preço, software maquiadora preço"
        url="https://lumihub.lovable.app/planos"
        type="service"
        breadcrumbs={[
          { name: "Home", url: "https://lumihub.lovable.app" },
          { name: "Planos", url: "https://lumihub.lovable.app/planos" }
        ]}
        faq={faqs.map(f => ({ question: f.question, answer: f.answer }))}
        priceRange="R$39-R$149"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Lumi - Plataforma de Gestão",
          "description": "Software de gestão para profissionais de beleza",
          "brand": { "@type": "Brand", "name": "Lumi" },
          "offers": [
            {
              "@type": "Offer",
              "name": "Essencial",
              "price": "39.90",
              "priceCurrency": "BRL",
              "priceValidUntil": "2027-12-31",
              "availability": "https://schema.org/InStock"
            },
            {
              "@type": "Offer",
              "name": "Profissional",
              "price": "89.90",
              "priceCurrency": "BRL",
              "priceValidUntil": "2027-12-31",
              "availability": "https://schema.org/InStock"
            },
            {
              "@type": "Offer",
              "name": "Studio",
              "price": "149.90",
              "priceCurrency": "BRL",
              "priceValidUntil": "2027-12-31",
              "availability": "https://schema.org/InStock"
            }
          ]
        }}
      />
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">

        {/* Header Block */}
        <section className="border-b border-white/20 pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-white/60 mb-6">
              ARQUITETURA DO SISTEMA // MODELOS DE PREÇO
            </h1>
            <h2 className="font-serif text-5xl md:text-7xl text-white mb-8">
              BLUEPRINTS DE DADOS
            </h2>
            <div className="flex items-center justify-center gap-4 text-xs font-mono uppercase tracking-widest text-white/80">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white" />
                SEM CARTÃO DE CRÉDITO
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white" />
                14 DIAS GRÁTIS
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white" />
                CANCELE QUANDO QUISER
              </span>
            </div>
          </div>
        </section>

        {/* Pricing Grid */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-white/20">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`
                  relative p-10 flex flex-col h-full border-b lg:border-b-0 lg:border-r border-white/20 last:border-r-0
                  ${plan.highlight ? 'bg-white text-black' : 'bg-black text-white'}
                `}
              >
                {plan.badge && (
                  <div className={`
                    absolute top-0 right-0 px-4 py-2 text-xs font-mono uppercase tracking-widest border-l border-b
                    ${plan.highlight ? 'bg-black text-white border-black' : 'bg-white text-black border-white'}
                  `}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-10">
                  <plan.icon className={`w-8 h-8 mb-6 ${plan.highlight ? 'text-black' : 'text-white'}`} strokeWidth={1} />
                  <h3 className="font-mono text-sm uppercase tracking-widest mb-2 opacity-80">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-serif text-sm">R$</span>
                    <span className="font-mono text-5xl tracking-tighter font-light">{plan.price}</span>
                    <span className="font-mono text-xs uppercase opacity-60">/{plan.period}</span>
                  </div>
                  <p className={`text-xs font-mono uppercase tracking-wide ${plan.highlight ? 'text-black/60' : 'text-white/60'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="flex-grow mb-10">
                  <ul className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-4 text-xs font-mono tracking-wide uppercase">
                        {feature.included ? (
                          <div className={`w-1.5 h-1.5 flex-shrink-0 ${plan.highlight ? 'bg-black' : 'bg-white'}`} />
                        ) : (
                          <div className={`w-1.5 h-1.5 flex-shrink-0 ${plan.highlight ? 'bg-black/10' : 'bg-white/10'}`} />
                        )}
                        <span className={feature.included ? (plan.highlight ? 'opacity-100' : 'opacity-100') : 'opacity-30 line-through'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto">
                  <Link to="/cadastro" className="block w-full">
                    <Button
                      className={`
                        w-full h-12 rounded-none font-mono text-xs uppercase tracking-[0.2em] transition-all
                        ${plan.highlight
                          ? 'bg-black text-white hover:bg-black/80 hover:scale-[1.02]'
                          : 'bg-white text-black hover:bg-white/90 hover:scale-[1.02]'
                        }
                      `}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Matrix / "All Plans Include" */}
        <section className="border-t border-white/20 py-20 bg-black">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                "CRIPTOGRAFIA DE DADOS",
                "SYNC NA NUVEM",
                "ACESSO MOBILE",
                "UPDATES AUTOMÁTICOS"
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center p-6 border border-white/10 hover:border-white/50 transition-colors">
                  <div className="w-2 h-2 bg-white mb-4" />
                  <span className="font-mono text-xs uppercase tracking-widest text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ - Brutalist List */}
        <section className="border-t border-white/20 py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="font-mono text-xs uppercase tracking-widest text-white/40 mb-12 text-center">
              SYSTEM FAQ // DÚVIDAS_COMUNS
            </h2>
            <div className="space-y-0 divide-y divide-white/20 border-t border-b border-white/20">
              {faqs.map((faq, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-8 py-10 group hover:bg-white/5 transition-colors">
                  <div className="md:col-span-1 font-mono text-xs text-white/30">
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="md:col-span-5 font-mono text-sm uppercase tracking-wider text-white">
                    {faq.question}
                  </div>
                  <div className="md:col-span-6 font-mono text-xs text-white/60 leading-relaxed uppercase">
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default Planos;