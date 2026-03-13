import React, { useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function ImageUploader({
  label,
  micrositeId,
  folder,
  onUpload,
}: {
  label: string
  micrositeId?: string
  folder: string
  onUpload: (url: string) => void
}) {
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('microsite-assets')
      .upload(path, file, { upsert: true })
    if (error) {
      toast.error('Erro no upload')
      return
    }

    const { data } = supabase.storage
      .from('microsite-assets')
      .getPublicUrl(path)
    onUpload(data.publicUrl)
    toast.success(`${label} atualizado!`)
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={!micrositeId}
        >
          <Upload className="w-4 h-4 mr-2" />
          {micrositeId ? `Upload ${label}` : 'Salve primeiro'}
        </Button>
      </div>
    </div>
  )
}
