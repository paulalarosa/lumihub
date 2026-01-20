import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

export default function BrideLoginPage() {
    const { clientId } = useParams(); // Using clientId directly
    const navigate = useNavigate();
    const { toast } = useToast();
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);
    const [clientName, setClientName] = useState("");

    useEffect(() => {
        if (!clientId) return;

        // Optional: Fetch client name for greeting
        const fetchName = async () => {
            const { data } = await supabase
                .from('wedding_clients' as any)
                .select('name')
                .eq('id', clientId)
                .single();
            if (data) setClientName(data.name.split(' ')[0]);
        };
        fetchName();
    }, [clientId]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) return;

        setLoading(true);

        try {
            // Secure RPC Call
            const { data, error } = await supabase
                .rpc('validate_bride_pin', {
                    client_id: clientId,
                    pin_code: pin
                });

            if (error) throw error;

            // Check validity from RPC response
            const response = data as any;

            if (response && response.valid) {
                // Success
                localStorage.setItem(`bride_auth_${clientId}`, "true");
                navigate(`/portal/${clientId}/dashboard`);
            } else {
                toast({
                    title: "Acesso Negado",
                    description: "Código de segurança inválido.",
                    variant: "destructive"
                });
            }

        } catch (err) {
            console.error(err);
            toast({
                title: "Erro no sistema",
                description: "Não foi possível validar as credenciais.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!clientId) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-mono">
                <div className="text-center">
                    <h1 className="text-xl mb-2">PORTAL SYSTEM ERROR</h1>
                    <p className="text-gray-500 text-xs">INVALID_ACCESS_KEY</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 font-sans selection:bg-white selection:text-black">

            {/* Main Container - Industrial Border */}
            <div className="w-full max-w-md border border-neutral-800 bg-[#050505] p-12 relative">

                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white" />

                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="flex justify-center mb-6">
                        <Sparkles className="w-6 h-6 text-white" strokeWidth={1} />
                    </div>
                    <div>
                        <p className="text-neutral-500 text-[10px] uppercase tracking-[0.4em] mb-2 font-medium">
                            {clientName ? `Olá, ${clientName}` : 'Bem-vinda ao'}
                        </p>
                        <h1 className="text-4xl font-serif text-white tracking-tight italic">KONTROL CLIENT</h1>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-12">
                    <div className="space-y-6">
                        <label className="block text-center text-[10px] text-neutral-400 uppercase tracking-[0.2em]">
                            Código de Acesso
                        </label>

                        {/* PIN Input - Sharp & High Contrast */}
                        <div className="relative group">
                            <div className={`
                                relative h-16 bg-neutral-900 border transition-all duration-300 flex items-center justify-center
                                ${focused ? 'border-white' : 'border-neutral-800 group-hover:border-neutral-700'}
                            `}>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={pin}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setPin(val);
                                    }}
                                    placeholder=""
                                    className="absolute inset-0 w-full h-full text-center text-3xl font-mono tracking-[0.5em] 
                                             bg-transparent border-none text-white focus:ring-0 
                                             placeholder:text-neutral-700 z-10 rounded-none"
                                    autoComplete="off"
                                />

                                {/* Placeholder Dots if empty */}
                                {pin.length === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center gap-6 pointer-events-none">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-1.5 h-1.5 bg-neutral-800" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || pin.length < 4}
                        className="w-full h-14 bg-white text-black hover:bg-neutral-200 
                                 rounded-none transition-all duration-300 
                                 text-xs font-bold uppercase tracking-[0.2em] border border-transparent"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Entrar"}
                    </Button>
                </form>

                <div className="mt-16 text-center">
                    <p className="text-[10px] text-neutral-700 uppercase tracking-widest font-mono">
                        Secure Environment
                    </p>
                </div>
            </div>
        </div>
    );
}
