import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AuthLayout from '@/components/ui/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Loader2, Terminal } from 'lucide-react';

const registerSchema = z.object({
    fullName: z.string().trim().min(2, { message: "TAMANHO_NOME_INVALIDO" }),
    email: z.string().trim().email({ message: "FORMATO_EMAIL_INVALIDO" }),
    businessName: z.string().trim().min(2, { message: "ID_NEGOCIO_INVALIDO" }),
    password: z.string().min(6, { message: "SENHA_MUITO_CURTA" })
});

export default function Register() {
    const navigate = useNavigate();
    const { signUp, signInWithGoogle } = useAuth();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        businessName: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = registerSchema.safeParse(formData);
        if (!result.success) {
            toast({
                title: "ERRO_VALIDAÇÃO",
                description: result.error.errors[0].message,
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.businessName);

        if (error) {
            let message = error.message;
            if (error.message.includes("already registered")) {
                message = "IDENTIDADE_JÁ_EXISTE";
            }
            toast({
                title: "FALHA_REGISTRO",
                description: message,
                variant: "destructive"
            });
        } else {
            toast({
                title: "IDENTIDADE_CRIADA",
                description: "EMAIL_VERIFICAÇÃO_ENVIADO"
            });
            navigate('/dashboard');
        }
        setIsSubmitting(false);
    };

    const handleGoogle = async () => {
        const { error } = await signInWithGoogle();
        if (error) {
            toast({
                title: "FALHA_CONEXÃO",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    return (
        <AuthLayout
            title="NOVO_REGISTRO"
            subtitle="ESTABELECER_NOVO_CENTRO_COMANDO"
        >
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border border-white/20 hover:bg-white hover:text-black hover:border-white rounded-none bg-black text-white font-mono uppercase tracking-widest text-xs transition-colors"
                    onClick={handleGoogle}
                >
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                    REGISTRAR_COM_GOOGLE
                </Button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-black px-2 text-white/40 font-mono tracking-widest">
                            OU_CRIAR_IDENTIDADE
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="fullname" className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5">NOME_COMPLETO</Label>
                        <Input
                            id="fullname"
                            placeholder="NOME_OPERATIVA"
                            className="block w-full rounded-none bg-black border-white/20 text-white focus:border-white focus:ring-0 h-11 placeholder:text-white/20 font-mono text-sm"
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="business" className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5">ID_ORGANIZAÇÃO</Label>
                        <Input
                            id="business"
                            placeholder="NOME_STUDIO"
                            className="block w-full rounded-none bg-black border-white/20 text-white focus:border-white focus:ring-0 h-11 placeholder:text-white/20 font-mono text-sm"
                            value={formData.businessName}
                            onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="email" className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5">EMAIL_CONTATO</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="OPERATIVA@LUMI.COM"
                            className="block w-full rounded-none bg-black border-white/20 text-white focus:border-white focus:ring-0 h-11 placeholder:text-white/20 font-mono text-sm"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="password" className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5">SENHA_ACESSO</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="MIN_6_CHARS"
                            className="block w-full rounded-none bg-black border-white/20 text-white focus:border-white focus:ring-0 h-11 placeholder:text-white/20 font-mono text-sm"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 bg-white text-black hover:bg-gray-200 rounded-none font-mono uppercase tracking-widest text-xs font-bold"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "CRIAR_IDENTIDADE"}
                </Button>

                <p className="text-center text-xs text-white/40 mt-6 font-mono uppercase tracking-widest">
                    JÁ_TEM_CONTA?{" "}
                    <Link to="/login" className="text-white hover:underline decoration-white underline-offset-4 ml-1">
                        LOGIN
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
