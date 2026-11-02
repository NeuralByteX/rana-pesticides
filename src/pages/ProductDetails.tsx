import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BuyActions, PackPrice, ProductImage } from '../components/ProductCard'
import { useCatalog } from '../context/Catalog'
import { useLang } from '../context/Lang'

export default function ProductDetails() {
  const { id } = useParams()
  const { t, pick } = useLang()
  const { products, categories, loading } = useCatalog()
  const product = products.find((p) => String(p.id) === id)
  const [chosen, setChosen] = useState<number | null>(null)

  if (loading) return <p className="p-6 text-center text-mute">{t('loading')}</p>
  if (!product) {
    return (
      <div className="p-6 text-center">
        <p className="mb-3 text-mute">{t('noProducts')}</p>
        <Link to="/products" className="btn">
          {t('back')}
        </Link>
      </div>
    )
  }

  const packId = chosen ?? product.pack_sizes[0]?.id ?? 0
  const cat = categories.find((c) => c.id === product.category_id)

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/products" className="text-sm font-semibold text-brand">
        ← {t('back')}
      </Link>
      <div className="mt-2">
        <ProductImage product={product} big />
      </div>
      <div className="mt-3 text-xs font-bold uppercase tracking-wide text-mute">
        {product.brand} {cat ? `· ${pick(cat.name_en, cat.name_hi)}` : ''}
      </div>
      <h1 className="mt-1 text-2xl font-bold leading-snug">{pick(product.name_en, product.name_hi)}</h1>

      {product.pack_sizes.length > 0 && (
        <div className="card mt-4 space-y-3">
          <div>
            <div className="label">{t('packSize')}</div>
            <div className="flex flex-wrap gap-2">
              {product.pack_sizes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setChosen(p.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    p.id === packId ? 'border-brand bg-brand text-white' : 'border-line bg-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <PackPrice product={product} packId={packId} />
          <BuyActions product={product} packId={packId} />
        </div>
      )}
    </div>
  )
}
