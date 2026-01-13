import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] p-4 font-sans">
                    <div className="max-w-md w-full bg-[#121212]/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-serif font-bold text-white mb-2">
                            Algo inesperado aconteceu
                        </h1>

                        <p className="text-white/60 mb-8">
                            Não se preocupe, seus dados estão seguros. Tente recarregar a página para voltar ao normal.
                        </p>

                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90 w-full font-medium"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Recarregar Sistema
                        </Button>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-8 p-4 bg-black/40 rounded-lg text-left w-full overflow-auto max-h-40 border border-white/5">
                                <p className="text-red-400 text-xs font-mono break-all">{this.state.error.toString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
