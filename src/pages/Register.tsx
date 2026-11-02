import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/Lang'
import { GSTIN_RE } from '../lib/helpers'
import { supabase } from '../lib/supabase'

export default function Register() {
  const { t } = useLang()
  const nav = useNavigate()
  const [f, setF] = useState({ shop_name: '', owner_name: '', phone: '', city: '', gst_no: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    const gst = f.gst_no.trim().toUpperCase()
    if (!GSTIN_RE.test(gst)) {
      setErr(t('invalidGst'))
      return
    }
    setBusy(true)
    // The shop details travel as user metadata; a database trigger (database/02_signup_trigger.sql)
    // creates the pending wholesaler row, so this works even when email confirmation is on.
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        data: {
          shop_name: f.shop_name.trim(),
          owner_name: f.owner_name.trim(),
          phone: f.phone.trim(),
          city: f.city.trim(),
          gst_no: gst,
        },
      },
    })
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    if (data.session) nav('/dashboard', { replace: true })
    else setInfo(t('checkEmail'))
  }

  if (info) {
    return (
      <div className="mx-auto mt-6 max-w-sm space-y-3 text-center">
        <p className="rounded-xl bg-chip p-4 text-sm">{info}</p>
        <Link to="/login" className="btn">
          {t('login')}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-2 max-w-sm space-y-3">
      <h1 className="text-2xl font-bold">{t('registerTitle')}</h1>
      <p className="text-sm text-mute">{t('registerHelp')}</p>
      <div>
        <label className="label">{t('shopName')}</label>
        <input className="input" required value={f.shop_name} onChange={set('shop_name')} />
      </div>
      <div>
        <label className="label">{t('ownerName')}</label>
        <input className="input" required value={f.owner_name} onChange={set('owner_name')} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">{t('phone')}</label>
          <input className="input" required type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} />
        </div>
        <div>
          <label className="label">{t('city')}</label>
          <input className="input" value={f.city} onChange={set('city')} />
        </div>
      </div>
      <div>
        <label className="label">{t('gstin')}</label>
        <input className="input uppercase" required maxLength={15} value={f.gst_no} onChange={set('gst_no')} placeholder="22AAAAA0000A1Z5" />
      </div>
      <div>
        <label className="label">{t('email')}</label>
        <input className="input" required type="email" autoComplete="email" value={f.email} onChange={set('email')} />
      </div>
      <div>
        <label className="label">{t('password')}</label>
        <input className="input" required type="password" minLength={8} autoComplete="new-password" value={f.password} onChange={set('password')} />
      </div>
      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <button className="btn w-full" disabled={busy}>
        {busy ? t('loading') : t('register')}
      </button>
      <p className="text-center text-sm text-mute">
        {t('haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-brand">
          {t('login')}
        </Link>
      </p>
    </form>
  )
}
