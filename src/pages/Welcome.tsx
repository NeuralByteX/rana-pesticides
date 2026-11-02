import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../context/Lang'
import type { Lang } from '../lib/i18n'

export default function Welcome() {
  const { setLang, t } = useLang()
  const nav = useNavigate()
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from || '/'

  const choose = (l: Lang) => {
    setLang(l)
    nav(from, { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand to-brand-dark px-6 text-center text-white">
      <div className="text-5xl">🌾</div>
      <h1 className="mt-3 text-3xl font-extrabold">RANA PESTICIDES</h1>
      <p className="mt-1 text-lg">खेती की बेहतर उपज के लिए</p>
      <p className="text-sm opacity-90">Grow Better. Farm Smarter.</p>
      <p className="mt-10 text-sm font-semibold opacity-90">
        {t('chooseLang')} / Choose your language
      </p>
      <div className="mt-3 flex w-full max-w-xs flex-col gap-3">
        <button onClick={() => choose('hi')} className="rounded-xl bg-white py-3 text-lg font-bold text-brand">
          हिंदी
        </button>
        <button onClick={() => choose('en')} className="rounded-xl border-2 border-white py-3 text-lg font-bold">
          English
        </button>
      </div>
    </div>
  )
}
