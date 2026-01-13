import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
    fullName: z.string().trim().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
    email: z.string().trim().email({ message: "Email inválido" }),
    businessName: z.string().trim().min(2, { message: "Nome do negócio deve ter pelo menos 2 caracteres" }),
    password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" })
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
                title: "Erro de validação",
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
                message = "Este email já está cadastrado";
            }
            toast({
                title: "Erro ao cadastrar",
                description: message,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Conta criada!",
                description: "Bem-vinda à Lumi. Verifique seu email."
            });
            navigate('/dashboard');
        }
        setIsSubmitting(false);
    };

    const handleGoogle = async () => {
        const { error } = await signInWithGoogle();
        if (error) {
            toast({
                title: "Erro com Google",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    return (
        <AuthLayout
            title="Criar sua conta"
            subtitle="Comece a gerenciar seu negócio com elegância"
        >
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-white/10 hover:bg-white/5"
                    onClick={handleGoogle}
                >
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                    Google
                </Button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#050505] px-2 text-muted-foreground">
                            Ou continue com email
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="fullname" className="block text-sm font-medium text-gray-300 mb-1.5">Nome Completo</Label>
                        <Input
                            id="fullname"
                            placeholder="Seu nome"
                            className="block w-full rounded-lg bg-[#1A1A1A] border-white/10 text-white focus:ring-cyan-500 focus:border-cyan-500 h-11 placeholder:text-gray-600"
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="business" className="block text-sm font-medium text-gray-300 mb-1.5">Nome do Negócio</Label>
                        <Input
                            id="business"
                            placeholder="Nome do seu Studio / Marca"
                            className="block w-full rounded-lg bg-[#1A1A1A] border-white/10 text-white focus:ring-cyan-500 focus:border-cyan-500 h-11 placeholder:text-gray-600"
                            value={formData.businessName}
                            onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">Email Profissional</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="voce@exemplo.com"
                            className="block w-full rounded-lg bg-[#1A1A1A] border-white/10 text-white focus:ring-cyan-500 focus:border-cyan-500 h-11 placeholder:text-gray-600"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="block w-full rounded-lg bg-[#1A1A1A] border-white/10 text-white focus:ring-cyan-500 focus:border-cyan-500 h-11 placeholder:text-gray-600"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 bg-white text-black hover:bg-white/90 font-medium"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Criar conta grátis
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Já tem uma conta?{" "}
                    <Link to="/login" className="text-white hover:underline decoration-[#00e5ff] underline-offset-4">
                        Entrar
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
