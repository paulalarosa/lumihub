import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Zap,
  Crown,
  Star,
  Check
} from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { StripeEmbeddedCheckout } from "@/components/billing/StripeEmbeddedCheckout";
import { useState } from "react";

const Planos = () => {
  const { t } = useLanguage();
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);

  const plans = [
    {
      name: t("plan_essential_name"),
      price: "39,90",
      priceId: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL || "price_1QueE5J7Hw...placeholder",
      period: "MÊS",
      description: t("plan_essential_desc"),
      badge: null,
      icon: Zap,
      features: [
        { name: t("feat_10_clients"), included: true },
        { name: t("feat_tech_pack_basic"), included: true },
        { name: t("feat_smart_agenda"), included: true },
        { name: t("feat_contracts"), included: true },
        { name: t("feat_client_portal"), included: true },
        { name: t("feat_financial_dash"), included: false },
        { name: t("feat_commission"), included: false },
        { name: t("feat_ai_support"), included: false }
      ],
      limitations: t("plan_essential_limit"),
      ctaKey: "cta_bottom_start",
      ctaVariant: "outline" as const,
      highlight: false
    },
    {
      name: t("plan_professional_name"),
      price: "89,90",
      priceId: import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL || "price_1QueFKJ7Hw...placeholder",
      period: "MÊS",
      description: t("plan_professional_desc"),
      badge: t("plan_professional_badge"),
      icon: Star,
      features: [
        { name: t("feat_unlimited_clients"), included: true },
        { name: t("feat_tech_pack_gold"), included: true },
        { name: t("feat_full_analytics"), included: true },
        { name: t("feat_custom_portal"), included: true },
        { name: t("feat_moodboard"), included: true },
        { name: t("feat_anamnesis"), included: true },
        { name: t("feat_commission"), included: false },
        { name: t("feat_ai_support"), included: false }
      ],
      limitations: null,
      ctaKey: "cta_bottom_plans",
      ctaVariant: "default" as const,
      highlight: true
    },
    {
      name: t("plan_studio_name"),
      price: "149,90",
      priceId: import.meta.env.VITE_STRIPE_PRICE_STUDIO || "price_1QueGcJ7Hw...placeholder",
      period: "MÊS",
      description: t("plan_studio_desc"),
      badge: t("plan_studio_badge"),
      icon: Crown,
      features: [
        { name: t("feat_all_pro"), included: true },
        { name: t("feat_team_mgmt"), included: true },
        { name: t("feat_auto_comm"), included: true },
        { name: t("feat_ops_ai"), included: true },
        { name: t("feat_perf_artist"), included: true },
        { name: t("feat_multi_user"), included: true },
        { name: t("feat_priority_support"), included: true },
        { name: t("feat_api"), included: true }
      ],
      limitations: null,
      ctaKey: "cta_bottom_plans",
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
    }
  ];

  return (
    <>
      <SEOHead
        title="Planos e Preços - KONTROL"
        description="Escolha o plano ideal para seu negócio de beleza."
        keywords="preços kontrol, planos khaos kontrol"
        url="https://khaoskontrol.com.br/planos"
        type="service"
        breadcrumbs={[
          { name: "Home", url: "https://khaoskontrol.com.br" },
          { name: "Planos", url: "https://khaoskontrol.com.br/planos" }
        ]}
        priceRange="R$39-R$149"
      />
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">

        {/* Header Block */}
        <section className="border-b border-white/20 pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-white/60 mb-6">
              {t("plans_badge")}
            </h1>
            <h2 className="font-serif text-5xl md:text-7xl text-white mb-8">
              {t("plans_title")}
            </h2>
            <div className="flex items-center justify-center gap-4 text-xs font-mono uppercase tracking-widest text-white/80">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white" />
                {t("plans_no_card")}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white" />
                {t("plans_trial")}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white" />
                {t("plans_cancel")}
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setSelectedPriceId(plan.priceId)}
                        className={`
                                w-full h-12 rounded-none font-mono text-xs uppercase tracking-[0.2em] transition-all
                                ${plan.highlight
                            ? 'bg-black text-white hover:bg-black/80 hover:scale-[1.02]'
                            : 'bg-white text-black hover:bg-white/90 hover:scale-[1.02]'
                          }
                                `}
                      >
                        {plan.ctaKey ? t(plan.ctaKey) : "MIGRAR AGORA"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl bg-neutral-950 border-neutral-800 p-0 overflow-hidden text-white">
                      <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4 font-serif">
                          Assinar Plano {plan.name}
                        </h2>
                        {/* Here we render the Checkout */}
                        <StripeEmbeddedCheckout priceId={plan.priceId} />
                      </div>
                    </DialogContent>
                  </Dialog>
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
                t("plans_security"),
                t("plans_cloud"),
                t("plans_mobile"),
                t("plans_updates")
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
              {t("plans_faq_title")}
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