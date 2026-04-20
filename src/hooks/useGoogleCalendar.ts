import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { invokeEdgeFunction } from '@/lib/invokeEdge'
import { toast } from 'sonner'

export const useGoogleCalendar = () => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [needsReauth, setNeedsReauth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkConnection = useCallback(async () => {
    if (!user) {
      setIsConnected(false)
      setNeedsReauth(false)
      setIsLoading(false)
      return
    }

    const { data } = await supabase
      .from('google_calendar_tokens')
      .select('id, needs_reauth')
      .eq('user_id', user.id)
      .maybeSingle()

    setIsConnected(!!data)
    setNeedsReauth(!!data?.needs_reauth)
    setIsLoading(false)
  }, [user])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // Silent refresh on mount + every 45min while session alive.
  // Keeps access_token valid without forcing the user to log in again.
  // Guard: only attempts refresh after `checkConnection` confirms a token row
  // exists, otherwise the Edge Function returns 401 (no Google connection)
  // and pollutes the console on every page mount.
  useEffect(() => {
    if (!user || isLoading || !isConnected) return
    let cancelled = false

    const refresh = async () => {
      const { data } = await invokeEdgeFunction<{
        status?: string
        reason?: string
      }>('google-token-refresh', {}, { passUserToken: true })
      if (cancelled) return
      if (data?.status === 'needs_reauth') {
        setNeedsReauth(true)
      } else if (data?.status === 'refreshed' || data?.status === 'fresh') {
        setNeedsReauth(false)
      }
    }

    refresh()
    const timer = setInterval(refresh, 45 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [user, isLoading, isConnected])

  const connectGoogleCalendar = async () => {
    setIsLoading(true)
    try {
      const redirectUri = `${window.location.origin}/calendar/callback`

      const { data, error } = await supabase.functions.invoke(
        'google-calendar-auth',
        {
          body: { action: 'get-auth-url', redirect_uri: redirectUri },
        },
      )

      if (error) throw error
      if (!data?.url) throw new Error('URL de autenticação não retornada')

      window.location.href = data.url
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao iniciar conexão com Google'
      toast.error(message)
      setIsLoading(false)
    }
  }

  const disconnectGoogleCalendar = async () => {
    if (!user) return
    setIsLoading(true)

    await supabase
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', user.id)

    setIsConnected(false)
    setIsLoading(false)
    toast.success('Google Calendar desconectado')
  }

  return {
    isConnected,
    needsReauth,
    isLoading,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    checkConnection,
  }
}
