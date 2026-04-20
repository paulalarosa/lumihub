import SEOHead from '@/components/seo/SEOHead'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { PageLoader } from '@/components/ui/page-loader'

import { Button } from '@/components/ui/button'
import { AssistantSignupForm } from '@/features/assistants/components/AssistantSignupForm'
import { getErrorMessage } from '@/utils/error-handler'

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (user && token && !processing && !error) {
      acceptInvite()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, token])

  const acceptInvite = async () => {
    if (!token || !user) return
    setProcessing(true)

    try {
      const { data, error } = await supabase.rpc('accept_assistant_invite', {
        p_invite_token: token,
        p_user_id: user.id,
      })

      if (error) throw error

      const result = data as {
        success: boolean
        is_new_connection: boolean
        error?: string
      }

      if (result.success) {
        toast({
          title: result.is_new_connection
            ? 'Acesso Concedido!'
            : 'Acesso Verificado',
          description: 'Você agora tem acesso à agenda desta maquiadora.',
        })
        setTimeout(() => navigate('/assistant/dashboard'), 1500)
      } else {
        const errorMessage = result.error || 'Convite inválido ou expirado.'
        setError(errorMessage)
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } catch (err: unknown) {
      const { title, description } = getErrorMessage(
        err,
        'Erro ao aceitar convite',
      )
      setError(description)
      toast({
        title,
        description,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading) return <PageLoader />

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AssistantSignupForm token={token || ''} />
      </div>
    )
  }

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <PageLoader />
        <p className="text-muted-foreground animate-pulse mt-4">
          Verificando convite e configurando acesso...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <SEOHead title="Aceitar Convite" noindex={true} />
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-8 rounded-lg max-w-md w-full text-center shadow-lg">
          <h3 className="text-xl font-bold mb-4">Erro no Convite</h3>
          <p className="mb-6">{error}</p>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
          >
            Voltar para Início
          </Button>
        </div>
      </div>
    )
  }

  return null
}

