import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useAuth } from '../context/Auth'
import { useCatalog } from '../context/Catalog'
import { useLang } from '../context/Lang'
import { CATEGORY_EMOJI } from '../lib/helpers'

export default function Home() {
  const { t, pick } = useLang()
  const { user } = useAuth()
  const { categories, products, loading, error } = useCatalog()

  return (
    <div>
      <div className="eyebrow">{t('shopByCategory').toUpperCase()}</div>
      <div className="flex gap-4 overflow-x-auto py-2">
        {categories.map((c) => (
          <Link key={c.id} to={`/products?cat=${c.id}`} className="min-w-[74px] text-center text-xs">
            <div className="mx-auto mb-1 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-chip text-3xl">
              {CATEGORY_EMOJI[c.name_en] ?? '🌿'}
            </div>
            {pick(c.name_en, c.name_hi)}
          </Link>
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-gradient-to-r from-brand to-lime-500 p-5 text-white">
        <h2 className="text-2xl font-bold leading-tight">{t('heroTitle')}</h2>
        <p className="mb-3 mt-1 text-sm">{t('heroSub')}</p>
        <Link to="/products" className="inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-brand">
          {t('shopNow')}
        </Link>
      </div>

      {!user && (
        <div className="card mt-3 flex items-center gap-3">
          <p className="flex-1 text-sm">{t('wholesalerCta')}</p>
          <Link to="/register" className="btn btn-sm">
            {t('register')}
          </Link>
        </div>
      )}

      {loading && <p className="mt-6 text-center text-mute">{t('loading')}</p>}
      {error && <p className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {categories.map((c) => {
        const items = products.filter((p) => p.category_id === c.id)
        if (!items.length) return null
        return (
          <section key={c.id}>
            <div className="mb-2 mt-6 flex items-center justify-between">
              <h2 className="border-l-4 border-brand pl-2 text-lg font-bold">{pick(c.name_en, c.name_hi)}</h2>
              <Link to={`/products?cat=${c.id}`} className="btn-o btn-sm">
                {t('viewAll')} →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {items.slice(0, 6).map((p) => (
                <div key={p.id} className="w-44 shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {!user && <p className="mt-6 rounded-xl bg-chip p-3 text-sm">{t('farmerNote')}</p>}
    </div>
  )
}
