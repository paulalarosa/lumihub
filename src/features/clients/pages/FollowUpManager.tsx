import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { QUERY_KEYS } from '@/constants/queryKeys'

const TRIGGER_TYPES = [
  {
    value: 'booking_confirmation',
    label: 'Confirmação de Reserva',
    icon: '✅',
  },
  { value: 'reminder_7days', label: 'Lembrete 7 Dias Antes', icon: '📅' },
  { value: 'reminder_24h', label: 'Lembrete 24h Antes', icon: '⏰' },
  { value: 'post_event_review', label: 'Pedido de Avaliação', icon: '⭐' },
  { value: 'reengagement_30days', label: 'Reengajamento 30 Dias', icon: '💌' },
]

export interface MessageTemplate {
  id: string
  name: string
  body: string
  subject?: string
  is_active: boolean
  send_at_time?: string
  trigger_type: string
  channel?: string
}

export const FollowUpManager = () => {
  const queryClient = useQueryClient()
  const [selectedTemplate, setSelectedTemplate] =
    useState<MessageTemplate | null>(null)

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('trigger_type')

      if (error) throw error
      return data
    },
  })

  // Update template
  const updateMutation = useMutation({
    mutationFn: async (template: MessageTemplate) => {
      const { error } = await supabase
        .from('message_templates')
        .update({
          name: template.name,
          body: template.body,
          subject: template.subject,
          is_active: template.is_active,
          send_at_time: template.send_at_time,
        })
        .eq('id', template.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MESSAGE_TEMPLATES],
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SCHEDULED_FOLLOWUPS],
      })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      toast.success('Template atualizado!')
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`)
    },
  })

  return (
    <div className="container mx-auto p-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-8 text-white">
        Automação de Follow-ups
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Lista de Templates */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">Templates</h2>
          <div className="space-y-2">
            {templates?.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={cn(
                  'w-full p-4 rounded-lg border text-left transition-colors',
                  selectedTemplate?.id === template.id
                    ? 'bg-purple-900/30 border-purple-500'
                    : 'bg-neutral-900 border-neutral-700 hover:border-neutral-600',
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {TRIGGER_TYPES.find(
                        (t) => t.value === template.trigger_type,
                      )?.icon || '📝'}
                    </span>
                    <span className="font-semibold text-white">
                      {template.name}
                    </span>
                  </div>
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={(checked) => {
                      // Optimistic update logic could go here, but for now we just mutate
                      const updated = { ...template, is_active: checked }
                      // We need to update local state if it's selected
                      if (selectedTemplate?.id === template.id) {
                        setSelectedTemplate(updated)
                      }
                      updateMutation.mutate(updated)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <p className="text-sm text-neutral-400 line-clamp-2 font-mono">
                  {template.body}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor de Template */}
        {selectedTemplate ? (
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Editar Template
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Nome
                </label>
                <Input
                  value={selectedTemplate.name}
                  onChange={(e) =>
                    setSelectedTemplate({
                      ...selectedTemplate,
                      name: e.target.value,
                    })
                  }
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Canal
                </label>
                <Select value={selectedTemplate.channel} disabled>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate.channel === 'email' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Assunto
                  </label>
                  <Input
                    value={selectedTemplate.subject || ''}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        subject: e.target.value,
                      })
                    }
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Mensagem
                </label>
                <Textarea
                  value={selectedTemplate.body}
                  onChange={(e) =>
                    setSelectedTemplate({
                      ...selectedTemplate,
                      body: e.target.value,
                    })
                  }
                  rows={12}
                  className="font-mono text-sm bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Horário Preferido (opcional)
                </label>
                <Input
                  type="time"
                  value={selectedTemplate.send_at_time || ''}
                  onChange={(e) =>
                    setSelectedTemplate({
                      ...selectedTemplate,
                      send_at_time: e.target.value,
                    })
                  }
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
                <p className="text-xs text-neutral-400 mt-1">
                  Se definido, mensagens serão enviadas neste horário
                </p>
              </div>

              <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <p className="text-sm font-medium mb-2 text-gray-300">
                  Variáveis Disponíveis:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'client_name',
                    'event_date',
                    'event_time',
                    'event_location',
                    'makeup_artist_name',
                    'review_link',
                  ].map((variable) => (
                    <button
                      type="button"
                      key={variable}
                      className="px-2 py-1 bg-neutral-700 rounded text-xs text-purple-400 cursor-pointer hover:bg-neutral-600 transition-colors border border-transparent hover:border-purple-500/50"
                      onClick={() => {
                        const textarea = document.querySelector('textarea')
                        if (textarea) {
                          // This is a bit of a hack to insert at cursor, seeing as we don't have a ref
                          // Ideally we would use a ref, but for this quick impl it works if the textarea is focused or we append
                          const newBody =
                            selectedTemplate.body + `{${variable}}`
                          setSelectedTemplate({
                            ...selectedTemplate,
                            body: newBody,
                          })
                        }
                      }}
                    >
                      {`{${variable}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => updateMutation.mutate(selectedTemplate)}
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Template'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                  className="border-neutral-700 text-white hover:bg-neutral-800"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px] border border-dashed border-neutral-800 rounded-lg text-neutral-500">
            Selecione um template para editar
          </div>
        )}
      </div>

      {/* Histórico de Envios */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Próximos Envios Agendados
        </h2>
        <ScheduledFollowupsTable />
      </div>
    </div>
  )
}

const ScheduledFollowupsTable = () => {
  const { data: scheduled } = useQuery({
    queryKey: ['scheduled-followups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_followups')
        .select(
          `
            *, 
            template:message_templates(name), 
            project:projects(
                client:wedding_clients(name)
            )
        `,
        )
        .eq('status', 'pending')
        .order('scheduled_for')
        .limit(20)

      if (error) throw error
      return data
    },
  })

  if (!scheduled?.length) {
    return <div className="text-neutral-500 italic">Nenhum envio agendado.</div>
  }

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-800">
          <tr>
            <th className="p-4 text-left text-neutral-300 font-medium">
              Cliente
            </th>
            <th className="p-4 text-left text-neutral-300 font-medium">
              Template
            </th>
            <th className="p-4 text-left text-neutral-300 font-medium">
              Enviar em
            </th>
            <th className="p-4 text-left text-neutral-300 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {scheduled?.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-neutral-800/50 transition-colors"
            >
              <td className="p-4 text-white">
                {/* @ts-expect-error - nested join types are dynamic */}
                {item.project?.client?.name || 'Cliente Desconhecido'}
              </td>
              <td className="p-4 text-white">
                {/* @ts-expect-error - nested join types are dynamic */}
                {item.template?.name || 'Template Removido'}
              </td>
              <td className="p-4 text-neutral-300">
                {new Date(item.scheduled_for).toLocaleString('pt-BR')}
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded text-xs border border-yellow-900/50 uppercase tracking-wider font-bold">
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
