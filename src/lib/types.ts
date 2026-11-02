export interface Category {
  id: number
  name_en: string
  name_hi: string
  sort: number
}

export interface Pack {
  id: number
  product_id: number
  label: string
  mrp: number
  retail_price: number
  in_stock: boolean
  // Only present when the signed-in user is an approved wholesaler or admin (enforced by RLS)
  wholesale_prices?: { price: number } | { price: number }[] | null
}

export interface Product {
  id: number
  category_id: number | null
  brand: string | null
  name_en: string
  name_hi: string | null
  image_path: string | null
  active: boolean
  pack_sizes: Pack[]
}

export interface Wholesaler {
  id: string
  shop_name: string
  owner_name: string
  phone: string
  city: string | null
  gst_no: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface ShopSettings {
  address: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  hours: string | null
}

export type OrderStatus = 'new' | 'confirmed' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: number
  qty: number
  unit_price: number
  pack_sizes: { label: string; products: { name_en: string; name_hi: string | null } | null } | null
}

export interface Order {
  id: number
  status: OrderStatus
  note: string | null
  created_at: string
  wholesalers?: { shop_name: string; phone: string; city: string | null } | null
  order_items: OrderItem[]
}
