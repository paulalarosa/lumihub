import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const { signIn, signInWithGoogle } = useAuth();
    const { toast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { error } = await signIn(email, password);

        if (error) {
            toast({
                title: "Erro ao entrar",
                description: error.message === "Invalid login credentials"
                    ? "Email ou senha incorretos"
                    : error.message,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Bem-vinda!",
                description: "Login realizado com sucesso"
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
            title="Bem-vinda de volta"
            subtitle="Acesse sua conta Lumi"
        >
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-white/10 hover:bg-white/5"
                    onClick={handleGoogle}
                >
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                    Entrar com Google
                </Button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#050505] px-2 text-muted-foreground">
                            Ou entre com email
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            className="block w-full rounded-lg bg-[#1A1A1A] border-white/10 text-white focus:ring-cyan-500 focus:border-cyan-500 h-11 placeholder:text-gray-600"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="block w-full rounded-lg bg-[#1A1A1A] border-white/10 text-white focus:ring-cyan-500 focus:border-cyan-500 h-11 placeholder:text-gray-600"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <div className="flex justify-end pt-2">
                            <Link
                                to="/auth/forgot-password"
                                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 bg-white text-black hover:bg-white/90 font-medium"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Não tem uma conta?{" "}
                    <Link to="/register" className="text-white hover:underline decoration-[#00e5ff] underline-offset-4">
                        Criar conta
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
