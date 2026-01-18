import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';

export function TrialBanner() {
    const { status, daysRemaining, isLoading, plan } = useSubscription();
    const { isAdmin, user } = useAuth();
    const navigate = useNavigate();

    // Specific check for hardcoded admin/studio emails
    const isHardcodedAdmin = user?.email === 'prenata@gmail.com';
    const isNathalia = user?.email === 'nathaliasbrb@gmail.com';
    // User requested "conta da Paula" - assuming explicit email or name match to be safe
    const isPaula = user?.email?.toLowerCase().includes('paula');

    if (isAdmin || isHardcodedAdmin || isNathalia || isPaula) return null;
    if (plan === 'pro' || plan === 'empire' || plan === 'studio') return null;
    if (status !== 'trialing' || typeof daysRemaining !== 'number') return null;

    return (
        <div className="bg-[#00e5ff]/10 border-b border-[#00e5ff]/20 backdrop-blur-md">
            <div className="container mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-[#00e5ff]">
                    <Clock className="h-4 w-4 animate-pulse" />
                    <span>
                        <strong className="font-semibold">Período Gratuito:</strong> Restam {daysRemaining} dias para testar o Lumia Hub.
                    </span>
                </div>
                <Button
                    size="sm"
                    onClick={() => navigate('/planos')}
                    className="bg-[#00e5ff] hover:bg-[#00e5ff]/80 text-black font-semibold text-xs h-8 shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                >
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Assinar Agora
                </Button>
            </div>
        </div>
    );
}
