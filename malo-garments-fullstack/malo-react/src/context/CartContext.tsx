import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getProductById } from '../services/api'
import { showToast } from '../components/ui/Toast'
import type { CartItem, Product } from '../types'

interface CartContextValue {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  updateItem: (idx: number, qty: number) => void
  removeItem: (idx: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
  cartOpen: boolean
  openCart: () => void
  closeCart: () => void
  /** Re-check every cart line against the live catalogue (price, stock, availability). */
  syncCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

/** Apply the current catalogue to the cart. `null` in the map = product was deleted. */
function applyLive(items: CartItem[], live: Map<string, Product | null>) {
  const notes: string[] = []
  const out: CartItem[] = []
  for (const item of items) {
    const p = item.productId ? live.get(item.productId) : undefined
    if (!item.productId || p === undefined) { out.push(item); continue } // custom design, or network hiccup
    if (p === null) { notes.push(`${item.name} is no longer available and was removed.`); continue }
    if (p.stock <= 0) { notes.push(`${p.name} is sold out and was removed.`); continue }

    const next: CartItem = { ...item, name: p.name, image: p.images?.[0] || item.image, originalPrice: p.original_price, stock: p.stock }
    if (Number(p.price) !== Number(item.price)) {
      notes.push(`${p.name}: price is now Rs. ${Number(p.price).toLocaleString('en-PK')}.`)
      next.price = Number(p.price)
    }
    if (item.quantity > p.stock) {
      notes.push(`Only ${p.stock} of ${p.name} left — quantity adjusted.`)
      next.quantity = p.stock
    }
    out.push(next)
  }
  return { items: out, notes }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('malo_cart') || '[]') || [] }
    catch { return [] }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const cartRef = useRef(cart)
  cartRef.current = cart

  useEffect(() => {
    localStorage.setItem('malo_cart', JSON.stringify(cart))
  }, [cart])

  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])

  const syncCart = useCallback(async () => {
    const ids = [...new Set(cartRef.current.map(i => i.productId).filter((x): x is string => !!x))]
    if (!ids.length) return
    const live = new Map<string, Product | null>()
    await Promise.all(ids.map(async id => {
      try {
        live.set(id, await qc.fetchQuery({ queryKey: ['product', id], queryFn: () => getProductById(id), staleTime: 10_000 }))
      } catch (err: any) {
        if (err?.response?.status === 404) live.set(id, null) // deleted in admin
      }
    }))
    const { notes } = applyLive(cartRef.current, live)
    setCart(prev => applyLive(prev, live).items)
    notes.slice(0, 3).forEach(n => showToast(n, 'info'))
  }, [qc])

  // Keep the cart truthful: on load, whenever the drawer opens, and when the tab regains focus.
  useEffect(() => { syncCart() }, [syncCart, cartOpen])
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') syncCart() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [syncCart])

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c =>
        c.productId === item.productId && c.size === item.size && c.color === item.color && c.name === item.name
      )
      if (idx !== -1) {
        const updated = [...prev]
        const qty = updated[idx].quantity + (item.quantity || 1)
        updated[idx] = { ...updated[idx], ...item, quantity: item.stock ? Math.min(qty, item.stock) : qty }
        return updated
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }]
    })
    setCartOpen(true) // show the drawer right away, like a real store
  }

  const updateItem = (idx: number, qty: number) => {
    setCart(prev => {
      const updated = [...prev]
      if (qty <= 0) updated.splice(idx, 1)
      else updated[idx] = { ...updated[idx], quantity: updated[idx].stock ? Math.min(qty, updated[idx].stock as number) : qty }
      return updated
    })
  }

  const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx))
  const clearCart = () => setCart([])
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, updateItem, removeItem, clearCart, cartCount, cartTotal, cartOpen, openCart, closeCart, syncCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext) as CartContextValue
