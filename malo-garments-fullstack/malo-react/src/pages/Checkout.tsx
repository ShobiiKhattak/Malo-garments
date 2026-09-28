import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { placeOrder } from '../services/api'
import OrderButton, { ORDER_ANIM_MS, HORN_AT_MS } from '../components/checkout/OrderButton'
import { playTruckHorn } from '../utils/truckHorn'
import type { OrderButtonState } from '../components/checkout/OrderButton'
import { isOnlineMethod, onlineDiscount, ONLINE_DISCOUNT_PERCENT } from '../data/payments'
import { showToast } from '../components/ui/Toast'
import SmartImage from '../components/home/SmartImage'

const fmt = (n: number) => `Rs ${Number(n).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const FREE_SHIPPING = 5000
const SHIPPING_FEE = 250
const PAYMENT_OPTIONS = [
  { value: 'cod', label: 'Cash on Delivery', note: 'Pay when your order arrives.', icon: '💵' },
  { value: 'jazzcash', label: 'NayaPay', note: 'Pay via NayaPay wallet transfer.', icon: '📱' },
  { value: 'easypaisa', label: 'EasyPaisa', note: 'Pay via EasyPaisa wallet transfer.', icon: '📲' },
  { value: 'bank_transfer', label: 'Bank Transfer', note: 'Transfer to our bank account and share the receipt.', icon: '🏦' },
]

interface FieldProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
  half?: boolean
}

// Floating-label input. Outside the component so it does not remount on every render.
function Field({ label, name, type = 'text', value, onChange, error, required, half }: FieldProps) {
  return (
    <div className={`co-field ${error ? 'has-error' : ''} ${half ? 'half' : ''}`}>
      <input id={`co-${name}`} type={type} value={value} onChange={onChange} placeholder=" " autoComplete={name} />
      <label htmlFor={`co-${name}`}>{label}{required ? '' : ' (optional)'}</label>
      {error && <span className="co-error">{error}</span>}
    </div>
  )
}

interface CheckoutForm {
  name: string; email: string; phone: string
  address: string; city: string; state: string; zip: string; notes: string
}

export default function Checkout() {
  const { cart, cartTotal, clearCart, syncCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [obState, setObState] = useState<OrderButtonState>('idle')
  const [payment, setPayment] = useState('cod')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<CheckoutForm>({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    address: '', city: '', state: '', zip: '', notes: ''
  })

  // Re-check prices / stock against the admin catalogue before the customer pays.
  useEffect(() => { syncCart() }, [syncCart])

  const shipping = cartTotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE
  const discount = isOnlineMethod(payment) ? onlineDiscount(cartTotal) : 0
  const total = cartTotal - discount + shipping
  const count = cart.reduce((n, i) => n + i.quantity, 0)
  const set = (k: keyof CheckoutForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name) e.name = 'Enter your full name'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.phone) e.phone = 'Enter a phone number'
    if (!form.address) e.address = 'Enter your address'
    if (!form.city) e.city = 'Enter your city'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || cart.length === 0) return
    setLoading(true)
    setObState('driving')
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
    // Horn sounds the moment the loaded truck pulls away (started here, inside the click, so browsers allow it)
    const stopHorn = playTruckHorn(reduced ? 0 : HORN_AT_MS)
    try {
      // The order is placed while the truck drives; we move on once both are finished.
      const [result] = await Promise.all([
        placeOrder({ ...form, items: cart, subtotal: cartTotal, shipping, discount, total, paymentMethod: payment }),
        wait(reduced ? 0 : ORDER_ANIM_MS),
      ])
      setObState('done')
      await wait(reduced ? 400 : 1100)

      // The order exists now, so the cart is done either way.
      clearCart()
      // Online payment: go send the money and submit the transaction ID. COD: straight to the confirmation.
      navigate(isOnlineMethod(payment) ? `/payment?orderId=${result.id}` : `/order-confirmation?id=${result.id}`)
    } catch (err: any) {
      stopHorn()
      setObState('idle')
      showToast(err.response?.data?.error || 'Failed to place order. Please try again.', 'error')
      setLoading(false)
    }
  }

  if (cart.length === 0) return (
    <div style={{ paddingTop: 'var(--sp-4xl)', textAlign: 'center' }}>
      <div className="empty-state">
        <div className="empty-state-icon">🛍️</div>
        <h3>Your cart is empty</h3>
        <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
      </div>
    </div>
  )

  const summary = (
    <>
      <div className="co-items">
        {cart.map((item, i) => (
          <div key={i} className="co-item" style={{ ['--i' as string]: i }}>
            <div className="co-thumb">
              <SmartImage src={item.image} alt={item.name} tone={i} label=" " />
              <span className="co-qty">{item.quantity}</span>
            </div>
            <div className="co-item-info">
              <b>{item.name}</b>
              {(item.color || item.size) && <span>{[item.color, item.size].filter(Boolean).join(' / ')}</span>}
            </div>
            <span className="co-item-price">{fmt(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="co-totals">
        <div><span>Subtotal · {count} item{count > 1 ? 's' : ''}</span><span>{fmt(cartTotal)}</span></div>
        {discount > 0 && <div className="co-discount"><span>Online payment discount ({ONLINE_DISCOUNT_PERCENT}%)</span><span>− {fmt(discount)}</span></div>}
        <div><span>Shipping</span><span>{shipping === 0 ? 'Free' : fmt(shipping)}</span></div>
        <div className="co-total"><span>Total</span><span><small>PKR</small> <b key={total}>{fmt(total)}</b></span></div>
      </div>
    </>
  )

  return (
    <form onSubmit={handleSubmit} className="co">
      {/* Mobile: collapsible summary on top */}
      <div className="co-mobile-sum">
        <button type="button" onClick={() => setSummaryOpen(o => !o)} aria-expanded={summaryOpen}>
          <span>{summaryOpen ? 'Hide' : 'Show'} order summary <i className={summaryOpen ? 'open' : ''} /></span>
          <b>{fmt(total)}</b>
        </button>
        <div className={`co-mobile-body ${summaryOpen ? 'open' : ''}`}><div>{summary}</div></div>
      </div>

      <div className="co-left">
        <div className="co-left-inner">
          <nav className="co-crumbs"><Link to="/">Home</Link><span>/</span><Link to="/cart">Cart</Link><span>/</span><b>Checkout</b></nav>

          <section className="co-sec" style={{ ['--i' as string]: 0 }}>
            <div className="co-sec-head"><h2>Contact</h2>{!user && <Link to="/login">Sign in</Link>}</div>
            <Field label="Email" name="email" type="email" value={form.email} onChange={set('email')} error={errors.email} required />
            <Field label="Phone" name="tel" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} required />
          </section>

          <section className="co-sec" style={{ ['--i' as string]: 1 }}>
            <div className="co-sec-head"><h2>Delivery</h2></div>
            <div className="co-country"><small>Country/Region</small><span>Pakistan</span></div>
            <Field label="Full name" name="name" value={form.name} onChange={set('name')} error={errors.name} required />
            <Field label="Address" name="street-address" value={form.address} onChange={set('address')} error={errors.address} required />
            <div className="co-row">
              <Field label="City" name="address-level2" value={form.city} onChange={set('city')} error={errors.city} required half />
              <Field label="Postal code" name="postal-code" value={form.zip} onChange={set('zip')} half />
            </div>
            <Field label="State / Province" name="address-level1" value={form.state} onChange={set('state')} />
            <Field label="Order notes" name="notes" value={form.notes} onChange={set('notes')} />
          </section>

          <section className="co-sec" style={{ ['--i' as string]: 2 }}>
            <div className="co-sec-head"><h2>Payment</h2></div>
            <div className="co-pay">
              {PAYMENT_OPTIONS.map(({ value, label, note, icon }) => (
                <label key={value} className={`co-pay-opt ${payment === value ? 'on' : ''}`}>
                  <input type="radio" name="payment" checked={payment === value} onChange={() => setPayment(value)} />
                  <span className="co-pay-ico">{icon}</span>
                  <span><b>{label}</b><small>{note}</small></span>
                  {isOnlineMethod(value) && <em className="co-save">Save {ONLINE_DISCOUNT_PERCENT}%</em>}
                </label>
              ))}
              {isOnlineMethod(payment) && (
                <p className="co-pay-note">🎉 You save <b>{fmt(discount)}</b> ({ONLINE_DISCOUNT_PERCENT}% off) by paying online. After placing the order you will see where to send the money, then submit your transaction ID — we confirm it and you get a payment-received confirmation.</p>
              )}
            </div>
          </section>

          <OrderButton state={obState} label={payment === 'cod' ? 'Place order (Cash on Delivery)' : `Place order · Pay ${fmt(total)}`} />
          <p className="co-foot">Prices and stock are re-checked with the store when you place the order.</p>
        </div>
      </div>

      <aside className="co-right"><div className="co-right-inner">{summary}</div></aside>
    </form>
  )
}
