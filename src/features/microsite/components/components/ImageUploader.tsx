import React, { useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface ImageUploaderProps {
  label: string
  micrositeId?: string
  folder: string
  currentUrl?: string | null
  onUpload: (url: string) => void
  onRemove?: () => void
}

const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function ImageUploader({
  label,
  micrositeId,
  folder,
  currentUrl,
  onUpload,
  onRemove,
}: ImageUploaderProps) {
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Use JPG, PNG, WEBP ou GIF')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Imagem muito grande. Máximo ${MAX_SIZE_MB}MB.`)
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'png'
      const path = `${user.id}/${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`

      const { error } = await supabase.storage
        .from('microsite-assets')
        .upload(path, file, {
          upsert: true,
          cacheControl: '31536000',
          contentType: file.type,
        })
      if (error) throw error

      const { data } = supabase.storage
        .from('microsite-assets')
        .getPublicUrl(path)

      onUpload(data.publicUrl)
      toast.success(`${label} atualizado`)
    } catch (err) {
      toast.error((err as Error).message || 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        {currentUrl && (
          <div className="relative w-20 h-20 border border-border flex-shrink-0 overflow-hidden bg-black/50">
            <img
              src={currentUrl}
              alt={label}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            {onRemove && (
              <button
                onClick={onRemove}
                disabled={uploading}
                aria-label={`Remover ${label}`}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 border border-white/20 flex items-center justify-center hover:bg-red-500/50 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 space-y-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={!micrositeId || uploading}
            className="w-full sm:w-auto"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {micrositeId
                  ? currentUrl
                    ? `Trocar ${label.toLowerCase()}`
                    : `Upload ${label.toLowerCase()}`
                  : 'Salve primeiro'}
              </>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            JPG, PNG, WEBP ou GIF · máx 5MB
          </p>
        </div>
      </div>
    </div>
  )
}
