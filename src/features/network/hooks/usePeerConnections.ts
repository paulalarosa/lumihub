import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export type ConnectionStatus = 'pending' | 'accepted' | 'declined'

export interface PeerConnection {
  id: string
  host_user_id: string
  peer_user_id: string
  invited_email: string
  status: ConnectionStatus
  message: string | null
  created_at: string
  responded_at: string | null
  // Lado "do outro" populado no select, pra UI mostrar nome de quem
  // você convidou ou quem te convidou.
  host_profile?: { full_name: string | null; email: string | null } | null
  peer_profile?: { full_name: string | null; email: string | null } | null
}

const CONNECTIONS_KEY = ['peer-connections']

export function usePeerConnections() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Realtime: RLS restringe ao que o user vê (host OR peer). Sem filter
  // explícito precisa — a policy já fecha o escopo.
  useRealtimeInvalidate({
    table: ['peer_connections'],
    invalidate: [CONNECTIONS_KEY],
    channelName: 'rt-peer-connections',
    enabled: !!user,
  })

  const query = useQuery({
    queryKey: [...CONNECTIONS_KEY, user?.id],
    queryFn: async (): Promise<PeerConnection[]> => {
      if (!user) return []
      const { data, error } = await supabase
        .from('peer_connections')
        .select(
          `
          *,
          host_profile:profiles!peer_connections_host_user_id_fkey (
            full_name, email
          ),
          peer_profile:profiles!peer_connections_peer_user_id_fkey (
            full_name, email
          )
        `,
        )
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as unknown as PeerConnection[]
    },
    enabled: !!user,
    staleTime: 1000 * 30,
  })

  const all = query.data ?? []

  // Buckets derivados — UI usa esses direto, sem filtrar de novo.
  const acceptedConnections = all.filter((c) => c.status === 'accepted')
  const receivedPending = all.filter(
    (c) => c.status === 'pending' && c.peer_user_id === user?.id,
  )
  const sentPending = all.filter(
    (c) => c.status === 'pending' && c.host_user_id === user?.id,
  )

  const invite = useMutation({
    mutationFn: async ({
      email,
      message,
    }: {
      email: string
      message?: string
    }) => {
      if (!user) throw new Error('Não autenticado')

      const normalized = email.trim().toLowerCase()

      if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        throw new Error('Email inválido')
      }

      // Lookup: essa pessoa existe na plataforma?
      const { data: target, error: lookupErr } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', normalized)
        .maybeSingle()

      if (lookupErr) throw lookupErr

      if (!target) {
        throw new Error(
          'NOT_A_USER:Essa pessoa ainda não tem conta na plataforma. Convide como assistente em /assistentes.',
        )
      }

      if (target.id === user.id) {
        throw new Error('Não dá pra convidar você mesma.')
      }

      // Dedupe: já existe conexão pending/accepted nessa direção?
      const { data: existing } = await supabase
        .from('peer_connections')
        .select('id, status')
        .eq('host_user_id', user.id)
        .eq('peer_user_id', target.id)
        .maybeSingle()

      if (existing) {
        if (existing.status === 'accepted') {
          throw new Error('Vocês já são parceiras.')
        }
        if (existing.status === 'pending') {
          throw new Error('Convite já enviado. Aguarde resposta.')
        }
        // Se declined, permite re-convidar reciclando a linha existente
        const { error: updErr } = await supabase
          .from('peer_connections')
          .update({
            status: 'pending',
            message: message?.trim() || null,
            responded_at: null,
          })
          .eq('id', existing.id)
        if (updErr) throw updErr
        return { re_invited: true }
      }

      const { error: insErr } = await supabase
        .from('peer_connections')
        .insert({
          host_user_id: user.id,
          peer_user_id: target.id,
          invited_email: normalized,
          status: 'pending',
          message: message?.trim() || null,
        })
      if (insErr) throw insErr

      return { invited: true, target_name: target.full_name }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_KEY })
      toast({
        title: 'Convite enviado',
        description: `${vars.email} vai ver o convite ao entrar na plataforma.`,
      })
    },
    onError: (err: Error) => {
      // Erros com prefixo NOT_A_USER têm UX própria (toast info) pra não
      // parecer "falha" de sistema — é estado esperado.
      const raw = err.message ?? ''
      if (raw.startsWith('NOT_A_USER:')) {
        toast({
          title: 'Essa pessoa não tem conta',
          description: raw.replace('NOT_A_USER:', '').trim(),
        })
        return
      }
      toast({ title: 'Erro ao convidar', description: raw, variant: 'destructive' })
      logger.error(err, 'usePeerConnections.invite')
    },
  })

  const respond = useMutation({
    mutationFn: async ({
      connectionId,
      accept,
    }: {
      connectionId: string
      accept: boolean
    }) => {
      const { error } = await supabase
        .from('peer_connections')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', connectionId)
      if (error) throw error
      return { accept }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_KEY })
      toast({
        title: result.accept ? 'Conexão aceita' : 'Convite recusado',
      })
    },
    onError: (err: Error) => {
      toast({
        title: 'Erro ao responder',
        description: err.message,
        variant: 'destructive',
      })
      logger.error(err, 'usePeerConnections.respond')
    },
  })

  const remove = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('peer_connections')
        .delete()
        .eq('id', connectionId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_KEY })
      toast({ title: 'Conexão removida' })
    },
    onError: (err: Error) => {
      toast({
        title: 'Erro ao remover',
        description: err.message,
        variant: 'destructive',
      })
      logger.error(err, 'usePeerConnections.remove')
    },
  })

  return {
    connections: all,
    acceptedConnections,
    receivedPending,
    sentPending,
    isLoading: query.isLoading,
    isError: query.isError,
    invite,
    respond,
    remove,
  }
}
