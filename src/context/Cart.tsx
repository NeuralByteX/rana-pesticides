import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './Auth'

interface CartCtx {
  /** pack id -> quantity */
  items: Record<number, number>
  count: number
  add: (packId: number, qty: number) => void
  setQty: (packId: number, qty: number) => void
  remove: (packId: number) => void
  clear: () => void
}

const Ctx = createContext<CartCtx>(null as unknown as CartCtx)
const STORE = 'rp_cart'

function read(): Record<number, number> {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) || '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth()
  const [items, setItems] = useState<Record<number, number>>(read)

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items])

  // empty the cart when the user logs out
  useEffect(() => {
    if (ready && !user) setItems({})
  }, [ready, user])

  const add = useCallback((id: number, qty: number) => {
    setItems((c) => ({ ...c, [id]: Math.min(10000, (c[id] ?? 0) + Math.max(1, Math.floor(qty))) }))
  }, [])
  const setQty = useCallback((id: number, qty: number) => {
    setItems((c) => ({ ...c, [id]: Math.min(10000, Math.max(1, Math.floor(qty) || 1)) }))
  }, [])
  const remove = useCallback((id: number) => {
    setItems((c) => {
      const n = { ...c }
      delete n[id]
      return n
    })
  }, [])
  const clear = useCallback(() => setItems({}), [])

  const value = useMemo(
    () => ({
      items,
      count: Object.values(items).reduce((a, b) => a + b, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useCart = () => useContext(Ctx)
