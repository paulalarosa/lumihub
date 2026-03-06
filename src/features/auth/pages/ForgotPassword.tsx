import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '@/components/ui/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, ArrowLeft, ShieldAlert } from 'lucide-react'

export default function ForgotPassword() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Use Edge Function to send templated SES email
      const { _data, error } = await supabase.functions.invoke(
        'request-password-reset',
        {
          body: { email },
        },
      )

      if (error) throw error

      setEmailSent(true)
      toast({
        title: 'RECUPERAÇÃO_INICIADA',
        description: 'VERIFICAR_CANAIS_SEGUROS',
        className: 'bg-black border border-white/20 text-white',
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao processar solicitação'
      toast({
        title: 'FALHA_TRANSMISSÃO',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="RECUPERAR_ACESSO"
      subtitle="INICIAR_PROTOCOLO_RESET_SENHA"
    >
      {!emailSent ? (
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5"
            >
              EMAIL_RECUPERAÇÃO
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="OPERATIVA@LUMI.COM"
              className="block w-full rounded-none bg-black border-white/20 text-white focus:border-white focus:ring-0 h-11 placeholder:text-white/20 font-mono text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-white text-black hover:bg-gray-200 rounded-none font-mono uppercase tracking-widest text-xs font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'ENVIAR_LINK_RESGATE'
            )}
          </Button>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="text-[10px] text-white/40 hover:text-white flex items-center justify-center font-mono uppercase tracking-widest transition-colors group"
            >
              <ArrowLeft className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" />
              RETORNAR_AO_LOGIN
            </Link>
          </div>
        </form>
      ) : (
        <div className="text-center space-y-6">
          <div className="border border-white/20 bg-white/5 p-6 rounded-none flex flex-col items-center">
            <ShieldAlert className="h-10 w-10 text-white/80 mb-4" />
            <p className="text-xs text-white/80 font-mono uppercase tracking-wide mb-2">
              TRANSMISSÃO_COM_SUCESSO
            </p>
            <p className="text-[10px] text-white/50 font-mono">
              INSTRUÇÕES_ENVIADAS_PARA: <br />
              <span className="text-white border-b border-white/20 pb-0.5">
                {email}
              </span>
            </p>
          </div>
          <Link
            to="/login"
            className="inline-block mt-4 text-xs text-white border-b border-white hover:border-transparent transition-colors font-mono uppercase tracking-widest"
          >
            RETORNAR_AO_LOGIN
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}
