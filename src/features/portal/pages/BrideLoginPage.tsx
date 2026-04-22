import SEOHead from '@/components/seo/SEOHead'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Sparkles } from 'lucide-react'

interface ValidateBridePinResult {
  success: boolean
  error?: string
}

export default function BrideLoginPage() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !clientId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        clientId,
      )
    ) {
      toast({
        title: 'Login Inválido',
        description: 'Link de acesso incorreto.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const finalPin = String(pin).trim()

      const { data, error } = await supabase.rpc('validate_bride_pin', {
        p_client_id: clientId,
        p_pin_code: finalPin,
      })

      const validation = data as unknown as ValidateBridePinResult | null

      if (error) throw error

      if (!validation?.success) {
        toast({
          title: 'Acesso Negado',
          description:
            validation?.error || 'PIN incorreto ou acesso não autorizado.',
          variant: 'destructive',
        })
        return
      }

      const { data: tokenData, error: tokenError } = await supabase.rpc(
        'generate_bride_token',
        { p_client_id: clientId },
      )

      if (tokenError || !tokenData) {
        throw new Error('Erro ao gerar token de acesso')
      }

      const token = tokenData as unknown as string

      // Per-tab storage: expira ao fechar o navegador. Mais seguro pra
      // celulares emprestados ou desktop compartilhado. Sempre que a noiva
      // voltar depois, o PIN é redigitado.
      sessionStorage.setItem('bride_access_token', token)
      sessionStorage.setItem('bride_client_id', clientId)

      // Limpa chaves antigas do localStorage (histórico de versões anteriores)
      // caso ainda existam do device — migração silenciosa.
      localStorage.removeItem('bride_access_token')
      localStorage.removeItem('bride_client_id')
      localStorage.removeItem('bride_auth_id')
      localStorage.removeItem('bride_portal_session')
      localStorage.removeItem('is_bride_authenticated')
      localStorage.removeItem(`bride_pin_${clientId}`)

      toast({
        title: 'Bem-vinda de volta!',
        description: 'Acesso autorizado com sucesso.',
      })

      navigate(`/portal/${clientId}/dashboard`, { replace: true })
    } catch (error) {
      logger.error(error, 'BrideLoginPage.handleLogin', { showToast: false })
      toast({
        title: 'Erro no sistema',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-white selection:text-black">
      <SEOHead title="Acesso Portal" noindex={true} />
      <div className="w-full max-w-sm relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white" />

        <div className="text-center mb-16 space-y-4">
          <div className="flex justify-center mb-6">
            <Sparkles className="w-6 h-6 text-white" strokeWidth={1} />
          </div>
          <div>
            <p className="text-neutral-500 text-[10px] uppercase tracking-[0.4em] mb-2 font-medium">
              Bem-vinda ao
            </p>
            <h1 className="text-4xl font-serif text-white tracking-tight italic">
              KONTROL
            </h1>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-10">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <label
                htmlFor="bride-pin"
                className="block text-[10px] text-neutral-400 uppercase tracking-[0.2em]"
              >
                Código de Acesso
              </label>
              <p className="text-[11px] text-neutral-500 leading-relaxed px-2">
                Digite o código de 4 dígitos que a maquiadora enviou pra você
                por WhatsApp ou email.
              </p>
            </div>

            <div className="relative group">
              <div
                className={`
                  relative h-16 bg-neutral-900 border transition-all duration-300 flex items-center justify-center
                  ${focused ? 'border-white' : 'border-neutral-800 group-hover:border-neutral-700'}
                `}
              >
                <Input
                  id="bride-pin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setPin(val)
                  }}
                  placeholder=""
                  className="absolute inset-0 w-full h-full text-center text-3xl font-mono tracking-[0.5em]
                    bg-transparent border-none text-white focus:ring-0
                    placeholder:text-neutral-700 z-10 rounded-none"
                  autoComplete="off"
                />

                {pin.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center gap-6 pointer-events-none">
                    {[1, 2, 3, 4].map((i) => (
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
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Entrar'}
          </Button>
        </form>

        <div className="mt-10 text-center space-y-4">
          <div className="border-t border-neutral-900 pt-6">
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Não recebeu ou perdeu o código?
            </p>
            <p className="text-[10px] text-neutral-600 mt-1">
              Entre em contato com a maquiadora que fez seu cadastro — ela
              pode gerar um novo código pra você.
            </p>
          </div>
          <p className="text-[9px] text-neutral-800 uppercase tracking-widest font-mono">
            Ambiente seguro · Khaos Kontrol
          </p>
        </div>
      </div>
    </div>
  )
}
