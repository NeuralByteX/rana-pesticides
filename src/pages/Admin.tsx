import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useCatalog } from '../context/Catalog'
import { dateStr, inr, wholesalePrice } from '../lib/helpers'
import { supabase } from '../lib/supabase'
import type { Order, OrderStatus, Pack, Product, ShopSettings, Wholesaler } from '../lib/types'

type Tab = 'orders' | 'wholesalers' | 'products' | 'settings'

export default function Admin() {
  const [tab, setTab] = useState<Tab>('orders')
  const tabs: Tab[] = ['orders', 'wholesalers', 'products', 'settings']
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Admin</h1>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`${tab === k ? 'btn' : 'btn-o'} btn-sm capitalize`}>
            {k}
          </button>
        ))}
      </div>
      {tab === 'orders' && <Orders />}
      {tab === 'wholesalers' && <Wholesalers />}
      {tab === 'products' && <Products />}
      {tab === 'settings' && <Settings />}
    </div>
  )
}

/* ---------------- Orders ---------------- */
function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id,status,note,created_at,wholesalers(shop_name,phone,city),order_items(id,qty,unit_price,pack_sizes(label,products(name_en,name_hi)))')
      .order('created_at', { ascending: false })
    if (error) setErr(error.message)
    setOrders((data as unknown as Order[]) ?? [])
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (id: number, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) setErr(error.message)
    load()
  }

  return (
    <div className="space-y-3">
      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      {!orders.length && <p className="text-sm text-mute">No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="card text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b>
              #{o.id} · {o.wholesalers?.shop_name}
            </b>
            <select className="input !w-auto !py-1" value={o.status} onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}>
              {(['new', 'confirmed', 'delivered', 'cancelled'] as OrderStatus[]).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-mute">
            {dateStr(o.created_at)} · {o.wholesalers?.phone} {o.wholesalers?.city ? `· ${o.wholesalers.city}` : ''}
          </div>
          <ul className="mt-1 space-y-0.5">
            {o.order_items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span>
                  {i.pack_sizes?.products?.name_en} · {i.pack_sizes?.label} × {i.qty}
                </span>
                <span>{inr(i.unit_price * i.qty)}</span>
              </li>
            ))}
          </ul>
          {o.note && <p className="mt-1 text-xs italic text-mute">Note: {o.note}</p>}
          <div className="mt-1 text-right font-bold">{inr(o.order_items.reduce((a, i) => a + i.unit_price * i.qty, 0))}</div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- Wholesalers ---------------- */
function Wholesalers() {
  const [rows, setRows] = useState<Wholesaler[]>([])
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('wholesalers').select('*').order('created_at', { ascending: false })
    if (error) setErr(error.message)
    setRows((data as Wholesaler[]) ?? [])
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (id: string, status: Wholesaler['status']) => {
    const { error } = await supabase.from('wholesalers').update({ status }).eq('id', id)
    if (error) setErr(error.message)
    load()
  }

  return (
    <div className="space-y-3">
      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <p className="text-xs text-mute">Verify the GSTIN on the GST portal before approving.</p>
      {!rows.length && <p className="text-sm text-mute">No registrations yet.</p>}
      {rows.map((w) => (
        <div key={w.id} className="card text-sm">
          <div className="flex items-center justify-between gap-2">
            <b>{w.shop_name}</b>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                w.status === 'approved' ? 'bg-chip text-brand-dark' : w.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {w.status}
            </span>
          </div>
          <div className="text-xs text-mute">
            {w.owner_name} · {w.phone} {w.city ? `· ${w.city}` : ''}
          </div>
          <div className="mt-1 font-mono text-xs">GSTIN: {w.gst_no || '—'}</div>
          <div className="mt-2 flex gap-2">
            {w.status !== 'approved' && (
              <button className="btn btn-sm" onClick={() => setStatus(w.id, 'approved')}>
                Approve
              </button>
            )}
            {w.status !== 'rejected' && (
              <button className="btn-o btn-sm" onClick={() => setStatus(w.id, 'rejected')}>
                Reject
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- Products ---------------- */
function Products() {
  const { products, categories, reload } = useCatalog()
  const [err, setErr] = useState('')

  const fail = (e: { message: string } | null) => {
    if (e) setErr(e.message)
    return !!e
  }

  const toggleActive = async (p: Product) => {
    if (fail((await supabase.from('products').update({ active: !p.active }).eq('id', p.id)).error)) return
    reload()
  }

  const deleteProduct = async (p: Product) => {
    if (!confirm(`Delete "${p.name_en}"? Products already used in orders cannot be deleted — hide them instead.`)) return
    if (fail((await supabase.from('products').delete().eq('id', p.id)).error)) return
    reload()
  }

  const upload = async (p: Product, file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `${p.id}-${Date.now()}.${ext}`
    if (fail((await supabase.storage.from('product-images').upload(path, file, { upsert: true })).error)) return
    if (fail((await supabase.from('products').update({ image_path: path }).eq('id', p.id)).error)) return
    reload()
  }

  return (
    <div className="space-y-4">
      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <NewProduct onDone={reload} onError={setErr} />
      {products.map((p) => (
        <div key={p.id} className={`card space-y-2 ${p.active ? '' : 'opacity-60'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <b className="flex-1">
              {p.name_en} <span className="text-xs font-normal text-mute">{p.brand}</span>
            </b>
            <span className="text-xs text-mute">{categories.find((c) => c.id === p.category_id)?.name_en}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button className="btn-o btn-sm" onClick={() => toggleActive(p)}>
              {p.active ? 'Hide' : 'Show'}
            </button>
            <label className="btn-o btn-sm">
              Photo
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(p, e.target.files[0])} />
            </label>
            <button className="btn-o btn-sm !border-red-300 !text-red-600" onClick={() => deleteProduct(p)}>
              Delete
            </button>
          </div>
          {p.pack_sizes.map((k) => (
            <PackRow key={k.id} pack={k} onSaved={reload} onError={setErr} />
          ))}
          <NewPack productId={p.id} onDone={reload} onError={setErr} />
        </div>
      ))}
    </div>
  )
}

function PackRow({ pack, onSaved, onError }: { pack: Pack; onSaved: () => void; onError: (m: string) => void }) {
  const [f, setF] = useState({
    label: pack.label,
    mrp: String(pack.mrp),
    retail: String(pack.retail_price),
    wholesale: String(wholesalePrice(pack) ?? ''),
    in_stock: pack.in_stock,
  })

  const save = async () => {
    const u = await supabase
      .from('pack_sizes')
      .update({ label: f.label.trim(), mrp: Number(f.mrp), retail_price: Number(f.retail), in_stock: f.in_stock })
      .eq('id', pack.id)
    if (u.error) return onError(u.error.message)
    const w =
      f.wholesale.trim() === ''
        ? await supabase.from('wholesale_prices').delete().eq('pack_id', pack.id)
        : await supabase.from('wholesale_prices').upsert({ pack_id: pack.id, price: Number(f.wholesale) })
    if (w.error) return onError(w.error.message)
    onError('')
    onSaved()
  }

  const del = async () => {
    if (!confirm(`Delete pack ${pack.label}?`)) return
    const { error } = await supabase.from('pack_sizes').delete().eq('id', pack.id)
    if (error) return onError(error.message)
    onSaved()
  }

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-1.5 rounded-xl bg-page p-2 text-xs md:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto_auto]">
      <Field label="Pack" value={f.label} onChange={(v) => setF({ ...f, label: v })} text />
      <Field label="MRP" value={f.mrp} onChange={(v) => setF({ ...f, mrp: v })} />
      <Field label="Retail" value={f.retail} onChange={(v) => setF({ ...f, retail: v })} />
      <Field label="Wholesale" value={f.wholesale} onChange={(v) => setF({ ...f, wholesale: v })} />
      <label className="flex items-end gap-1 pb-2">
        <input type="checkbox" checked={f.in_stock} onChange={(e) => setF({ ...f, in_stock: e.target.checked })} /> Stock
      </label>
      <button className="btn btn-sm self-end" onClick={save}>
        Save
      </button>
      <button className="btn-o btn-sm self-end" onClick={del}>
        ✕
      </button>
    </div>
  )
}

function Field({ label, value, onChange, text = false }: { label: string; value: string; onChange: (v: string) => void; text?: boolean }) {
  return (
    <label className="block">
      <span className="label !mb-0.5 !text-[10px]">{label}</span>
      <input
        className="input !px-2 !py-1.5"
        type={text ? 'text' : 'number'}
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function NewPack({ productId, onDone, onError }: { productId: number; onDone: () => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ label: '', mrp: '', retail: '', wholesale: '' })

  const add = async (e: FormEvent) => {
    e.preventDefault()
    const { error } = await insertPack(productId, f)
    if (error) return onError(error)
    setF({ label: '', mrp: '', retail: '', wholesale: '' })
    setOpen(false)
    onDone()
  }

  if (!open)
    return (
      <button className="btn-o btn-sm" onClick={() => setOpen(true)}>
        + Add pack size
      </button>
    )
  return (
    <form onSubmit={add} className="grid grid-cols-4 gap-1.5 rounded-xl bg-page p-2 text-xs">
      <Field label="Pack" text value={f.label} onChange={(v) => setF({ ...f, label: v })} />
      <Field label="MRP" value={f.mrp} onChange={(v) => setF({ ...f, mrp: v })} />
      <Field label="Retail" value={f.retail} onChange={(v) => setF({ ...f, retail: v })} />
      <Field label="Wholesale" value={f.wholesale} onChange={(v) => setF({ ...f, wholesale: v })} />
      <button className="btn btn-sm col-span-4">Add</button>
    </form>
  )
}

async function insertPack(productId: number, f: { label: string; mrp: string; retail: string; wholesale: string }) {
  if (!f.label.trim() || f.mrp === '' || f.retail === '') return { error: 'Pack label, MRP and retail price are required.' }
  const { data, error } = await supabase
    .from('pack_sizes')
    .insert({ product_id: productId, label: f.label.trim(), mrp: Number(f.mrp), retail_price: Number(f.retail) })
    .select('id')
    .single()
  if (error) return { error: error.message }
  if (f.wholesale !== '') {
    const w = await supabase.from('wholesale_prices').insert({ pack_id: data.id, price: Number(f.wholesale) })
    if (w.error) return { error: w.error.message }
  }
  return { error: '' }
}

function NewProduct({ onDone, onError }: { onDone: () => void; onError: (m: string) => void }) {
  const { categories } = useCatalog()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ category_id: '', brand: '', name_en: '', name_hi: '', label: '', mrp: '', retail: '', wholesale: '' })

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!f.name_en.trim()) return onError('Product name (English) is required.')
    const { data, error } = await supabase
      .from('products')
      .insert({
        category_id: f.category_id ? Number(f.category_id) : null,
        brand: f.brand.trim() || null,
        name_en: f.name_en.trim(),
        name_hi: f.name_hi.trim() || null,
      })
      .select('id')
      .single()
    if (error) return onError(error.message)
    const p = await insertPack(data.id, f)
    if (p.error) return onError(p.error)
    onError('')
    setF({ category_id: '', brand: '', name_en: '', name_hi: '', label: '', mrp: '', retail: '', wholesale: '' })
    setOpen(false)
    onDone()
  }

  if (!open)
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        + Add product
      </button>
    )

  return (
    <form onSubmit={add} className="card space-y-2">
      <b>New product</b>
      <select className="input" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
        <option value="">Category…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name_en}
          </option>
        ))}
      </select>
      <input className="input" placeholder="Brand" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} />
      <input className="input" placeholder="Name (English)" required value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} />
      <input className="input" placeholder="नाम (हिंदी)" value={f.name_hi} onChange={(e) => setF({ ...f, name_hi: e.target.value })} />
      <div className="grid grid-cols-4 gap-1.5 text-xs">
        <Field label="Pack" text value={f.label} onChange={(v) => setF({ ...f, label: v })} />
        <Field label="MRP" value={f.mrp} onChange={(v) => setF({ ...f, mrp: v })} />
        <Field label="Retail" value={f.retail} onChange={(v) => setF({ ...f, retail: v })} />
        <Field label="Wholesale" value={f.wholesale} onChange={(v) => setF({ ...f, wholesale: v })} />
      </div>
      <div className="flex gap-2">
        <button className="btn flex-1">Save</button>
        <button type="button" className="btn-o" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}

/* ---------------- Settings ---------------- */
function Settings() {
  const { settings, reload } = useCatalog()
  const [f, setF] = useState<ShopSettings>(settings)
  const [msg, setMsg] = useState('')
  const keys: (keyof ShopSettings)[] = ['address', 'phone', 'whatsapp', 'email', 'hours']

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('shop_settings').upsert({ id: 1, ...f })
    setMsg(error ? error.message : 'Saved')
    if (!error) reload()
  }

  return (
    <form onSubmit={save} className="card max-w-md space-y-2">
      {keys.map((k) => (
        <div key={k}>
          <label className="label capitalize">{k === 'whatsapp' ? 'WhatsApp (country code + number, digits only)' : k}</label>
          <input className="input" value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        </div>
      ))}
      <button className="btn w-full">Save</button>
      {msg && <p className="text-sm text-mute">{msg}</p>}
    </form>
  )
}
