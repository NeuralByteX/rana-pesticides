import type { Pack } from './types'

export function wholesalePrice(p: Pack): number | null {
  const w = p.wholesale_prices
  if (!w) return null
  if (Array.isArray(w)) return w.length ? Number(w[0].price) : null
  return Number(w.price)
}

export const inr = (n: number) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })

export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export const CATEGORY_EMOJI: Record<string, string> = {
  Fertilizers: '🧪',
  'Growth Boosters': '🌱',
  Fungicides: '🍄',
  'Crop Protection': '🛡️',
  Seeds: '🌾',
  'Farm Tools': '🧰',
}

export function dateStr(s: string) {
  return new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}
