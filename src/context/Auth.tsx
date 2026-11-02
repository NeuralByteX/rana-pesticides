import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Wholesaler } from '../lib/types'

interface AuthCtx {
  user: User | null
  profile: Wholesaler | null
  isAdmin: boolean
  /** true once the first session + role lookup has finished */
  ready: boolean
  /** approved wholesaler (or admin) => may see wholesale prices and order */
  canOrder: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Wholesaler | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [roleLoaded, setRoleLoaded] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setSessionLoaded(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // do not call supabase from inside this callback; just record the user
      setUser(session?.user ?? null)
      setSessionLoaded(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const loadRole = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null)
      setIsAdmin(false)
      setRoleLoaded(true)
      return
    }
    const [p, a] = await Promise.all([
      supabase.from('wholesalers').select('*').eq('id', u.id).maybeSingle(),
      supabase.rpc('is_admin'),
    ])
    setProfile((p.data as Wholesaler | null) ?? null)
    setIsAdmin(a.data === true)
    setRoleLoaded(true)
  }, [])

  const userId = user?.id
  useEffect(() => {
    if (!sessionLoaded) return
    setRoleLoaded(false)
    loadRole(user)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoaded, userId, loadRole])

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      profile,
      isAdmin,
      ready: sessionLoaded && roleLoaded,
      canOrder: isAdmin || profile?.status === 'approved',
      refreshProfile: () => loadRole(user),
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [user, profile, isAdmin, sessionLoaded, roleLoaded, loadRole],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
