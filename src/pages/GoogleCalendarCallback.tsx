import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const GoogleCalendarCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    'processing',
  )

  useEffect(() => {
    handleCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code')
      const state = searchParams.get('state') // user_id

      if (!code) {
        throw new Error('No authorization code received')
      }

      // Exchange code for tokens via Edge Function
      const { data, error } = await supabase.functions.invoke(
        'exchange-google-code',
        {
          body: {
            code,
            user_id: state,
            redirect_uri: window.location.href.split('?')[0], // passing current clean URL as redirect_uri
          },
        },
      )

      if (error) throw error
      if (data && !data.success)
        throw new Error(data.error || 'Exchange failed')

      setStatus('success')
      toast.success('Google Calendar Connected!')

      setTimeout(() => {
        navigate('/calendar')
      }, 2000)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setStatus('error')
      toast.error(`Connection failed: ${message}`)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl text-white font-bold">
              Conectando com Google Calendar...
            </h1>
            <p className="text-neutral-400 mt-2">
              Aguarde, estamos sincronizando seus eventos.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-2xl text-white font-bold">Conectado!</h1>
            <p className="text-neutral-400 mt-2">
              Redirecionando para a agenda...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✕</span>
            </div>
            <h1 className="text-2xl text-white font-bold">Erro na conexão</h1>
            <p className="text-neutral-400 mt-2 mb-4">
              Não foi possível conectar sua conta Google.
            </p>
            <button
              onClick={() => navigate('/calendar')}
              className="mt-4 px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
            >
              Voltar ao Calendário
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default GoogleCalendarCallback
