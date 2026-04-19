import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AssistantRow {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  created_at: string | null
  is_upgraded: boolean | null
  owner_name: string
  owner_email: string
}

export default function AdminAssistants() {
  const { toast } = useToast()
  const [assistants, setAssistants] = useState<AssistantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchAssistants = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('assistants')
        .select('id, full_name, email, phone, created_at, is_upgraded, user_id')
        .order('created_at', { ascending: false })

      if (error) throw error

      const assistantsList = data || []

      const ownerIds = [...new Set(assistantsList.map((a) => a.user_id).filter(Boolean))] as string[]
      const profileMap: Record<string, { full_name: string | null; email: string | null }> = {}

      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ownerIds)
        ;(profiles || []).forEach((p) => {
          profileMap[p.id] = { full_name: p.full_name, email: p.email }
        })
      }

      const enriched = assistantsList.map((a) => {
        const owner = a.user_id ? profileMap[a.user_id] : null
        return {
          id: a.id,
          full_name: a.full_name,
          email: a.email,
          phone: a.phone,
          created_at: a.created_at,
          is_upgraded: a.is_upgraded,
          owner_name: owner?.full_name || 'Desconhecido',
          owner_email: owner?.email || '',
        }
      })

      setAssistants(enriched)
    } catch (error) {
      logger.error(error, 'AdminAssistants.fetchAssistants', {
        showToast: false,
      })
      toast({
        title: 'Erro ao carregar assistentes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAssistants()

    const channel = supabase
      .channel('admin-assistants-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assistants' },
        () => fetchAssistants(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAssistants])

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const { error: accessError } = await supabase
        .from('assistant_access')
        .delete()
        .eq('assistant_id', deleteId)

      if (accessError) throw accessError

      const { error: assistantError } = await supabase
        .from('assistants')
        .delete()
        .eq('id', deleteId)

      if (assistantError) throw assistantError

      setAssistants((prev) => prev.filter((a) => a.id !== deleteId))
      toast({
        title: 'Assistente removida',
        description: 'O cadastro e todos os vínculos foram apagados.',
      })
    } catch (error) {
      logger.error(error, 'AdminAssistants.handleDelete', { showToast: false })
      toast({
        title: 'Erro ao excluir',
        description:
          'Não foi possível remover. Verifique se existem outros registros dependentes.',
        variant: 'destructive',
      })
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-xs uppercase animate-pulse">
        Carregando Assistentes...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif text-white">Gestão de Assistentes</h2>
        <Badge
          variant="outline"
          className="font-mono text-xs border-white/20 text-white"
        >
          {assistants.length} Cadastradas
        </Badge>
      </div>

      <div className="border border-white/10 rounded-none bg-black overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-gray-500 font-mono text-[10px] uppercase">
                Assistente
              </TableHead>
              <TableHead className="text-gray-500 font-mono text-[10px] uppercase">
                Profissional Responsável
              </TableHead>
              <TableHead className="text-gray-500 font-mono text-[10px] uppercase">
                Status
              </TableHead>
              <TableHead className="text-right text-gray-500 font-mono text-[10px] uppercase">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assistants.map((assistant) => (
              <TableRow
                key={assistant.id}
                className="border-white/5 hover:bg-white/5"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 rounded-none border border-white/10">
                      <AvatarFallback className="bg-white/10 text-white text-xs">
                        {assistant.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-white font-medium text-sm">
                        {assistant.full_name}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {assistant.email || assistant.phone || '—'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-white/80 text-sm">{assistant.owner_name}</div>
                    {assistant.owner_email && (
                      <div className="text-gray-500 text-xs">{assistant.owner_email}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] border-white/20 ${
                      assistant.is_upgraded ? 'text-yellow-400 border-yellow-400/30' : 'text-gray-400'
                    }`}
                  >
                    {assistant.is_upgraded ? 'UPGRADED' : 'FREE'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-400 hover:bg-red-950/30 rounded-none"
                    onClick={() => setDeleteId(assistant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {assistants.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-gray-500"
                >
                  Nenhuma assistente encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-black border border-white/20 rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="text-red-500 h-5 w-5" />
              Excluir Cadastro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta ação removerá a assistente e todos os vínculos com profissionais.
              O acesso será revogado imediatamente.
              <br />
              <br />
              <span className="text-xs font-mono uppercase text-red-500">
                Ação irreversível.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none bg-transparent border-white/20 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-none bg-red-600 text-white hover:bg-red-700 font-bold uppercase tracking-widest"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
