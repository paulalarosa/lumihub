import { supabase } from '@/integrations/supabase/client'
import { nanoid } from 'nanoid'

/**
 * Uploads a file to Supabase Storage with a unique filename to prevent overwrites.
 *
 * @param file The file to upload.
 * @param bucket The Supabase Storage bucket name.
 * @param folder The folder path within the bucket.
 * @returns The public URL of the uploaded image.
 */
export async function uploadImageSafely(
  file: File,
  bucket: string,
  folder: string,
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${nanoid()}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  // 1. Upload PRIMEIRO
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  // 2. Pegar URL pública
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

  return urlData.publicUrl
}

/**
 * Attempts to delete a provided photo URL from its Supabase Storage bucket.
 * Extracts the file path from the public URL.
 *
 * @param photoUrl The public URL of the photo to delete.
 * @param bucket The bucket name (defaults to 'avatars' based on domain logic).
 */
export async function deletePhotoSafely(
  photoUrl: string,
  bucket: string = 'avatars',
) {
  try {
    // Extrair path da URL - assumes standard Supabase public URL structure
    // e.g. https://xyz.supabase.co/storage/v1/object/public/bucket/folder/filename.ext
    const urlParts = photoUrl.split('/')
    // The path is usually everything after the bucket name
    const bucketIndex = urlParts.indexOf(bucket)
    if (bucketIndex === -1) return

    const filePath = urlParts.slice(bucketIndex + 1).join('/')

    await supabase.storage.from(bucket).remove([filePath])
  } catch (error) {
    console.error('Failed to cleanup photo:', error)
  }
}
