import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Plans() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSubscribe = (plan: string) => {
        // In a real app, this would redirect to Stripe Checkout
        // For MVP, we can simulate or show "Em breve"
        window.location.href = `https://wa.me/5511999999999?text=Olá, quero assinar o plano ${plan} do Lumia Hub!`;
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px]" />
            </div>

            <div className="text-center mb-12 relative z-10">
                <h1 className="text-4xl md:text-5xl font-serif mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
                    Escolha seu Império
                </h1>
                <p className="text-gray-400 max-w-lg mx-auto">
                    Desbloqueie todo o potencial do seu negócio com nossos planos premium.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full relative z-10">

                {/* Starter Plan */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-gray-500/50 transition-all">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl font-serif">
                            <Zap className="h-6 w-6 text-gray-400" />
                            Starter
                        </CardTitle>
                        <CardDescription className="text-gray-400">Ideal para quem está começando.</CardDescription>
                        <div className="mt-4">
                            <span className="text-4xl font-bold">R$ 49</span>
                            <span className="text-gray-500">/mês</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-400" />
                                Até 50 Clientes
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-400" />
                                Agenda Básica
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-400" />
                                Link de Agendamento
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full bg-white/10 hover:bg-white/20 text-white"
                            variant="outline"
                            onClick={() => handleSubscribe('Starter')}
                        >
                            Começar Starter
                        </Button>
                    </CardFooter>
                </Card>

                {/* Empire Plan (Highlighted) */}
                <Card className="bg-[#0b0b0b] border-cyan-500/30 backdrop-blur-xl relative overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)] scale-105">
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                        MAIS POPULAR
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-3xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            <Crown className="h-8 w-8 text-cyan-400" />
                            Empire
                        </CardTitle>
                        <CardDescription className="text-cyan-200/60">A experiência completa sem limites.</CardDescription>
                        <div className="mt-4">
                            <span className="text-5xl font-bold text-white">R$ 97</span>
                            <span className="text-gray-500">/mês</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-3 text-sm text-gray-200">
                            <li className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-cyan-400" />
                                <strong>Clientes Ilimitados</strong>
                            </li>
                            <li className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-cyan-400" />
                                <strong>Prontuários com Fotos</strong>
                            </li>
                            <li className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-cyan-400" />
                                Gestão Financeira Completa
                            </li>
                            <li className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-cyan-400" />
                                Confirmação via WhatsApp Automática
                            </li>
                            <li className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-cyan-400" />
                                Múltiplos Assistentes
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold h-12 shadow-lg shadow-cyan-500/25"
                            onClick={() => handleSubscribe('Empire')}
                        >
                            Assinar Empire Agora
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="mt-12 text-center text-sm text-gray-500">
                <p>Precisa de ajuda? <a href="/contato" className="text-cyan-400 hover:underline">Fale conosco</a></p>
                <p className="mt-2 text-xs opacity-50">Pagamento seguro via Stripe. Cancele quando quiser.</p>
                {user && (
                    <Button variant="link" className="mt-4 text-gray-600 text-xs" onClick={() => navigate('/dashboard')}>
                        Voltar para Dashboard (Apenas se Trial Ativo)
                    </Button>
                )}
            </div>
        </div>
    );
}
