import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { LoadingSpinner as TableLoader } from '@/components/ui/PageLoader'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2, Copy } from 'lucide-react'

export const AssistantList = () => {
  const { user } = useAuth()
  const { toast } = useToast()

  const { data: makeupArtist, isLoading: maLoading } = useQuery({
    queryKey: ['makeup-artist-profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('makeup_artists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) return data

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

      const { data: created } = await supabase
        .from('makeup_artists')
        .insert({
          user_id: user.id,
          business_name:
            profile?.full_name || user.email?.split('@')[0] || 'Profissional',
        })
        .select('id')
        .single()

      return created || null
    },
    enabled: !!user,
    retry: false,
  })

  const makeupArtistId = makeupArtist?.id

  const {
    data: assistantsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['assistants-list', makeupArtistId],
    queryFn: async () => {
      const { data: accessData, error } = await supabase

        .from('assistant_access')
        .select(
          `
                    id, status, granted_at,
                    assistant:assistants (id, full_name, email, phone, pin, access_pin)
                `,
        )
        .eq('makeup_artist_id', makeupArtistId)
        .eq('status', 'active')

      if (error) throw error

      return {
        active: accessData || [],
      }
    },
    enabled: !!makeupArtistId,
  })

  const handleRevoke = async (accessId: string) => {
    try {
      const { error } = await supabase
        .from('assistant_access')
        .update({ status: 'revoked', revoked_at: new Date().toISOString() })
        .eq('id', accessId)

      if (error) throw error
      toast({ title: 'Acesso revogado.' })
      refetch()
    } catch (e) {
      toast({
        title: 'Erro ao revogar',
        description: e instanceof Error ? e.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  const copyAccessLink = (assistantPin: string) => {
    const link = `${window.location.origin}/agenda-equipa/${makeupArtistId}`
    const textToCopy = `Acesso à Agenda da Assistente\n\nLink: ${link}\nPIN: ${assistantPin}`
    navigator.clipboard.writeText(textToCopy)
    toast({
      title: 'Dados copiados!',
      description: 'Link e PIN copiados para a área de transferência.',
    })
  }

  if (maLoading || isLoading) return <TableLoader />

  const activeList = assistantsData?.active || []

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Equipa Ativa</h3>
        <div className="border rounded-md bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email de Acesso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acesso (PIN)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeList.map((item: Record<string, unknown>) => {
                const finalPin =
                  item.assistant?.pin || item.assistant?.access_pin || 'N/A'
                return (
                  <TableRow key={item.id as string}>
                    <TableCell className="font-medium">
                      {}
                      {item.assistant?.full_name || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {}
                      {item.assistant?.email || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Ativo
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold bg-secondary px-2 py-1 rounded">
                          {finalPin}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyAccessLink(finalPin)}
                          title="Copiar Link e PIN"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevoke(item.id as string)}
                        title="Remover da equipa"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {activeList.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground h-24"
                  >
                    Nenhuma assistente cadastrada. Adicione membros à sua
                    equipa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
