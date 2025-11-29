import { supabase } from '../lib/supabase'

const BUCKET_NAME = 'bill-documents'

export const storageApi = {
  // Upload file to Supabase Storage
  async uploadFile(file, folder = 'receipts') {
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL - FIX: Add null check
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to generate public URL for uploaded file')
    }

    return {
      path: data.path,
      url: urlData.publicUrl
    }
  },

  // Delete file from storage
  async deleteFile(path) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) throw error
  },

  // Get file URL
  getFileUrl(path) {
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path)

    return publicUrl
  }
}
