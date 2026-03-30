import { supabase } from '@/integrations/supabase/client'

interface TransformationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'origin'
}

export const getOptimizedStorageUrl = (
  bucket: string,
  path: string,
  options: TransformationOptions = {
    width: 1200,
    quality: 80,
    format: 'webp',
  },
) => {
  if (!path) return ''

  // If it's already a full URL, return as is
  if (path.startsWith('http')) return path

  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: {
      width: options.width,
      height: options.height,
      quality: options.quality,
      format: options.format,
    },
  })

  return data.publicUrl
}
