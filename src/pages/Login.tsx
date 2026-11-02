import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useLang } from '../context/Lang'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { t } = useLang()
  const { user, isAdmin, ready } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (ready && user) nav(isAdmin ? '/admin' : from && from !== '/admin' ? from : '/dashboard', { replace: true })
  }, [ready, user, isAdmin, from, nav])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setErr(error.message)
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-4 max-w-sm space-y-3">
      <h1 className="text-2xl font-bold">{t('login')}</h1>
      <div>
        <label className="label">{t('email')}</label>
        <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label">{t('password')}</label>
        <input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <button className="btn w-full" disabled={busy}>
        {busy ? t('loading') : t('login')}
      </button>
      <p className="text-center text-sm text-mute">
        {t('noAccount')}{' '}
        <Link to="/register" className="font-semibold text-brand">
          {t('register')}
        </Link>
      </p>
    </form>
  )
}
