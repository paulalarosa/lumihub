import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export const useGoogleCalendar = () => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkConnection()
  }, [user])

  const checkConnection = async () => {
    if (!user) {
      setIsConnected(false)
      setIsLoading(false)
      return
    }

    const { data } = await supabase
      .from('google_calendar_tokens')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    setIsConnected(!!data)
    setIsLoading(false)
  }

  const connectGoogleCalendar = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/calendar/callback`
    const scope =
      'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'

    if (!clientId) {
      return
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', user?.id || '')

    window.location.href = authUrl.toString()
  }

  const disconnectGoogleCalendar = async () => {
    if (!user) return

    await supabase
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', user.id)

    setIsConnected(false)
  }

  return {
    isConnected,
    isLoading,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    checkConnection,
  }
}
