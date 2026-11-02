import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (see .env.example)')
}

export const supabase = createClient(url, key)

export function imageUrl(path?: string | null) {
  if (!path) return null
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}
