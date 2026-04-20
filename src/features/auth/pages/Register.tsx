import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AuthLayout from '@/components/ui/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'
import { Loader2, ArrowRight, Check } from 'lucide-react'
import { getErrorMessage } from '@/utils/error-handler'
import SEOHead from '@/components/seo/SEOHead'
import { useAnalytics } from '@/hooks/useAnalytics'

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Nome precisa ter pelo menos 2 caracteres' }),
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(6, { message: 'Senha precisa ter pelo menos 6 caracteres' }),
})

export default function Register() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const { trackAuth, trackConversion, trackFormSubmit } = useAnalytics()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = registerSchema.safeParse(formData)
    if (!result.success) {
      toast({
        title: 'Verifique os campos',
        description: result.error.errors[0].message,
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      '',
    )

    if (error) {
      const { title, description } = getErrorMessage(error, 'Erro no cadastro')
      toast({ title, description, variant: 'destructive' })
      trackFormSubmit('register', false, error.message)
    } else {
      trackAuth('signup', 'email')
      trackConversion({
        conversion_id: 'signup_complete',
        value: 0,
        currency: 'BRL',
      })
      trackFormSubmit('register', true)
      toast({
        title: 'Bem-vinda ao Khaos Kontrol',
        description:
          'Enviamos um email pra confirmar sua conta. Verifique sua caixa de entrada (e o spam) nos próximos minutos.',
      })
      navigate('/dashboard')
    }
    setIsSubmitting(false)
  }

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle()
    if (error) {
      const { title, description } = getErrorMessage(error, 'Erro ao conectar')
      toast({ title, description, variant: 'destructive' })
    } else {
      trackAuth('signup', 'google')
    }
  }

  return (
    <>
      <SEOHead
        title="Criar Conta Grátis"
        description="Crie sua conta no Khaos Kontrol e teste grátis por 14 dias. Sem cartão de crédito. Sistema completo para maquiadoras profissionais."
        keywords="cadastro sistema maquiadora, criar conta CRM beauty, teste grátis gestão maquiagem"
        url="https://khaoskontrol.com.br/cadastro"
        breadcrumbs={[
          { name: 'Início', url: 'https://khaoskontrol.com.br/' },
          { name: 'Criar Conta', url: 'https://khaoskontrol.com.br/cadastro' },
        ]}
      />
      <AuthLayout
        title="Crie sua conta grátis"
        subtitle="14 dias para testar tudo. Sem cartão de crédito."
      >
        <div className="space-y-6 text-left">
          {}
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

          {}
          {}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="fullname"
                className="block text-xs text-white/50 mb-1.5"
              >
                Seu nome
              </Label>
              <Input
                id="fullname"
                placeholder="Maria Silva"
                className="w-full bg-white/[0.04] border-white/10 text-white h-11 placeholder:text-white/20"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>

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
                placeholder="maria@email.com"
                className="w-full bg-white/[0.04] border-white/10 text-white h-11 placeholder:text-white/20"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <Label
                htmlFor="password"
                className="block text-xs text-white/50 mb-1.5"
              >
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-white/[0.04] border-white/10 text-white h-11 placeholder:text-white/20"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
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
                  Começar grátis
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4 justify-center">
              {['Sem cartão de crédito', 'Cancele quando quiser'].map(
                (text) => (
                  <span
                    key={text}
                    className="flex items-center gap-1.5 text-[11px] text-white/25"
                  >
                    <Check className="w-3 h-3" />
                    {text}
                  </span>
                ),
              )}
            </div>
          </div>

          <p className="text-center text-xs text-white/30 mt-4">
            Já tem conta?{' '}
            <Link
              to="/login"
              className="text-white hover:underline underline-offset-4"
            >
              Entrar
            </Link>
          </p>
        </div>
      </AuthLayout>
    </>
  )
}
