import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw } from "lucide-react";

export default function UpgradeFailurePage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            <Card className="bg-neutral-900 border-neutral-800 p-12 text-center max-w-md w-full">
                {/* Error Icon */}
                <div className="w-24 h-24 bg-red-500/10 border-2 border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-12 h-12 text-red-500" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-4">
                    Pagamento Não Aprovado
                </h1>

                {/* Message */}
                <p className="text-neutral-400 mb-8">
                    Não foi possível processar seu pagamento. Isso pode acontecer por diversos motivos, como dados incorretos ou limite insuficiente.
                </p>

                {/* Suggestions */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 mb-8 text-left">
                    <h3 className="text-white font-semibold mb-4">
                        O que você pode fazer:
                    </h3>
                    <ul className="space-y-2 text-sm text-neutral-300">
                        <li>• Verificar os dados do cartão</li>
                        <li>• Tentar outro método de pagamento</li>
                        <li>• Entrar em contato com seu banco</li>
                        <li>• Usar PIX para pagamento instantâneo</li>
                    </ul>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                    <Button
                        size="lg"
                        onClick={() => navigate("/upgrade")}
                        className="w-full bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-wider"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Tentar Novamente
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => navigate("/assistant/dashboard")}
                        className="w-full border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    >
                        Voltar ao Dashboard
                    </Button>
                </div>

                <p className="text-neutral-500 text-xs mt-6">
                    Precisa de ajuda? Entre em contato com nosso suporte
                </p>
            </Card>
        </div>
    );
}
