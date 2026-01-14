import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '@/components/ui/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/update-password`,
        });

        if (error) {
            toast({
                title: "Erro ao enviar email",
                description: error.message,
                variant: "destructive"
            });
        } else {
            setEmailSent(true);
            toast({
                title: "Verifique seu email",
                description: "Enviamos um link para recuperação da senha."
            });
        }
        setIsSubmitting(false);
    };

    return (
        <AuthLayout
            title="Recuperar Senha"
            subtitle="Digite seu email para receber o link"
        >
            {!emailSent ? (
                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-200">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            className="bg-[#1A1A1A] border-white/10 text-white h-12 focus:ring-cyan-500 focus:border-cyan-500 placeholder:text-gray-600"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-white text-black hover:bg-white/90 font-medium"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Link de Recuperação"}
                    </Button>

                    <div className="text-center mt-4">
                        <Link to="/login" className="text-sm text-gray-400 hover:text-white flex items-center justify-center">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar para o Login
                        </Link>
                    </div>
                </form>
            ) : (
                <div className="text-center space-y-4">
                    <div className="bg-[#00e5ff]/10 p-4 rounded-lg border border-[#00e5ff]/20">
                        <p className="text-sm text-gray-200">
                            Enviamos um email para <strong>{email}</strong> com instruções para redefinir sua senha.
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="inline-block mt-4 text-sm text-[#00e5ff] hover:underline"
                    >
                        Voltar para o Login
                    </Link>
                </div>
            )}
        </AuthLayout>
    );
}
