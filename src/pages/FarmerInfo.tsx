import { Link } from 'react-router-dom'
import { useCatalog } from '../context/Catalog'
import { useLang } from '../context/Lang'

export default function FarmerInfo() {
  const { t } = useLang()
  const { settings } = useCatalog()
  const tel = (settings.phone ?? '').replace(/\s/g, '')
  const tips = ['safety1', 'safety2', 'safety3', 'safety4', 'safety5'] as const

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">{t('farmerInfoTitle')}</h1>

      <section className="card">
        <h2 className="mb-1 font-bold">{t('howToBuy')}</h2>
        <p className="text-sm">{t('howToBuyText')}</p>
        <div className="mt-3 flex gap-2">
          <Link to="/products" className="btn-o flex-1">
            {t('products')}
          </Link>
          {tel && (
            <a href={`tel:${tel}`} className="btn flex-1">
              📞 {t('callNow')}
            </a>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-2 font-bold">{t('safetyTitle')}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {tips.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
      </section>

      <p className="rounded-xl bg-chip p-3 text-sm">{t('farmerNote')}</p>
    </div>
  )
}
