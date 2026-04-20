import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '@/components/ui/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { getErrorMessage } from '@/utils/error-handler'

export default function ForgotPassword() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase.functions.invoke(
        'request-password-reset',
        {
          body: { email },
        },
      )

      if (error) throw error

      setEmailSent(true)
    } catch (error: unknown) {
      const { title, description } = getErrorMessage(
        error,
        'Não foi possível enviar o email',
      )
      toast({
        title,
        description,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setEmailSent(false)
    await handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  return (
    <AuthLayout
      title="Recuperar acesso"
      subtitle="Enviamos um link pro seu email pra você criar uma nova senha"
    >
      {!emailSent ? (
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5"
            >
              Email cadastrado
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              className="block w-full rounded-none bg-black border-white/20 text-white focus:border-white focus:ring-0 h-11 placeholder:text-white/20 font-mono text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-white text-black hover:bg-gray-200 rounded-none font-mono uppercase tracking-widest text-xs font-bold"
            disabled={isSubmitting || !email.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar link de recuperação'
            )}
          </Button>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="text-[10px] text-white/40 hover:text-white flex items-center justify-center font-mono uppercase tracking-widest transition-colors group"
            >
              <ArrowLeft className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar pro login
            </Link>
          </div>
        </form>
      ) : (
        <div className="text-center space-y-6">
          <div className="border border-white/20 bg-white/5 p-6 rounded-none flex flex-col items-center">
            <Mail className="h-10 w-10 text-white/80 mb-4" />
            <p className="text-sm text-white font-serif mb-2">
              Email enviado
            </p>
            <p className="text-xs text-white/60 mb-1">
              Verifique sua caixa de entrada em
            </p>
            <p className="text-xs font-mono text-white border-b border-white/20 pb-0.5 inline-block">
              {email}
            </p>
            <p className="text-[10px] text-white/40 mt-4 leading-relaxed">
              O link chega em até 5 minutos. Não esqueça de olhar o spam ou
              promoções — às vezes ele cai lá.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={isSubmitting}
              className="text-xs text-white/60 hover:text-white border-b border-white/20 hover:border-white pb-0.5 font-mono uppercase tracking-widest transition-colors disabled:opacity-40"
            >
              {isSubmitting ? 'Enviando...' : 'Reenviar email'}
            </button>
            <Link
              to="/login"
              className="text-[10px] text-white/40 hover:text-white font-mono uppercase tracking-widest transition-colors"
            >
              Voltar pro login
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
