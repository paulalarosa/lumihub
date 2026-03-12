import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Plus, Copy, Check, ArrowRight } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface Assistant {
  id: string
  full_name: string
  email: string | null
  is_registered: boolean
  invite_token: string | null
}

export function AssistantsPanelCard() {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchAssistants()
  }, [])

  const fetchAssistants = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // @ts-expect-error - Expected missing table typescript definition
      const { data, error } = await supabase
        .from('assistants')
        .select('id, full_name, phone, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setAssistants(
        ((data as unknown as Record<string, unknown>[]) || []).map((a) => ({
          id: String(a.id),
          full_name: String(a.full_name),
          email: null,
          is_registered: true,
          invite_token: null,
        })),
      )
    } catch (error) {
      void error
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async (assistant: Assistant) => {
    if (!assistant.invite_token) return

    const link = `${window.location.origin}/assistente/convite/${assistant.invite_token}`
    await navigator.clipboard.writeText(link)
    setCopiedId(assistant.id)
    toast.success('Link copiado!')

    setTimeout(() => setCopiedId(null), 2000)
  }

  const registeredCount = assistants.filter((a) => a.is_registered).length
  const pendingCount = assistants.filter((a) => !a.is_registered).length

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Minhas Assistentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Minhas Assistentes
          </CardTitle>
          <CardDescription>
            {assistants.length === 0
              ? 'Nenhuma assistente cadastrada'
              : `${registeredCount} registrada${registeredCount !== 1 ? 's' : ''} • ${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`}
          </CardDescription>
        </div>
        <Button asChild size="sm">
          <Link to="/assistentes">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {assistants.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Cadastre assistentes para vincular a eventos
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assistants.map((assistant) => (
              <div
                key={assistant.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {assistant.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{assistant.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {assistant.email || 'Sem email'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {assistant.is_registered ? (
                    <span className="lumi-badge-active">Ativa</span>
                  ) : (
                    <>
                      <span className="lumi-badge-pending">Pendente</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                        onClick={() => copyInviteLink(assistant)}
                      >
                        {copiedId === assistant.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {assistants.length >= 5 && (
              <Button asChild variant="ghost" className="w-full mt-2">
                <Link to="/assistentes">
                  Ver todas
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
