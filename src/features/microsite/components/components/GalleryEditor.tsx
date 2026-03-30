import React, { useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner as CardLoader } from '@/components/ui/PageLoader'

import { Upload, Trash2, Image } from 'lucide-react'
import { toast } from 'sonner'

export interface GalleryRecord {
  id: string
  image_url: string
  caption: string | null
  category: string | null
  is_featured: boolean
  display_order: number
}

export function GalleryEditor({ micrositeId }: { micrositeId?: string }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: gallery, isLoading } = useQuery({
    queryKey: ['microsite-gallery', micrositeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('microsite_gallery' as never)
        .select('*')
        .eq('microsite_id', micrositeId!)
        .order('display_order')
      if (error) throw error
      return data || []
    },
    enabled: !!micrositeId,
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop()
      const path = `${user!.id}/gallery/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('microsite-assets')
        .upload(path, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('microsite-assets')
        .getPublicUrl(path)

      try {
        const { error } = await supabase
          .from('microsite_gallery' as never)
          .insert({
            microsite_id: micrositeId,
            image_url: urlData.publicUrl,
            display_order: (gallery?.length || 0) + 1,
          } as never)

        if (error) throw error
      } catch (dbError) {
        // CLEANUP: Delete file from storage if DB insertion fails
        await supabase.storage.from('microsite-assets').remove([path])
        throw dbError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-gallery'] })
      toast.success('Imagem adicionada!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('microsite_gallery' as never)
        .delete()
        .eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-gallery'] })
      toast.success('Imagem removida!')
    },
  })

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => uploadMutation.mutate(file))
    e.target.value = ''
  }

  if (!micrositeId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-neutral-400">
            Salve o microsite primeiro para adicionar fotos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Galeria de Fotos</CardTitle>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            <Button
              onClick={() => inputRef.current?.click()}
              size="sm"
              disabled={uploadMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-1" />
              {uploadMutation.isPending ? 'Enviando...' : 'Upload'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <CardLoader />}

        {gallery && gallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={item.image_url}
                  alt={item.caption || ''}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : !isLoading ? (
          <div className="text-center py-10">
            <Image className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500">Nenhuma foto na galeria</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
