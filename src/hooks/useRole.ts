import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'

export const useRole = () => {
  const { user } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setRole(null)
      setLoading(false)
      return
    }

    const checkRole = async () => {
      setLoading(true)

      try {
        const { data: makeup } = await supabase
          .from('makeup_artists')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (makeup) {
          setRole('makeup_artist')
          return
        }

        const { data: assistant } = await supabase
          .from('assistants')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (assistant) {
          setRole('assistant')
          return
        }

        setRole(null)
      } catch (error) {
        logger.error(error, {
          message: 'Erro ao verificar perfil de acesso.',
          showToast: false,
        })
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    checkRole()
  }, [user])

  return {
    role,
    isAssistant: role === 'assistant',
    isMakeupArtist: role === 'makeup_artist',
    loading,
  }
}
