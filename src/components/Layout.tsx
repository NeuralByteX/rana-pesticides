import { useState, type FormEvent } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useCart } from '../context/Cart'
import { useLang } from '../context/Lang'

export default function Layout() {
  const { t, lang, setLang, chosen } = useLang()
  const { user, isAdmin, canOrder, signOut } = useAuth()
  const cart = useCart()
  const nav = useNavigate()
  const loc = useLocation()
  const [q, setQ] = useState('')

  if (!chosen) return <Navigate to="/welcome" replace state={{ from: loc.pathname + loc.search }} />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    nav(`/products?q=${encodeURIComponent(q.trim())}`)
  }

  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-brand' : 'text-mute'}`

  const wholesaleTo = isAdmin ? '/admin' : user ? '/dashboard' : '/login'
  const wholesaleLabel = isAdmin ? t('admin') : user ? t('dashboard').split(' ')[0] : t('wholesale')

  return (
    <div className="mx-auto min-h-screen max-w-5xl pb-24">
      <header className="sticky top-0 z-20 bg-white px-3 pb-2 pt-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Link to="/" className="leading-none">
            <div className="text-xl font-extrabold text-brand">RANA PESTICIDES</div>
            <div className="text-[9px] font-semibold tracking-wide text-mute">{t('tagline')}</div>
          </Link>
          <div className="flex-1" />
          <button
            className="btn-o btn-sm"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            aria-label={t('language')}
          >
            {lang === 'en' ? 'हिंदी' : 'English'}
          </button>
          {canOrder && !isAdmin && (
            <Link to="/dashboard" className="btn btn-sm" aria-label="Cart">
              🛒 {cart.count}
            </Link>
          )}
          {user && (
            <button className="btn-o btn-sm" onClick={() => signOut().then(() => nav('/'))}>
              {t('logout')}
            </button>
          )}
        </div>
        <form onSubmit={submit} className="mt-2 flex items-center rounded-full bg-chip py-1 pl-4 pr-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button className="h-9 w-9 rounded-full bg-brand text-white" aria-label="Search">
            🔍
          </button>
        </form>
      </header>

      <main className="p-3">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-5xl">
          <NavLink to="/" end className={tab}>
            <span className="text-lg">🏠</span>
            {t('home')}
          </NavLink>
          <NavLink to="/products" className={tab}>
            <span className="text-lg">🧴</span>
            {t('products')}
          </NavLink>
          <NavLink to="/farmers" className={tab}>
            <span className="text-lg">🌾</span>
            {t('farmers')}
          </NavLink>
          <NavLink to="/contact" className={tab}>
            <span className="text-lg">📞</span>
            {t('contact')}
          </NavLink>
          <NavLink to={wholesaleTo} className={tab}>
            <span className="text-lg">🏪</span>
            {wholesaleLabel}
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
