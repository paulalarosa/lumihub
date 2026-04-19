import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadContentImage } from './uploadContentImage'

interface ImageUrlInputProps {
  value: string
  onChange: (url: string) => void
  placeholder?: string
}

export function ImageUrlInput({ value, onChange, placeholder }: ImageUrlInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadContentImage(file)
      onChange(url)
      toast.success('Imagem enviada')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '/blog/image.png ou https://...'}
        className="rounded-none bg-white/[0.03] border-white/10 font-mono text-xs flex-1"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center w-10 h-10 border border-white/10 text-white/60 hover:border-white/30 hover:text-white transition-colors disabled:opacity-50"
        title="Fazer upload de imagem"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
      {value && (
        <div className="w-10 h-10 border border-white/10 bg-black overflow-hidden flex-shrink-0">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}
