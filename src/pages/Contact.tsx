import { useCatalog } from '../context/Catalog'
import { useLang } from '../context/Lang'

export default function Contact() {
  const { t } = useLang()
  const { settings: s } = useCatalog()
  const tel = (s.phone ?? '').replace(/\s/g, '')

  return (
    <div className="mx-auto max-w-xl space-y-3">
      <h1 className="text-2xl font-bold">{t('contact')}</h1>
      {s.address && (
        <div className="card">
          <b>📍 {t('address')}</b>
          <p className="text-sm text-mute">{s.address}</p>
        </div>
      )}
      <div className="card text-sm">
        {s.phone && <div>📞 {s.phone}</div>}
        {s.email && <div>✉️ {s.email}</div>}
        {s.hours && (
          <div className="mt-1 text-mute">
            🕒 {t('hours')}: {s.hours}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {tel && (
          <a className="btn flex-1" href={`tel:${tel}`}>
            📞 {t('callNow')}
          </a>
        )}
        {s.whatsapp && (
          <a className="btn-o flex-1" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`}>
            💬 {t('whatsapp')}
          </a>
        )}
      </div>
    </div>
  )
}
