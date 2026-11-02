import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Category, Product, ShopSettings } from '../lib/types'
import { useAuth } from './Auth'

interface CatalogCtx {
  categories: Category[]
  products: Product[]
  settings: ShopSettings
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const FALLBACK_SETTINGS: ShopSettings = {
  address: '',
  phone: '',
  whatsapp: '',
  email: '',
  hours: '',
}

const Ctx = createContext<CatalogCtx>(null as unknown as CatalogCtx)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { user, ready, isAdmin } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<ShopSettings>(FALLBACK_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [c, p, s] = await Promise.all([
      supabase.from('categories').select('*').order('sort'),
      // wholesale_prices is empty for anyone who is not an approved wholesaler / admin (row-level security)
      supabase
        .from('products')
        .select('*, pack_sizes(*, wholesale_prices(price))')
        .order('id')
        .order('id', { referencedTable: 'pack_sizes' }),
      supabase.from('shop_settings').select('*').eq('id', 1).maybeSingle(),
    ])
    const err = c.error || p.error
    if (err) setError(err.message)
    else setError(null)
    setCategories((c.data as Category[]) ?? [])
    setProducts((p.data as Product[]) ?? [])
    if (s.data) setSettings(s.data as ShopSettings)
    setLoading(false)
  }, [])

  // reload whenever the signed-in user / role changes so wholesale prices appear or disappear
  const uid = user?.id
  useEffect(() => {
    if (!ready) return
    reload()
  }, [ready, uid, isAdmin, reload])

  const value = useMemo(
    () => ({ categories, products, settings, loading, error, reload }),
    [categories, products, settings, loading, error, reload],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useCatalog = () => useContext(Ctx)
