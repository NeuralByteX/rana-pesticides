import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useCart } from '../context/Cart'
import { useCatalog } from '../context/Catalog'
import { useLang } from '../context/Lang'
import { dateStr, inr, wholesalePrice } from '../lib/helpers'
import { supabase } from '../lib/supabase'
import type { Order } from '../lib/types'

export default function Dashboard() {
  const { t, pick } = useLang()
  const { profile, canOrder, isAdmin } = useAuth()
  const { products } = useCatalog()
  const cart = useCart()
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('id,status,note,created_at,order_items(id,qty,unit_price,pack_sizes(label,products(name_en,name_hi)))')
      .order('created_at', { ascending: false })
    setOrders((data as unknown as Order[]) ?? [])
  }, [])

  useEffect(() => {
    if (canOrder) loadOrders()
  }, [canOrder, loadOrders])

  if (isAdmin) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <Link to="/admin" className="btn">
          {t('admin')}
        </Link>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card mx-auto max-w-md space-y-3 text-center">
        <p className="text-sm">{t('registerHelp')}</p>
        <Link to="/register" className="btn">
          {t('register')}
        </Link>
      </div>
    )
  }

  if (!canOrder) {
    return (
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="text-2xl font-bold">{profile.shop_name}</h1>
        <p className={`rounded-xl p-4 text-sm ${profile.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
          {profile.status === 'rejected' ? t('statusRejected') : t('statusPending')}
        </p>
      </div>
    )
  }

  // resolve cart lines from the catalogue (prices shown here are only a preview; the server prices the order)
  const lines = Object.entries(cart.items).flatMap(([id, qty]) => {
    const packId = Number(id)
    for (const p of products) {
      const pack = p.pack_sizes.find((k) => k.id === packId)
      if (pack) return [{ product: p, pack, qty, price: wholesalePrice(pack) ?? 0 }]
    }
    return []
  })
  const total = lines.reduce((a, l) => a + l.price * l.qty, 0)

  const place = async () => {
    setBusy(true)
    setMsg(null)
    const items = lines.map((l) => ({ pack_id: l.pack.id, qty: l.qty }))
    const { error } = await supabase.rpc('place_order', { items, note: note.trim() || null })
    setBusy(false)
    if (error) {
      setMsg({ ok: false, text: error.message })
      return
    }
    cart.clear()
    setNote('')
    setMsg({ ok: true, text: t('orderPlaced') })
    loadOrders()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <div className="eyebrow">{t('statusApproved').toUpperCase()}</div>
        <h1 className="text-2xl font-bold">{profile.shop_name}</h1>
      </div>

      {msg && <p className={`rounded-xl p-3 text-sm ${msg.ok ? 'bg-chip text-brand-dark' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <section className="card space-y-3">
        <h2 className="text-lg font-bold">{t('currentOrder')}</h2>
        {!lines.length ? (
          <p className="text-sm text-mute">
            {t('emptyCart')}{' '}
            <Link to="/products" className="font-semibold text-brand">
              {t('products')} →
            </Link>
          </p>
        ) : (
          <>
            {lines.map((l) => (
              <div key={l.pack.id} className="flex items-center gap-2 border-b border-line pb-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{pick(l.product.name_en, l.product.name_hi)}</div>
                  <div className="text-xs text-mute">
                    {l.pack.label} · {inr(l.price)}
                  </div>
                </div>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={l.qty}
                  onChange={(e) => cart.setQty(l.pack.id, Number(e.target.value))}
                  className="input !w-20"
                  aria-label="Quantity"
                />
                <b className="w-20 text-right text-sm">{inr(l.price * l.qty)}</b>
                <button className="btn-o btn-sm" onClick={() => cart.remove(l.pack.id)} aria-label={t('remove')}>
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <b>{t('total')}</b>
              <b className="text-lg">{inr(total)}</b>
            </div>
            <textarea className="input" rows={2} placeholder={t('note')} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn w-full" disabled={busy} onClick={place}>
              {busy ? t('loading') : t('placeOrder')}
            </button>
          </>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">{t('pastOrders')}</h2>
        {!orders.length && <p className="text-sm text-mute">{t('noOrders')}</p>}
        {orders.map((o) => (
          <div key={o.id} className="card text-sm">
            <div className="flex items-center justify-between">
              <b>#{o.id}</b>
              <span className="rounded-full bg-chip px-2 py-0.5 text-xs font-semibold capitalize">{o.status}</span>
            </div>
            <div className="text-xs text-mute">{dateStr(o.created_at)}</div>
            <ul className="mt-1 space-y-0.5">
              {o.order_items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span>
                    {pick(i.pack_sizes?.products?.name_en ?? '', i.pack_sizes?.products?.name_hi)} · {i.pack_sizes?.label} × {i.qty}
                  </span>
                  <span>{inr(i.unit_price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-1 text-right font-bold">{inr(o.order_items.reduce((a, i) => a + i.unit_price * i.qty, 0))}</div>
          </div>
        ))}
      </section>
    </div>
  )
}
