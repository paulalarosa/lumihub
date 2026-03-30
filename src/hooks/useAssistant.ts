import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'
import { AssistantInvite } from '@/types/custom-schema'
import { logger } from '@/services/logger'

export const useAssistant = () => {
  const { user } = useAuth()
  const [invites, setInvites] = useState<AssistantInvite[]>([])
  const [loading, setLoading] = useState(false)

  const fetchInvites = async () => {
    if (!user) return
    setLoading(true)
    try {
      // 1. Get the Makeup Artist Profile ID for this user
      const { data: maData } = await supabase
        .from('makeup_artists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      const makeupArtistId = maData?.id

      if (!makeupArtistId) return

      const { data, error } = await supabase
        .from('assistant_invites')
        .select('*')
        .eq('makeup_artist_id', makeupArtistId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvites(data || [])
    } catch (error) {
      logger.error(error, {
        message: 'Erro ao carregar convites.',
      })
    } finally {
      setLoading(false)
    }
  }

  const sendInvite = async (email: string) => {
    if (!user) {
      logger.error(new Error('No user logged in'), {
        message: 'Você precisa estar logado.',
      })
      return
    }

    setLoading(true)
    try {
      // 1. Check if already invited
      const { data: existing } = await supabase
        .from('assistant_invites')
        .select('id')
        .eq('assistant_email', email)
        .eq('status', 'pending')
        .maybeSingle()

      if (existing) {
        toast.error('Este email já possui um convite pendente.')
        setLoading(false)
        return
      }

      const namePart = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
      const randomPart = Math.random().toString(36).substring(2, 6)
      const inviteCode = `${namePart}-${randomPart}`

      // 1. Get the Makeup Artist Profile ID
      const { data: maData } = await supabase
        .from('makeup_artists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      const makeupArtistId = maData?.id
      if (!makeupArtistId) {
        toast.error('Perfil de maquiadora não encontrado')
        setLoading(false)
        return
      }

      const payload = {
        assistant_email: email,
        makeup_artist_id: makeupArtistId,
        invite_token: inviteCode,
      }

      const { data, error: insertError } = await supabase
        .from('assistant_invites')
        .insert([payload])
        .select()
        .maybeSingle()

      if (insertError) throw insertError

      toast.success(`Convite enviado para ${email}`)
      fetchInvites()
      return data
    } catch (error) {
      logger.error(error, {
        message: 'Erro ao enviar convite.',
        context: { email },
      })
    } finally {
      setLoading(false)
    }
  }

  const revokeInvite = async (id: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('assistant_invites')
        .update({ status: 'revoked' })
        .eq('id', id)

      if (error) throw error
      toast.success('Convite revogado')
      fetchInvites()
    } catch (error) {
      logger.error(error, {
        message: 'Erro ao revogar convite.',
        context: { inviteId: id },
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    invites,
    loading,
    fetchInvites,
    sendInvite,
    revokeInvite,
  }
}
