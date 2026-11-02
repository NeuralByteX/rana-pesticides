import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useAuth } from '../context/Auth'
import { useCatalog } from '../context/Catalog'
import { useLang } from '../context/Lang'
import { wholesalePrice } from '../lib/helpers'
import type { Product } from '../lib/types'

export default function Products() {
  const { t, pick } = useLang()
  const { canOrder } = useAuth()
  const { categories, products, loading, error } = useCatalog()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const cat = params.get('cat') ?? ''
  const sort = params.get('sort') ?? ''

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(params)
    if (v) n.set(k, v)
    else n.delete(k)
    setParams(n, { replace: true })
  }

  const list = useMemo(() => {
    const needle = q.toLowerCase()
    const price = (p: Product) => {
      const pk = p.pack_sizes[0]
      if (!pk) return 0
      return (canOrder ? wholesalePrice(pk) : null) ?? pk.retail_price
    }
    const a = products.filter(
      (p) =>
        (!cat || String(p.category_id) === cat) &&
        (!needle || `${p.name_en} ${p.name_hi ?? ''} ${p.brand ?? ''}`.toLowerCase().includes(needle)),
    )
    if (sort === 'lo') a.sort((x, y) => price(x) - price(y))
    if (sort === 'hi') a.sort((x, y) => price(y) - price(x))
    return a
  }, [products, q, cat, sort, canOrder])

  const current = categories.find((c) => String(c.id) === cat)
  const title = q ? `“${q}”` : current ? pick(current.name_en, current.name_hi) : t('allProducts')

  return (
    <div>
      <div className="eyebrow">{t('products').toUpperCase()}</div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mb-3 text-sm text-mute">{list.length} {t('products').toLowerCase()}</p>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <select className="input" value={cat} onChange={(e) => set('cat', e.target.value)}>
          <option value="">{t('allCategories')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {pick(c.name_en, c.name_hi)}
            </option>
          ))}
        </select>
        <select className="input" value={sort} onChange={(e) => set('sort', e.target.value)}>
          <option value="">{t('sort')}</option>
          <option value="lo">{t('priceLow')}</option>
          <option value="hi">{t('priceHigh')}</option>
        </select>
      </div>

      {loading && <p className="text-center text-mute">{t('loading')}</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !list.length && <p className="text-mute">{t('noProducts')}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
