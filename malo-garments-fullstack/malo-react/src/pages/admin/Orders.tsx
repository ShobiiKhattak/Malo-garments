import { useEffect, useState } from 'react'
import SupplierPanel from '../../components/admin/SupplierPanel'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllOrders, updateOrderStatus, decideOnlinePayment } from '../../services/api'
import { showToast } from '../../components/ui/Toast'
import type { Order } from '../../types'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`
const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const METHODS: Record<string, string> = { cod: 'COD', jazzcash: 'NayaPay', easypaisa: 'EasyPaisa', bank_transfer: 'Bank Transfer' }
const PAY_LABEL: Record<string, string> = { awaiting: 'Awaiting payment', submitted: 'Verify payment', confirmed: 'Paid ✓', rejected: 'Not found' }

const methodOf = (o: Order) => o.payment_method || o.paymentMethod || 'cod'

function PayBadge({ o }: { o: Order }) {
  const s = o.payment_status || 'not_required'
  if (s === 'not_required') return <span className="pay-badge cod">{METHODS[methodOf(o)] || 'COD'}</span>
  return (
    <span className="pay-cell">
      <span className="pay-method">{METHODS[methodOf(o)]}</span>
      <span className={`pay-badge ${s}`}>{PAY_LABEL[s] || s}</span>
    </span>
  )
}

export default function Orders() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState<Order | null>(null)
  const [params, setParams] = useSearchParams()
  const qc = useQueryClient()

  const { data: orders = [] } = useQuery({ queryKey: ['allOrders'], queryFn: getAllOrders, refetchInterval: 20000 })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => { showToast('Order status updated.', 'success'); qc.invalidateQueries({ queryKey: ['allOrders'] }) }
  })

  const payMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'confirm' | 'reject' }) => decideOnlinePayment(id, action),
    onSuccess: (_d, v) => {
      showToast(v.action === 'confirm' ? 'Payment confirmed — the customer has been notified.' : 'Payment marked as not found — the customer can resubmit.', v.action === 'confirm' ? 'success' : 'info')
      qc.invalidateQueries({ queryKey: ['allOrders'] })
      setModal(null)
    },
    onError: (e: any) => showToast(e.response?.data?.error || 'Could not update the payment.', 'error'),
  })

  // Link from the "verify payment" email: /admin/orders?verify=ORD-123456 opens that order straight away
  const verifyId = params.get('verify') || params.get('open')
  useEffect(() => {
    if (!verifyId || !orders.length) return
    const o = orders.find(x => x.id === verifyId)
    if (o) { setModal(o); setParams({}, { replace: true }) }
  }, [verifyId, orders, setParams])

  // keep the open modal in sync with fresh data (e.g. after a status change)
  const openOrder = modal ? orders.find(o => o.id === modal.id) || modal : null

  const toVerify = orders.filter(o => o.payment_status === 'submitted').length

  const filtered = orders.filter(o => {
    const name = o.customer?.name || o.customer_name || ''
    const matchQ = !search || o.id.toLowerCase().includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase())
    const matchS = !statusFilter || (statusFilter === 'verify' ? o.payment_status === 'submitted' : o.status === statusFilter)
    return matchQ && matchS
  }).sort((a, b) => new Date(b.created_at || b.createdAt || '').getTime() - new Date(a.created_at || a.createdAt || '').getTime())

  return (
    <>
      {openOrder && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header"><h3>Order {openOrder.id}</h3><button className="admin-modal-close" onClick={() => setModal(null)}>✕</button></div>

            {/* ── Online payment: verify it here ── */}
            {(openOrder.payment_status && openOrder.payment_status !== 'not_required') && (
              <div className={`pay-verify ${openOrder.payment_status}`}>
                <div className="pay-verify-head">
                  <b>{METHODS[methodOf(openOrder)]} payment</b>
                  <span className={`pay-badge ${openOrder.payment_status}`}>{PAY_LABEL[openOrder.payment_status] || openOrder.payment_status}</span>
                </div>
                <div className="pay-verify-rows">
                  <div><span>Amount to look for</span><b>{fmt(openOrder.total)}</b></div>
                  {!!openOrder.discount && openOrder.discount > 0 && <div><span>Online discount given</span><b>− {fmt(openOrder.discount)}</b></div>}
                  <div><span>Transaction ID</span><b className="mono">{openOrder.payment_ref || 'not submitted yet'}</b></div>
                  {openOrder.payment_submitted_at && <div><span>Submitted</span><b>{new Date(openOrder.payment_submitted_at).toLocaleString('en-PK')}</b></div>}
                  {openOrder.payment_confirmed_at && <div><span>Confirmed</span><b>{new Date(openOrder.payment_confirmed_at).toLocaleString('en-PK')}</b></div>}
                </div>
                {openOrder.payment_status === 'submitted' && (
                  <>
                    <p className="pay-verify-hint">Check your {METHODS[methodOf(openOrder)]} account. If the money has arrived, confirm — the customer instantly sees a “Payment received” card and gets an email.</p>
                    <div className="pay-verify-actions">
                      <button className="btn btn-primary" disabled={payMut.isPending} onClick={() => payMut.mutate({ id: openOrder.id, action: 'confirm' })}>✓ Payment received — confirm</button>
                      <button className="btn btn-outline" disabled={payMut.isPending} onClick={() => payMut.mutate({ id: openOrder.id, action: 'reject' })}>✕ Not found</button>
                    </div>
                  </>
                )}
                {openOrder.payment_status === 'awaiting' && <p className="pay-verify-hint">The customer has not submitted a transaction ID yet.</p>}
              </div>
            )}

            {/* ── Dropship items: place the order with the supplier yourself ── */}
            <SupplierPanel order={openOrder} />

            <p style={{ fontSize: 'var(--fs-sm)', marginBottom: 'var(--sp-sm)' }}><strong>Customer:</strong> {openOrder.customer?.name || openOrder.customer_name} ({openOrder.customer?.email || openOrder.customer_email})</p>
            <p style={{ fontSize: 'var(--fs-sm)', marginBottom: 'var(--sp-sm)' }}><strong>Phone:</strong> {openOrder.customer?.phone || openOrder.customer_phone}</p>
            <p style={{ fontSize: 'var(--fs-sm)', marginBottom: 'var(--sp-xl)' }}><strong>Address:</strong> {openOrder.customer?.address || openOrder.address}, {openOrder.customer?.city || openOrder.city}</p>
            {openOrder.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
                <img src={item.image} alt={item.name} style={{ width: '50px', height: '62px', objectFit: 'cover', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}><p style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>{item.name}</p><p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Qty: {item.quantity}{item.size ? ` · ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''}</p></div>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 'var(--sp-md)', marginTop: 'var(--sp-md)', fontSize: 'var(--fs-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{fmt(openOrder.subtotal)}</span></div>
              {!!openOrder.discount && openOrder.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}><span>Online payment discount</span><span>− {fmt(openOrder.discount)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><span>{openOrder.shipping === 0 ? 'Free' : fmt(openOrder.shipping)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 6 }}><span>Total</span><span>{fmt(openOrder.total)}</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-card">
        {toVerify > 0 && (
          <button className="pay-alert" onClick={() => setStatusFilter('verify')}>
            <span className="pay-alert-dot" /> <b>{toVerify}</b> payment{toVerify > 1 ? 's' : ''} waiting for your confirmation — click to review
          </button>
        )}
        <div className="admin-card-header">
          <div className="admin-toolbar">
            <input className="admin-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID or customer..." />
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Statuses</option>
              <option value="verify">💰 Payments to verify ({toVerify})</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--sp-xl)' }}>No orders found.</td></tr>
                : filtered.map(o => (
                  <tr key={o.id} className={o.payment_status === 'submitted' ? 'row-verify' : ''}>
                    <td data-label="Order ID"><strong style={{ fontSize: 'var(--fs-xs)' }}>{o.id}</strong>
                      {o.items?.some(i => i.is_dropship) && !o.supplier_status && o.status !== 'Cancelled' && <span className="sp-flag" title="Dropship — place this order with the supplier">🚚 To place</span>}
                    </td>
                    <td data-label="Customer">{o.customer?.name || o.customer_name}</td>
                    <td data-label="Date">{new Date(o.created_at || o.createdAt || '').toLocaleDateString()}</td>
                    <td data-label="Items">{o.items?.reduce((s, i) => s + i.quantity, 0) || 0}</td>
                    <td data-label="Total">{fmt(o.total)}</td>
                    <td data-label="Payment"><PayBadge o={o} /></td>
                    <td data-label="Status">
                      <select value={o.status} onChange={e => statusMut.mutate({ id: o.id, status: e.target.value })} className="form-select" style={{ width: 'auto', padding: '6px 10px', fontSize: 'var(--fs-xs)' }}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td data-label="Actions">
                      <div className="admin-table-actions">
                        {o.payment_status === 'submitted' && <button className="admin-icon-btn verify" onClick={() => setModal(o)} title="Verify payment">💰</button>}
                        <button className="admin-icon-btn" onClick={() => setModal(o)} title="View">👁️</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
