import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const AuthCallbackHandler = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    'processing',
  )
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [loadingText, setLoadingText] = useState('Processando autenticação...')

  useEffect(() => {
    const urlError = searchParams.get('error')

    if (urlError) {
      setStatus('error')
      setErrorMessage(
        searchParams.get('error_description') ||
          'Erro na autenticação com Google.',
      )
      return
    }

    setLoadingText('Validando conexão com Google...')

    const handleSessionReady = async (userId: string) => {
      try {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', userId)
      } catch {

      }
      setStatus('success')
      setTimeout(() => navigate('/dashboard'), 1500)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
        session?.user
      ) {
        subscription.unsubscribe()
        await handleSessionReady(session.user.id)
      }
    })

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        subscription.unsubscribe()
        setStatus('error')
        setErrorMessage(error.message || 'Erro ao validar a sessão.')
        return
      }

      if (data.session?.user) {
        subscription.unsubscribe()
        await handleSessionReady(data.session.user.id)
        return
      }

      const timeout = setTimeout(() => {
        subscription.unsubscribe()
        setStatus('error')
        setErrorMessage(
          'A sessão demorou demais para responder. Por favor, tente novamente.',
        )
      }, 15_000)

      return () => clearTimeout(timeout)
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans selection:bg-black selection:text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] opacity-40 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03]" />

      <div className="w-full max-w-md bg-white border border-neutral-200 p-12 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] text-center relative z-10 rounded-sm">
        {status === 'processing' && (
          <div className="space-y-8">
            <div className="mx-auto w-16 h-16 bg-neutral-100 flex items-center justify-center rounded-sm">
              <Loader2 className="h-8 w-8 animate-spin text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2 tracking-tight">
                Syncing...
              </h2>
              <p className="text-neutral-500 font-medium">{loadingText}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8">
            <div className="mx-auto w-16 h-16 bg-black flex items-center justify-center rounded-sm">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2 tracking-tight">
                Connected
              </h2>
              <p className="text-neutral-500 font-medium">
                Autenticação concluída com sucesso.
                <br />
                Redirecionando...
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8">
            <div className="mx-auto w-16 h-16 bg-red-50 flex items-center justify-center border border-red-100 rounded-sm">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2 tracking-tight">
                Connection Failed
              </h2>
              <p className="text-red-600/90 font-medium text-sm bg-red-50 p-4 border border-red-100 mb-8 rounded-sm">
                {errorMessage}
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-12 text-sm font-bold bg-black text-white hover:bg-neutral-900 hover:text-[#D4AF37] rounded-sm transition-all duration-300 shadow-sm uppercase tracking-wider"
                >
                  Tentar novamente
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="w-full h-12 text-neutral-400 hover:text-neutral-900 hover:bg-transparent text-xs font-semibold uppercase tracking-widest"
                >
                  Ir para o Dashboard
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthCallbackHandler
