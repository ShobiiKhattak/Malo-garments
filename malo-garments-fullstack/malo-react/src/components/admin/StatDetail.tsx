import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCustomers, getProducts } from '../../services/api'
import type { AdminStats, Order } from '../../types'
import '../../styles/admin-detail.css'

export type StatKind = 'revenue' | 'orders' | 'products' | 'customers'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`
const METHODS: Record<string, string> = { cod: 'Cash on Delivery', jazzcash: 'NayaPay', easypaisa: 'EasyPaisa', bank_transfer: 'Bank Transfer' }
const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const TITLES: Record<StatKind, string> = { revenue: '💰 Revenue details', orders: '📦 Orders overview', products: '👗 Products overview', customers: '👥 Customers' }

const dateOf = (o: Order) => new Date(o.created_at || o.createdAt || '').getTime()
const methodOf = (o: Order) => o.payment_method || o.paymentMethod || 'cod'

function Bar({ value, max, color = 'var(--rose)' }: { value: number; max: number; color?: string }) {
  return <span className="sd-bar"><i style={{ width: `${max ? Math.max(3, (value / max) * 100) : 0}%`, background: color }} /></span>
}

/** Pop-up with the full story behind a dashboard number. Click a row to jump to it. */
export default function StatDetail({ kind, orders, stats, onClose }: { kind: StatKind; orders: Order[]; stats?: AdminStats; onClose: () => void }) {
  const navigate = useNavigate()
  const go = (path: string) => { onClose(); navigate(path) }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { data: products = [] } = useQuery({ queryKey: ['products', {}], queryFn: () => getProducts(), enabled: kind === 'products' })
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: getCustomers, enabled: kind === 'customers' })

  const sorted = [...orders].sort((a, b) => dateOf(b) - dateOf(a))
  const orderRow = (o: Order) => (
    <button key={o.id} className="sd-row" onClick={() => go(`/admin/orders?open=${encodeURIComponent(o.id)}`)}>
      <span className="sd-main"><b>{o.id}</b><small>{o.customer?.name || o.customer_name} · {new Date(dateOf(o)).toLocaleDateString()}</small></span>
      <span className={`admin-badge ${o.status}`}>{o.status}</span>
      <b className="sd-amt">{fmt(o.total)}</b>
    </button>
  )

  let body: React.ReactNode = null
  let openLabel = ''
  let openPath = ''

  if (kind === 'revenue') {
    const live = orders.filter(o => o.status !== 'Cancelled')
    const total = live.reduce((n, o) => n + Number(o.total), 0)
    const delivered = live.filter(o => o.status === 'Delivered').reduce((n, o) => n + Number(o.total), 0)
    const cancelled = orders.filter(o => o.status === 'Cancelled').reduce((n, o) => n + Number(o.total), 0)
    const discounts = live.reduce((n, o) => n + Number(o.discount || 0), 0)
    const byMethod = Object.entries(live.reduce<Record<string, { sum: number; n: number }>>((acc, o) => {
      const m = methodOf(o); acc[m] = acc[m] || { sum: 0, n: 0 }; acc[m].sum += Number(o.total); acc[m].n += 1; return acc
    }, {})).sort((a, b) => b[1].sum - a[1].sum)
    const months = stats?.monthlyRevenue || []
    const maxMonth = Math.max(0, ...months.map(m => m.revenue))
    openLabel = 'Open all orders'; openPath = '/admin/orders'
    body = (
      <>
        <div className="sd-kpis">
          <div><small>Total revenue</small><b>{fmt(total)}</b></div>
          <div><small>Delivered</small><b className="ok">{fmt(delivered)}</b></div>
          <div><small>In progress</small><b>{fmt(total - delivered)}</b></div>
          <div><small>Average order</small><b>{fmt(live.length ? Math.round(total / live.length) : 0)}</b></div>
        </div>
        <p className="sd-note">Cancelled orders ({fmt(cancelled)}) are not counted{discounts > 0 ? ` · ${fmt(discounts)} given as online-payment discounts` : ''}.</p>

        <h4>By payment method</h4>
        {byMethod.length === 0 ? <p className="sd-empty">No revenue yet.</p> : byMethod.map(([m, v]) => (
          <div key={m} className="sd-line"><span>{METHODS[m] || m} <small>({v.n} order{v.n > 1 ? 's' : ''})</small></span><Bar value={v.sum} max={total} /><b>{fmt(v.sum)}</b></div>
        ))}

        <h4>Last 6 months</h4>
        {months.map(m => <div key={m.label} className="sd-line"><span>{m.label}</span><Bar value={m.revenue} max={maxMonth} color="var(--gold)" /><b>{fmt(m.revenue)}</b></div>)}

        <h4>Latest orders that count as revenue</h4>
        {live.length === 0 ? <p className="sd-empty">No orders yet.</p> : sorted.filter(o => o.status !== 'Cancelled').slice(0, 6).map(orderRow)}
      </>
    )
  }

  if (kind === 'orders') {
    const counts = STATUSES.map(s => ({ s, n: orders.filter(o => o.status === s).length }))
    const toVerify = orders.filter(o => o.payment_status === 'submitted').length
    openLabel = 'Open all orders'; openPath = '/admin/orders'
    body = (
      <>
        <div className="sd-kpis five">
          {counts.map(c => <div key={c.s}><small>{c.s}</small><b>{c.n}</b></div>)}
        </div>
        {toVerify > 0 && <button className="pay-alert" onClick={() => go('/admin/orders')}><span className="pay-alert-dot" /><b>{toVerify}</b> payment{toVerify > 1 ? 's' : ''} waiting for your confirmation</button>}
        <h4>Latest orders</h4>
        {sorted.length === 0 ? <p className="sd-empty">No orders yet.</p> : sorted.slice(0, 8).map(orderRow)}
      </>
    )
  }

  if (kind === 'products') {
    const out = products.filter(p => p.stock <= 0)
    const low = products.filter(p => p.stock > 0 && p.stock <= 5)
    const cats = stats?.productsByCategory || []
    const maxCat = Math.max(0, ...cats.map(c => c.count))
    openLabel = 'Manage products'; openPath = '/admin/products'
    body = (
      <>
        <div className="sd-kpis">
          <div><small>Total products</small><b>{stats?.totalProducts ?? products.length}</b></div>
          <div><small>In stock</small><b className="ok">{products.length - out.length - low.length}</b></div>
          <div><small>Low stock (≤5)</small><b className="warn">{low.length}</b></div>
          <div><small>Out of stock</small><b className="bad">{out.length}</b></div>
        </div>

        <h4>All categories</h4>
        {cats.map(c => <div key={c.name} className={`sd-line ${c.count === 0 ? 'dim' : ''}`}><span>{c.name}</span><Bar value={c.count} max={maxCat} /><b>{c.count}</b></div>)}

        <h4>Needs restocking</h4>
        {out.length + low.length === 0 ? <p className="sd-empty">Everything is well stocked. 🎉</p> : [...out, ...low].slice(0, 8).map(p => (
          <button key={p.id} className="sd-row" onClick={() => go('/admin/products')}>
            <span className="sd-main"><b>{p.name}</b><small>{fmt(p.price)}</small></span>
            <span className={`admin-badge ${p.stock <= 0 ? 'out-of-stock' : 'low-stock'}`}>{p.stock <= 0 ? 'Out of stock' : `${p.stock} left`}</span>
          </button>
        ))}
      </>
    )
  }

  if (kind === 'customers') {
    const list = [...customers].sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0))
    const guestOrders = orders.filter(o => !customers.some(c => c.email && c.email === (o.customer?.email || o.customer_email))).length
    openLabel = 'Open customers page'; openPath = '/admin/customers'
    body = (
      <>
        <div className="sd-kpis three">
          <div><small>Registered customers</small><b>{stats?.totalCustomers ?? customers.length}</b></div>
          <div><small>Total orders</small><b>{orders.length}</b></div>
          <div><small>Guest orders</small><b>{guestOrders}</b></div>
        </div>
        <p className="sd-note">Customers are people with an account. Orders placed without signing in (guests) are not counted as customers.</p>
        <h4>Top customers</h4>
        {list.length === 0 ? <p className="sd-empty">No registered customers yet.</p> : list.slice(0, 10).map(c => (
          <button key={c.id} className="sd-row" onClick={() => go('/admin/customers')}>
            <span className="sd-main"><b>{c.name}</b><small>{c.email}{c.phone ? ` · ${c.phone}` : ''}</small></span>
            <span className="sd-orders">{c.orderCount || 0} order{(c.orderCount || 0) === 1 ? '' : 's'}</span>
            <b className="sd-amt">{fmt(c.totalSpent || 0)}</b>
          </button>
        ))}
      </>
    )
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={TITLES[kind]}>
      <div className="admin-modal sd" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header"><h3>{TITLES[kind]}</h3><button className="admin-modal-close" onClick={onClose} aria-label="Close">✕</button></div>
        {body}
        <button className="btn btn-primary btn-block sd-open" onClick={() => go(openPath)}>{openLabel} →</button>
      </div>
    </div>
  )
}
