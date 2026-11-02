import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { translate, type Key, type Lang } from '../lib/i18n'

interface LangCtx {
  lang: Lang
  chosen: boolean
  setLang: (l: Lang) => void
  t: (k: Key) => string
  pick: (en: string, hi?: string | null) => string
}

const Ctx = createContext<LangCtx>(null as unknown as LangCtx)
const STORE = 'rp_lang'

function readStored(): Lang | null {
  try {
    const v = localStorage.getItem(STORE)
    return v === 'en' || v === 'hi' ? v : null
  } catch {
    return null
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Lang | null>(readStored)
  const lang: Lang = stored ?? 'en'

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setStored(l)
    try {
      localStorage.setItem(STORE, l)
    } catch {
      /* storage unavailable: language just won't persist */
    }
  }, [])

  const value = useMemo<LangCtx>(
    () => ({
      lang,
      chosen: stored !== null,
      setLang,
      t: (k) => translate(lang, k),
      pick: (en, hi) => (lang === 'hi' && hi ? hi : en),
    }),
    [lang, stored, setLang],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)
