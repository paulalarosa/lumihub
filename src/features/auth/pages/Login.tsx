import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AuthLayout from '@/components/ui/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { getErrorMessage } from '@/utils/error-handler'
import SEOHead from '@/components/seo/SEOHead'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const { trackAuth, trackFormSubmit } = useAnalytics()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { error } = await signIn(email, password)

    if (error) {
      const { title, description } = getErrorMessage(error, 'Erro no login')
      toast({ title, description, variant: 'destructive' })
      trackFormSubmit('login', false, error.message)
    } else {
      trackAuth('login', 'email')
      trackFormSubmit('login', true)
      toast({
        title: 'Bem-vinda de volta!',
        description: 'Sessão iniciada com sucesso.',
      })

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: assistant } = await supabase
          .from('assistants')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        navigate(assistant ? '/assistant/dashboard' : '/dashboard')
      } else {
        navigate('/dashboard')
      }
    }
    setIsSubmitting(false)
  }

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle()
    if (error) {
      const { title, description } = getErrorMessage(error, 'Erro ao conectar')
      toast({ title, description, variant: 'destructive' })
    } else {
      trackAuth('login', 'google')
    }
  }

  return (
    <>
      <SEOHead
        title="Entrar"
        description="Acesse sua conta do Khaos Kontrol. Sistema de gestão para maquiadoras profissionais."
        url="https://khaoskontrol.com.br/login"
        noindex={true}
      />
      <AuthLayout title="Entrar" subtitle="Acesse sua conta do Khaos Kontrol">
        <div className="space-y-6 text-left">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border border-white/20 hover:bg-white hover:text-black hover:border-white bg-black text-white text-sm transition-colors"
            onClick={handleGoogle}
          >
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              />
            </svg>
            Continuar com Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black px-3 text-white/30">ou com email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="email"
                className="block text-xs text-white/50 mb-1.5"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="w-full bg-white/[0.04] border-white/10 text-white h-11 placeholder:text-white/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" className="text-xs text-white/50">
                  Senha
                </Label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border-white/10 text-white h-11 placeholder:text-white/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-white text-black hover:bg-gray-200 font-medium group"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-white/30 mt-4">
            Não tem conta?{' '}
            <Link
              to="/register"
              className="text-white hover:underline underline-offset-4"
            >
              Criar conta grátis
            </Link>
          </p>
        </div>
      </AuthLayout>
    </>
  )
}
