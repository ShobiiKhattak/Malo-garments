import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '../../services/api'
import { useCart } from '../../context/CartContext'
import SmartImage from '../home/SmartImage'
import type { Product } from '../../types'
import { ONLINE_DISCOUNT_PERCENT } from '../../data/payments'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`
const FREE_SHIPPING = 5000
const SHIPPING_FEE = 250

/** Slide-in mini cart (opens on every "add to cart"), with a "You may also like" side panel. */
export default function CartDrawer() {
  const { cart, cartOpen, closeCart, updateItem, removeItem, cartTotal, cartCount, addToCart } = useCart()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState<number | null>(null)
  const [upsellOpen, setUpsellOpen] = useState(true)

  const { data: catalogue = [] } = useQuery({ queryKey: ['products', {}], queryFn: () => getProducts(), enabled: cartOpen })
  const suggestions = useMemo(
    () => catalogue.filter(p => p.stock > 0 && !cart.some(c => c.productId === p.id)).slice(0, 5),
    [catalogue, cart],
  )

  // Esc closes, and the page behind must not scroll
  useEffect(() => {
    if (!cartOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [cartOpen, closeCart])

  const remove = (idx: number) => {
    setLeaving(idx)
    setTimeout(() => { removeItem(idx); setLeaving(null) }, 320)
  }

  const quickAdd = (p: Product) => addToCart({
    productId: p.id, name: p.name, image: p.images?.[0] || '', price: p.price, originalPrice: p.original_price, stock: p.stock,
    size: p.sizes?.[0] || '', color: p.colors?.[0]?.name || '', quantity: 1,
  })

  const goCheckout = () => { closeCart(); navigate('/checkout') }
  const pct = Math.min(100, (cartTotal / FREE_SHIPPING) * 100)
  const shipping = cartTotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE
  const showUpsell = suggestions.length > 0

  return (
    <>
      <div className={`cd-overlay ${cartOpen ? 'open' : ''}`} onClick={closeCart} />
      <div className={`cd ${cartOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Shopping cart" aria-hidden={!cartOpen}>

        {/* ── Side panel (desktop) ── */}
        {showUpsell && (
          <aside className={`cd-up ${upsellOpen ? '' : 'closed'}`}>
            <div className="cd-up-head">
              <h3>You may also like…</h3>
              <button onClick={() => setUpsellOpen(false)} aria-label="Hide suggestions">✕</button>
            </div>
            <div className="cd-up-list">
              {suggestions.map((p, i) => (
                <div key={p.id} className="cd-up-card" style={{ ['--i' as string]: i }}>
                  <Link to={`/product/${p.id}`} onClick={closeCart} className="cd-up-img"><SmartImage src={p.images?.[0]} alt={p.name} tone={i} label=" " /></Link>
                  <Link to={`/product/${p.id}`} onClick={closeCart} className="cd-up-name">{p.name}</Link>
                  <b>{fmt(p.price)}</b>
                  <button onClick={() => quickAdd(p)}>Add to Cart</button>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* ── Main cart ── */}
        <section className="cd-main">
          <header className="cd-head">
            <h2>Shopping Cart <span>({cartCount})</span></h2>
            <button onClick={closeCart} aria-label="Close cart">✕</button>
          </header>

          {cart.length === 0 ? (
            <div className="cd-empty">
              <div className="cd-empty-ico">🛍️</div>
              <h3>Your cart is empty</h3>
              <p>Looks like you have not added anything yet.</p>
              <Link to="/shop" className="btn btn-primary" onClick={closeCart}>Start Shopping</Link>
            </div>
          ) : (
            <>
              <div className="cd-items">
                {cart.map((item, i) => (
                  <div key={`${item.productId}-${item.name}-${item.size}-${item.color}`} className={`cd-item ${leaving === i ? 'leaving' : ''}`} style={{ ['--i' as string]: i }}>
                    <div className="cd-item-inner">
                      <div className="cd-item-img"><SmartImage src={item.image} alt={item.name} tone={i} label=" " /></div>
                      <div className="cd-item-info">
                        {item.productId
                          ? <Link to={`/product/${item.productId}`} onClick={closeCart} className="cd-item-name">{item.name}</Link>
                          : <span className="cd-item-name">{item.name}</span>}
                        {(item.color || item.size) && (
                          <p className="cd-item-var">{item.color && <>Color: {item.color}</>}{item.color && item.size && ' / '}{item.size && <>Size: {item.size}</>}</p>
                        )}
                        <p className="cd-item-price">
                          <b key={item.price}>{fmt(item.price)}</b>
                          {item.originalPrice && item.originalPrice > item.price && <s>{fmt(item.originalPrice)}</s>}
                        </p>
                        <div className="cd-item-row">
                          <div className="cd-qty">
                            <button aria-label="Decrease" onClick={() => item.quantity <= 1 ? remove(i) : updateItem(i, item.quantity - 1)}>−</button>
                            <span key={item.quantity}>{item.quantity}</span>
                            <button aria-label="Increase" disabled={!!item.stock && item.quantity >= item.stock} onClick={() => updateItem(i, item.quantity + 1)}>+</button>
                          </div>
                          <button className="cd-trash" aria-label={`Remove ${item.name}`} onClick={() => remove(i)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Suggestions on phones (the side panel is desktop-only) */}
                {showUpsell && (
                  <div className="cd-mob-up">
                    <h4>You may also like…</h4>
                    <div className="cd-mob-rail">
                      {suggestions.slice(0, 4).map((p, i) => (
                        <div key={p.id} className="cd-mob-card">
                          <div className="cd-up-img"><SmartImage src={p.images?.[0]} alt={p.name} tone={i} label=" " /></div>
                          <span>{p.name}</span><b>{fmt(p.price)}</b>
                          <button onClick={() => quickAdd(p)}>Add</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <footer className="cd-foot">
                <div className="cd-ship">
                  <p key={cartTotal >= FREE_SHIPPING ? 'y' : 'n'}>
                    {cartTotal >= FREE_SHIPPING
                      ? <>🎉 You have unlocked <b>Free Shipping</b>!</>
                      : <>You are only <b>{fmt(FREE_SHIPPING - cartTotal)}</b> away from <b>Free Shipping</b>!</>}
                  </p>
                  <div className="cd-bar"><span style={{ width: `${pct}%` }} /><i className={cartTotal >= FREE_SHIPPING ? 'hit' : ''} /></div>
                </div>
                <div className="cd-sub">
                  <span>Subtotal</span>
                  <b key={cartTotal}>{fmt(cartTotal)}</b>
                </div>
                <p className="cd-note">{shipping === 0 ? 'Free shipping applied.' : `Shipping ${fmt(SHIPPING_FEE)} — calculated at checkout.`}</p>
                <p className="cd-online">💳 Pay online at checkout and get <b>{ONLINE_DISCOUNT_PERCENT}% off</b></p>
                <button className="cd-checkout" onClick={goCheckout}>Checkout</button>
                <Link to="/cart" onClick={closeCart} className="cd-viewcart">View full cart</Link>
              </footer>
            </>
          )}
        </section>
      </div>
    </>
  )
}
