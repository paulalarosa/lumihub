import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Crown, ArrowLeft } from 'lucide-react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

export default function PricingPage() {
    const { planType, createCheckoutSession } = usePlanAccess();

    const { data: plans, isLoading } = useQuery({
        queryKey: ['plan-configs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('plan_configs')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');

            if (error) throw error;
            return data;
        },
    });

    const getPlanIcon = (plan: string) => {
        if (plan === 'studio') return <Crown className="w-6 h-6" />;
        if (plan === 'profissional') return <Sparkles className="w-6 h-6" />;
        return <Check className="w-6 h-6" />;
    };

    const getFeatureList = (features: any) => {
        const featureLabels: Record<string, string> = {
            agenda: 'Agenda ilimitada',
            contratos_digitais: 'Contratos digitais',
            portal_cliente: 'Portal da cliente',
            calendario: 'Calendário de compromissos',
            galeria: 'Galeria de inspirações',
            analytics: 'Analytics completo',
            portal_noiva_custom: 'Portal da noiva custom',
            microsite: 'Microsite interativo',
            ficha_anamnese: 'Ficha de anamnese',
            gestao_equipe: 'Gestão de equipe',
            ia_operacional: 'IA operacional',
            ia_widgets: 'IA com widgets dinâmicos',
            ia_canvas: 'IA com Canvas (documentos)',
            ia_local: 'IA local (privacidade total)',
            performance_artista: 'Performance do artista',
            multi_usuario: 'Acesso multi-usuário',
            integracao_api: 'Integração API',
        };

        return Object.entries(features)
            .filter(([_, value]) => value === true)
            .map(([key]) => featureLabels[key] || key);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <>
            <SEO
                title="Planos e Preços"
                description="Escolha o melhor plano para seu negócio de maquiagem. A partir de R$ 39,90/mês com 14 dias grátis."
                url="https://khaoskontrol.com.br/pricing"
            />
            <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Back Button */}
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-12 font-mono text-xs uppercase tracking-widest group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar ao Dashboard
                    </Link>

                    {/* Header */}
                    <div className="text-center mb-20 space-y-4">
                        <h1 className="text-5xl font-serif font-bold tracking-tight">Khaos Protocol Plans</h1>
                        <p className="text-zinc-500 font-mono text-sm uppercase tracking-[0.2em]">
                            Cancele quando quiser • 14 dias grátis • Sem fidelidade
                        </p>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
                        {plans?.map((plan) => {
                            const isCurrent = plan.plan_type === planType;
                            const isPopular = plan.plan_type === 'profissional';
                            const isPremium = plan.plan_type === 'studio';
                            const featureList = getFeatureList(plan.features);

                            return (
                                <div
                                    key={plan.plan_type}
                                    className={cn(
                                        'relative flex flex-col p-8 bg-zinc-950 border transition-all duration-300 rounded-none',
                                        isPopular && 'border-white/20 shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]',
                                        isPremium && 'border-white/30 shadow-[0_0_80px_-12px_rgba(255,255,255,0.15)]',
                                        !isPopular && !isPremium && 'border-white/5',
                                        isCurrent && 'border-white'
                                    )}
                                >
                                    {/* Current Plan Badge */}
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 text-[10px] font-mono font-bold uppercase tracking-widest">
                                            Plano Atual
                                        </div>
                                    )}

                                    {/* Header */}
                                    <div className="text-center mb-8 pb-8 border-b border-white/5">
                                        <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 border border-white/10 mb-6 rounded-none rotate-45 group">
                                            <div className="-rotate-45">
                                                {getPlanIcon(plan.plan_type)}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-serif font-bold mb-2">
                                            {plan.display_name}
                                        </h3>
                                        <div className="flex items-baseline justify-center gap-1 font-mono">
                                            <span className="text-xs text-zinc-500 uppercase tracking-tighter">R$</span>
                                            <span className="text-4xl font-bold">
                                                {plan.monthly_price.toFixed(2).replace('.', ',')}
                                            </span>
                                            <span className="text-xs text-zinc-500 uppercase tracking-widest ml-1">/mês</span>
                                        </div>
                                    </div>

                                    {/* Limits */}
                                    <div className="mb-8 space-y-1">
                                        {plan.max_clients ? (
                                            <p className="text-center text-zinc-400 font-mono text-[10px] uppercase tracking-widest">
                                                Até {plan.max_clients} clientes ativos
                                            </p>
                                        ) : (
                                            <p className="text-center text-emerald-500 font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                                                ✨ Clientes ilimitados
                                            </p>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-4 flex-1 mb-12">
                                        {featureList.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                                                <span className="text-zinc-400 font-mono text-[11px] uppercase tracking-wide leading-tight">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <Button
                                        onClick={() => createCheckoutSession.mutate(plan.plan_type as any)}
                                        disabled={isCurrent || createCheckoutSession.isPending}
                                        className={cn(
                                            'w-full h-12 rounded-none font-mono text-xs uppercase tracking-[0.2em] transition-all duration-300',
                                            isCurrent
                                                ? 'bg-zinc-800 text-zinc-500 cursor-default'
                                                : 'bg-white text-black hover:bg-zinc-200 shadow-xl'
                                        )}
                                    >
                                        {createCheckoutSession.isPending
                                            ? 'Invocando Protocolo...'
                                            : isCurrent ? 'Protocolo Ativo' : 'Iniciar Trial'}
                                    </Button>

                                    <p className="mt-4 text-[9px] text-zinc-600 font-mono uppercase text-center tracking-widest">
                                        {plan.features.suporte === 'prioritario' ? 'Suporte Prioritário Neural' :
                                            plan.features.suporte === 'email' ? 'Suporte Digital Padrão' :
                                                'Suporte Via Canal Criptografado'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* FAQ - Brutalist Style */}
                    <div className="max-w-3xl mx-auto border-t border-white/5 pt-20">
                        <h2 className="text-2xl font-serif font-bold text-center mb-12">System Protocol FAQ</h2>
                        <div className="grid gap-4">
                            <details className="group border border-white/5 bg-zinc-950/50 p-6">
                                <summary className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-zinc-400 cursor-pointer list-none">
                                    Como funciona o cancelamento?
                                    <div className="h-0.5 w-3 bg-white group-open:rotate-180 transition-transform" />
                                </summary>
                                <p className="mt-4 font-sans text-sm text-zinc-500 leading-relaxed">
                                    O acesso pode ser revogado a qualquer momento pelo painel de configurações. O protocolo permanecerá ativo até o final do ciclo de faturamento atual. Sem taxas de rescisão.
                                </p>
                            </details>
                            <details className="group border border-white/5 bg-zinc-950/50 p-6">
                                <summary className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-zinc-400 cursor-pointer list-none">
                                    Haverá cobrança após os 14 dias?
                                    <div className="h-0.5 w-3 bg-white group-open:rotate-180 transition-transform" />
                                </summary>
                                <p className="mt-4 font-sans text-sm text-zinc-500 leading-relaxed">
                                    Você será notificado 48 horas antes do término do trial. A cobrança só ocorrerá se você decidir formalizar o protocolo de assinatura e inserir os dados de pagamento.
                                </p>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
