import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useCart } from '../context/Cart'
import { useCatalog } from '../context/Catalog'
import { useLang } from '../context/Lang'
import { CATEGORY_EMOJI, inr, wholesalePrice } from '../lib/helpers'
import { imageUrl } from '../lib/supabase'
import type { Product } from '../lib/types'

export function ProductImage({ product, big = false }: { product: Product; big?: boolean }) {
  const { categories } = useCatalog()
  const url = imageUrl(product.image_path)
  const cat = categories.find((c) => c.id === product.category_id)
  const size = big ? 'h-56 text-8xl' : 'h-32 text-5xl'
  return (
    <div className={`flex ${size} items-center justify-center overflow-hidden rounded-xl bg-chip`}>
      {url ? (
        <img src={url} alt={product.name_en} className="h-full w-full object-contain" loading="lazy" />
      ) : (
        <span aria-hidden>{CATEGORY_EMOJI[cat?.name_en ?? ''] ?? '🌿'}</span>
      )}
    </div>
  )
}

export function PackPrice({ product, packId }: { product: Product; packId: number }) {
  const { t } = useLang()
  const { canOrder } = useAuth()
  const pack = product.pack_sizes.find((p) => p.id === packId)
  if (!pack) return null
  const w = canOrder ? wholesalePrice(pack) : null
  const price = w ?? pack.retail_price
  const off = pack.mrp > price ? Math.round(((pack.mrp - price) / pack.mrp) * 100) : 0
  return (
    <div>
      {w !== null && <div className="text-[10px] font-bold tracking-wide text-brand">{t('wholesaleRate')}</div>}
      <div className="flex flex-wrap items-baseline gap-2">
        <b className="text-lg">{inr(price)}</b>
        {pack.mrp > price && <s className="text-xs text-mute">{inr(pack.mrp)}</s>}
        {off > 0 && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{off}% OFF</span>}
      </div>
      <div className={`text-xs ${pack.in_stock ? 'text-brand' : 'text-red-600'}`}>
        ● {pack.in_stock ? t('inStock') : t('outOfStock')}
      </div>
    </div>
  )
}

export function BuyActions({ product, packId }: { product: Product; packId: number }) {
  const { t } = useLang()
  const { canOrder, isAdmin } = useAuth()
  const { settings } = useCatalog()
  const cart = useCart()
  const [qty, setQty] = useState(1)
  const pack = product.pack_sizes.find((p) => p.id === packId)
  if (!pack) return null

  if (canOrder && !isAdmin && wholesalePrice(pack) !== null) {
    return (
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          max={10000}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className="input !w-20"
          aria-label="Quantity"
        />
        <button className="btn flex-1" disabled={!pack.in_stock} onClick={() => cart.add(pack.id, qty)}>
          {t('add')}
        </button>
      </div>
    )
  }
  if (canOrder) return null // admin: nothing to buy
  const tel = (settings.phone ?? '').replace(/\s/g, '')
  return (
    <div className="flex gap-2">
      {tel && (
        <a className="btn-o flex-1" href={`tel:${tel}`}>
          📞 {t('callToBuy')}
        </a>
      )}
    </div>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  const { pick, t } = useLang()
  const { categories } = useCatalog()
  const [packId, setPackId] = useState(product.pack_sizes[0]?.id ?? 0)
  const cat = categories.find((c) => c.id === product.category_id)

  return (
    <div className="card flex flex-col gap-2">
      <Link to={`/products/${product.id}`}>
        <ProductImage product={product} />
      </Link>
      <div className="text-[11px] font-bold uppercase tracking-wide text-mute">
        {product.brand} {cat ? `· ${pick(cat.name_en, cat.name_hi)}` : ''}
      </div>
      <Link to={`/products/${product.id}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">
        {pick(product.name_en, product.name_hi)}
      </Link>
      {product.pack_sizes.length > 0 ? (
        <>
          <label className="text-[10px] font-bold text-mute">
            {t('packSize').toUpperCase()}
            <select className="input mt-0.5 !py-1.5" value={packId} onChange={(e) => setPackId(Number(e.target.value))}>
              {product.pack_sizes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <PackPrice product={product} packId={packId} />
          <BuyActions product={product} packId={packId} />
        </>
      ) : null}
    </div>
  )
}
