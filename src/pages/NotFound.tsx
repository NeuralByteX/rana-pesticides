import { Link } from 'react-router-dom'
import { useLang } from '../context/Lang'

export default function NotFound() {
  const { t } = useLang()
  return (
    <div className="p-10 text-center">
      <p className="mb-4 text-lg font-semibold">{t('notFound')}</p>
      <Link to="/" className="btn">
        {t('home')}
      </Link>
    </div>
  )
}
