import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export interface PendingPeerMigration {
  id: string
  profile_id: string
  assistant_access_id: string
  host_user_id: string
  assistant_email: string
  created_at: string
  host_profile?: { full_name: string | null; email: string | null } | null
}

const KEY = ['pending-peer-migrations']

export function usePendingPeerMigrations() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useRealtimeInvalidate({
    table: ['pending_peer_migrations'],
    invalidate: [KEY],
    channelName: 'rt-pending-peer-migrations',
    enabled: !!user,
  })

  const query = useQuery({
    queryKey: [...KEY, user?.id],
    queryFn: async (): Promise<PendingPeerMigration[]> => {
      if (!user) return []
      const { data, error } = await supabase
        .from('pending_peer_migrations')
        .select(
          `
          *,
          host_profile:profiles!pending_peer_migrations_host_user_id_fkey (
            full_name, email
          )
        `,
        )
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as PendingPeerMigration[]
    },
    enabled: !!user,
  })

  // Aceitar migração: cria uma peer_connection com o host + marca o
  // assistant_access como 'upgraded' + deleta a pending. Tudo em ordem
  // pra não deixar lixo em caso de falha parcial.
  const accept = useMutation({
    mutationFn: async (migration: PendingPeerMigration) => {
      if (!user) throw new Error('Não autenticado')

      // 1. Cria peer_connection com status pending — host ainda aceita ou recusa
      const { error: connErr } = await supabase
        .from('peer_connections')
        .insert({
          host_user_id: migration.host_user_id,
          peer_user_id: user.id,
          invited_email: migration.assistant_email.toLowerCase(),
          status: 'pending',
          message:
            'Migração automática — eu era sua assistente e agora tenho conta na plataforma.',
        })
        .select('id')
        .maybeSingle()

      // Ignora "já existe" (unique constraint) — significa que já tinha
      // sido convidada antes. Qualquer outro erro quebra o fluxo.
      if (connErr && !connErr.message.includes('duplicate')) {
        throw connErr
      }

      // 2. Marca o access como upgraded (PIN fica inválido pra login)
      const { error: upErr } = await supabase
        .from('assistant_access')
        .update({
          status: 'upgraded',
          upgraded_at: new Date().toISOString(),
        })
        .eq('id', migration.assistant_access_id)
      if (upErr) throw upErr

      // 3. Deleta o pendente — não precisamos mais ofertar
      const { error: delErr } = await supabase
        .from('pending_peer_migrations')
        .delete()
        .eq('id', migration.id)
      if (delErr) throw delErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      queryClient.invalidateQueries({ queryKey: ['peer-connections'] })
      toast({
        title: 'Migração enviada',
        description: 'A maquiadora vai ver sua solicitação de conexão.',
      })
    },
    onError: (err: Error) => {
      toast({
        title: 'Erro ao migrar',
        description: err.message,
        variant: 'destructive',
      })
      logger.error(err, 'usePendingPeerMigrations.accept')
    },
  })

  // Recusar migração: deleta a pending e MANTÉM o assistant_access ativo —
  // a pessoa continua sendo assistente-PIN daquela maquiadora se quiser.
  const dismiss = useMutation({
    mutationFn: async (migrationId: string) => {
      const { error } = await supabase
        .from('pending_peer_migrations')
        .delete()
        .eq('id', migrationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
    },
    onError: (err: Error) => {
      toast({
        title: 'Erro ao dispensar',
        description: err.message,
        variant: 'destructive',
      })
      logger.error(err, 'usePendingPeerMigrations.dismiss')
    },
  })

  return {
    migrations: query.data ?? [],
    isLoading: query.isLoading,
    accept,
    dismiss,
  }
}
