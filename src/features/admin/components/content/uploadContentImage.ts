import { supabase } from '@/integrations/supabase/client'

const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function uploadContentImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Formato não suportado. Use JPG, PNG, WEBP ou GIF.')
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Imagem muito grande. Máximo ${MAX_SIZE_MB}MB.`)
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)
    ? extension
    : 'png'
  const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`

  const { error } = await supabase.storage
    .from('content-images')
    .upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(error.message || 'Falha no upload')
  }

  const { data } = supabase.storage.from('content-images').getPublicUrl(path)
  return data.publicUrl
}
