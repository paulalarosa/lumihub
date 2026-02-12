import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Loader2, CreditCard, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { StripeService } from "@/services/stripe";

const PLANS = [
    {
        id: "basic",
        name: "Plano ESSENCIAL",
        price: 49.90,
        popular: false,
        stripePriceId: "price_1T06IGPuhubKL3n8c8sTgvsu",
        features: [
            "Agenda básica de eventos",
            "Até 50 clientes",
            "Contratos padrão (sem personalização)",
            "Gestão financeira simples",
            "Suporte por e-mail",
        ],
    },
    {
        id: "pro",
        name: "Plano PROFISSIONAL",
        price: 99.90,
        popular: true,
        stripePriceId: "price_1T06JHPuhubKL3n88FuAacvY",
        features: [
            "Agenda ilimitada",
            "Clientes ilimitados",
            "Contratos digitais com assinatura",
            "Gestão financeira completa",
            "Portal da Noiva personalizado",
            "Convite de assistentes",
            "Suporte prioritário 24/7",
        ],
    },
    {
        id: "enterprise",
        name: "Plano STUDIO",
        price: 199.90,
        popular: false,
        stripePriceId: "price_1T06JePuhubKL3n8AEQBTYtV",
        features: [
            "Tudo do Plano Profissional",
            "Múltiplos usuários (Equipe)",
            "Relatórios avançados de BI",
            "API de integração",
            "Gerente de conta dedicado",
            "Treinamento de equipe",
        ],
    },
];

export default function UpgradePage() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleUpgrade = async (plan: typeof PLANS[0]) => {
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Você precisa estar logado");
                navigate("/login");
                return;
            }

            // Call Stripe Service directly
            await StripeService.checkout({
                priceId: plan.stripePriceId,
                projectId: user.id // We use User ID as reference for subscriptions
            });

        } catch (error) {
            console.error("Upgrade error:", error);
            // Toast is already handled in StripeService
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-block px-4 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
                        <span className="text-xs uppercase tracking-wider text-neutral-400">
                            UPGRADE // SISTEMA_COMPLETO
                        </span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        Transforme-se em Profissional Independente
                    </h1>
                    <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                        De assistente a empreendedora. Gerencie seus próprios clientes, agenda e financeiro com a plataforma mais completa do mercado.
                    </p>
                </div>

                {/* Plan Card */}
                <div className="grid gap-8">
                    {PLANS.map((plan) => (
                        <Card
                            key={plan.id}
                            className="bg-neutral-900 border-neutral-800 p-8 sm:p-10 relative overflow-hidden"
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-white text-black px-6 py-1 text-xs font-bold uppercase tracking-wider">
                                    Mais Popular
                                </div>
                            )}

                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                                <div>
                                    <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold text-white">
                                            R$ {plan.price.toFixed(2)}
                                        </span>
                                        <span className="text-neutral-400 text-lg">/mês</span>
                                    </div>
                                    <p className="text-neutral-500 text-sm mt-2">
                                        Cancele quando quiser • Sem fidelidade
                                    </p>
                                </div>

                                <Button
                                    size="lg"
                                    onClick={() => handleUpgrade(plan)}
                                    disabled={isLoading}
                                    className="bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-wider px-8 py-6 text-base w-full lg:w-auto"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-5 h-5 mr-2" />
                                            Assinar via Stripe
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Features Grid */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            <Check className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-neutral-300 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Payment Methods */}
                <div className="mt-12 text-center space-y-4">
                    <div className="flex items-center justify-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2 text-neutral-400">
                            <CreditCard className="w-5 h-5" />
                            <span className="text-sm">Cartão de Crédito</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400">
                            <span className="text-xl"></span>
                            <span className="text-sm">Apple Pay</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400">
                            <span className="text-xl">G</span>
                            <span className="text-sm">Google Pay</span>
                        </div>
                    </div>

                    <p className="text-neutral-500 text-xs uppercase tracking-wider">
                        💳 Pagamento seguro via Stripe
                    </p>
                    <p className="text-neutral-600 text-xs">
                        Dados criptografados de ponta a ponta (PCI Compliance)
                    </p>
                </div>

                {/* FAQ */}
                <div className="mt-16 border-t border-neutral-800 pt-12">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">
                        Perguntas Frequentes
                    </h2>
                    <div className="grid gap-6 max-w-3xl mx-auto">
                        <div>
                            <h3 className="text-white font-semibold mb-2">
                                Posso cancelar a qualquer momento?
                            </h3>
                            <p className="text-neutral-400 text-sm">
                                Sim! Não há fidelidade. Você pode cancelar sua assinatura quando quiser e continuar usando até o fim do período pago.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-2">
                                Meus dados de assistente serão mantidos?
                            </h3>
                            <p className="text-neutral-400 text-sm">
                                Sim! Ao fazer upgrade, você mantém todo o histórico de eventos e informações que tinha como assistente, além de ganhar acesso completo à plataforma.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-2">
                                É seguro?
                            </h3>
                            <p className="text-neutral-400 text-sm">
                                Sim! Utilizamos a Stripe, líder mundial em pagamentos online, garantindo a proteção total dos seus dados.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
