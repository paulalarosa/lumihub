import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner as TableLoader } from '@/components/ui/PageLoader'
import { Plus, Trash2, Star, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

export interface TestimonialRecord {
  id: string
  client_name: string
  rating: number | null
  text: string
  event_type: string | null
  is_visible: boolean
  display_order: number
}

export function TestimonialsEditor({ micrositeId }: { micrositeId?: string }) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newTestimonial, setNewTestimonial] = useState({
    client_name: '',
    text: '',
    rating: '5',
    event_type: '',
  })

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['microsite-testimonials', micrositeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('microsite_testimonials' as never)
        .select('*')
        .eq('microsite_id', micrositeId!)
        .order('display_order')
      if (error) throw error
      return data || []
    },
    enabled: !!micrositeId,
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('microsite_testimonials' as never)
        .insert({
          microsite_id: micrositeId,
          client_name: newTestimonial.client_name,
          text: newTestimonial.text,
          rating: parseInt(newTestimonial.rating),
          event_type: newTestimonial.event_type || null,
          display_order: (testimonials?.length || 0) + 1,
        } as never)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-testimonials'] })
      setIsAdding(false)
      setNewTestimonial({
        client_name: '',
        text: '',
        rating: '5',
        event_type: '',
      })
      toast.success('Depoimento adicionado!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('microsite_testimonials' as never)
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-testimonials'] })
      toast.success('Depoimento removido!')
    },
  })

  if (!micrositeId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-neutral-400">
            Salve o microsite primeiro para adicionar depoimentos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Depoimentos</CardTitle>
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <TableLoader />}

        {testimonials?.map((t) => (
          <div
            key={t.id}
            className="flex items-start justify-between p-4 bg-neutral-900 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white">{t.client_name}</p>
                {t.event_type && (
                  <span className="text-xs text-neutral-500">
                    • {t.event_type}
                  </span>
                )}
              </div>
              {t.rating && (
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
              )}
              <p className="text-sm text-neutral-400 mt-1 italic line-clamp-2">
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate(t.id)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}

        {isAdding && (
          <div className="p-4 bg-neutral-900 rounded-lg space-y-3">
            <Input
              placeholder="Nome do cliente *"
              value={newTestimonial.client_name}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  client_name: e.target.value,
                })
              }
            />
            <Textarea
              placeholder="Depoimento *"
              value={newTestimonial.text}
              onChange={(e) =>
                setNewTestimonial({ ...newTestimonial, text: e.target.value })
              }
              rows={3}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="1"
                max="5"
                placeholder="Nota (1-5)"
                value={newTestimonial.rating}
                onChange={(e) =>
                  setNewTestimonial({
                    ...newTestimonial,
                    rating: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Tipo de evento"
                value={newTestimonial.event_type}
                onChange={(e) =>
                  setNewTestimonial({
                    ...newTestimonial,
                    event_type: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => addMutation.mutate()}
                disabled={
                  !newTestimonial.client_name ||
                  !newTestimonial.text ||
                  addMutation.isPending
                }
              >
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {!isLoading &&
          (!testimonials || testimonials.length === 0) &&
          !isAdding && (
            <div className="text-center py-10">
              <MessageSquare className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500">Nenhum depoimento cadastrado</p>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
