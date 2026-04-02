import { supabase } from '@/integrations/supabase/client'
import { nanoid } from 'nanoid'

export async function uploadImageSafely(
  file: File,
  bucket: string,
  folder: string,
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${nanoid()}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

  return urlData.publicUrl
}

export async function deletePhotoSafely(
  photoUrl: string,
  bucket: string = 'avatars',
) {
  try {
    const urlParts = photoUrl.split('/')

    const bucketIndex = urlParts.indexOf(bucket)
    if (bucketIndex === -1) return

    const filePath = urlParts.slice(bucketIndex + 1).join('/')

    await supabase.storage.from(bucket).remove([filePath])
  } catch (error) {}
}
