import React, { useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/Button'
import { Upload, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface ImageUploaderProps {
  label: string
  bucket: string
  folder: string
  onUpload: (url: string) => void
  currentUrl?: string
  onRemove?: () => void
  maxSizeBytes?: number
  accept?: string
  disabled?: boolean
}

export function ImageUploader({
  label,
  bucket,
  folder,
  onUpload,
  currentUrl,
  onRemove,
  maxSizeBytes = 5 * 1024 * 1024,
  accept = 'image/*',
  disabled = false,
}: ImageUploaderProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > maxSizeBytes) {
      toast({
        title: 'Arquivo grande demais',
        description: `Máximo permitido: ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${folder}/${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      onUpload(data.publicUrl)

      toast({ title: `${label} enviado!` })
    } catch (err: unknown) {
      toast({
        title: 'Erro no upload',
        description: err instanceof Error ? err.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {currentUrl && (
        <div className="relative group w-fit">
          <img
            src={currentUrl}
            alt={label}
            className="h-20 w-20 rounded object-cover border border-white/10"
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleUpload}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="gap-2"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? 'Enviando...' : `Upload ${label}`}
      </Button>
    </div>
  )
}
