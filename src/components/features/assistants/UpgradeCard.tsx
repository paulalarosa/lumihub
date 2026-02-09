
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Add navigation if needed

export const UpgradeCard = () => {
    const navigate = useNavigate();

    return (
        <Card className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white border-purple-700/50 shadow-lg overflow-hidden relative group cursor-pointer transition-all hover:shadow-xl hover:scale-[1.01]" onClick={() => navigate('/planos')}>
            <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none" />
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3 text-center sm:text-left">
                    <div className="p-2 bg-white/10 rounded-full shadow-inner border border-white/10 shrink-0">
                        <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                    </div>
                    <div>
                        <h4 className="font-bold text-base leading-tight tracking-wide">Torne-se uma Pro</h4>
                        <p className="text-xs text-purple-200/90 mt-1 max-w-[200px] sm:max-w-none">Gerencie sua própria agenda, clientes e tenha controle total.</p>
                    </div>
                </div>
                <Button size="sm" className="whitespace-nowrap font-semibold text-purple-950 bg-white hover:bg-white/90 shadow-md w-full sm:w-auto">
                    Ver Planos
                </Button>
            </CardContent>
        </Card>
    );
};
