import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TableLoader } from '@/components/ui/LoadingStates'
import { Plus, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'

export interface ServiceRecord {
  id: string
  name: string
  description: string | null
  price: number | null
  duration_minutes: number | null
  display_order: number
  is_visible: boolean
}

export function ServicesEditor({ micrositeId }: { micrositeId?: string }) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
  })

  const { data: services, isLoading } = useQuery({
    queryKey: ['microsite-services', micrositeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('microsite_services' as never)
        .select('*')
        .eq('microsite_id', micrositeId!)
        .order('display_order')
      if (error) throw error
      return (data || []) as unknown as ServiceRecord[]
    },
    enabled: !!micrositeId,
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('microsite_services' as never)
        .insert({
          microsite_id: micrositeId,
          name: newService.name,
          description: newService.description || null,
          price: newService.price ? parseFloat(newService.price) : null,
          duration_minutes: newService.duration_minutes
            ? parseInt(newService.duration_minutes)
            : null,
          display_order: (services?.length || 0) + 1,
        } as never)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-services'] })
      setIsAdding(false)
      setNewService({
        name: '',
        description: '',
        price: '',
        duration_minutes: '',
      })
      toast.success('Serviço adicionado!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('microsite_services' as never)
        .delete()
        .eq('id', serviceId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-services'] })
      toast.success('Serviço removido!')
    },
  })

  if (!micrositeId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-neutral-400">
            Salve o microsite primeiro para adicionar serviços.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Serviços</CardTitle>
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <TableLoader />}

        {services?.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg"
          >
            <div className="flex-1">
              <p className="font-semibold text-white">{service.name}</p>
              {service.description && (
                <p className="text-sm text-neutral-400 mt-0.5">
                  {service.description}
                </p>
              )}
              <div className="flex gap-3 mt-1 text-xs text-neutral-500">
                {service.price != null && <span>R$ {service.price}</span>}
                {service.duration_minutes && (
                  <span>{service.duration_minutes}min</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate(service.id)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}

        {isAdding && (
          <div className="p-4 bg-neutral-900 rounded-lg space-y-3">
            <Input
              placeholder="Nome do serviço *"
              value={newService.name}
              onChange={(e) =>
                setNewService({ ...newService, name: e.target.value })
              }
            />
            <Textarea
              placeholder="Descrição"
              value={newService.description}
              onChange={(e) =>
                setNewService({ ...newService, description: e.target.value })
              }
              rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Preço (R$)"
                value={newService.price}
                onChange={(e) =>
                  setNewService({ ...newService, price: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Duração (min)"
                value={newService.duration_minutes}
                onChange={(e) =>
                  setNewService({
                    ...newService,
                    duration_minutes: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!newService.name || addMutation.isPending}
              >
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {!isLoading && (!services || services.length === 0) && !isAdding && (
          <div className="text-center py-10">
            <Star className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500">Nenhum serviço cadastrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
