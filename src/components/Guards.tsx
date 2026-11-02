import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useLang } from '../context/Lang'

export function RequireUser({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth()
  const { t } = useLang()
  const loc = useLocation()
  if (!ready) return <p className="p-6 text-center text-mute">{t('loading')}</p>
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, ready } = useAuth()
  const { t } = useLang()
  if (!ready) return <p className="p-6 text-center text-mute">{t('loading')}</p>
  if (!user) return <Navigate to="/login" replace state={{ from: '/admin' }} />
  // the database enforces admin rights too; this only hides the screen
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
