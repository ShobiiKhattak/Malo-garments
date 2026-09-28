import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getOrderById } from '../../services/api'
import { showToast } from '../ui/Toast'
import type { Order } from '../../types'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`
const LABELS: Record<string, string> = { cod: 'Cash on Delivery', jazzcash: 'NayaPay', easypaisa: 'EasyPaisa', bank_transfer: 'Bank Transfer' }
const WAITING = ['awaiting', 'submitted', 'rejected']

/** Loads an order and keeps refreshing it every 5 s while its payment is still waiting for the admin. */
export function useLiveOrder(id: string | null) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id as string),
    enabled: !!id,
    refetchInterval: q => (WAITING.includes(q.state.data?.payment_status ?? '') ? 5000 : false),
  })
}

/** The payment card customers see: pending → verifying → "Payment received" (turns green by itself). */
export default function PaymentStatus({ order }: { order: Order }) {
  const status = order.payment_status || 'not_required'
  const prev = useRef(status)

  // the moment the admin confirms, tell the customer even if they are looking elsewhere on the page
  useEffect(() => {
    if (prev.current !== 'confirmed' && status === 'confirmed') showToast('Payment received — thank you!', 'success')
    prev.current = status
  }, [status])

  if (status === 'not_required') return null
  const method = LABELS[order.payment_method || ''] || 'Online payment'

  if (status === 'confirmed') {
    return (
      <div className="ps ps-ok" key="ok">
        <div className="ps-burst" aria-hidden="true">{Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ ['--a' as string]: `${i * (360 / 14)}deg`, ['--d' as string]: `${i * 40}ms` }} />)}</div>
        <div className="ps-check">
          <svg viewBox="0 0 52 52" width="64" height="64"><circle cx="26" cy="26" r="24" fill="none" /><path d="M14 27l8 8 16-17" fill="none" /></svg>
        </div>
        <h3>Payment received!</h3>
        <p>We have received your payment{order.customer?.name ? `, ${order.customer.name.split(' ')[0]}` : ''}. Your order is now being prepared.</p>
        <dl>
          <div><dt>Amount paid</dt><dd className="ps-amount">{fmt(order.total)}</dd></div>
          <div><dt>Method</dt><dd>{method}</dd></div>
          {order.payment_ref && <div><dt>Transaction ID</dt><dd className="mono">{order.payment_ref}</dd></div>}
          {!!order.discount && order.discount > 0 && <div><dt>You saved</dt><dd className="save">{fmt(order.discount)} (online discount)</dd></div>}
          {order.payment_confirmed_at && <div><dt>Confirmed</dt><dd>{new Date(order.payment_confirmed_at).toLocaleString('en-PK')}</dd></div>}
        </dl>
      </div>
    )
  }

  if (status === 'submitted') {
    return (
      <div className="ps ps-wait" key="wait">
        <div className="ps-spin"><span /><span /><span /></div>
        <h3>Verifying your payment</h3>
        <p>We received your transaction ID <b className="mono">{order.payment_ref}</b>. Our team is confirming it — <b>this page updates by itself</b> the moment it is confirmed.</p>
        <p className="ps-live"><i /> Checking every few seconds</p>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="ps ps-bad" key="bad">
        <div className="ps-ico">⚠️</div>
        <h3>We could not find your payment</h3>
        <p>The transaction ID <b className="mono">{order.payment_ref}</b> did not match a payment of {fmt(order.total)}. Please check it and submit again.</p>
        <Link to={`/payment?orderId=${order.id}`} className="btn btn-primary">Submit transaction ID again</Link>
      </div>
    )
  }

  // awaiting
  return (
    <div className="ps ps-pending" key="pending">
      <div className="ps-ico">💳</div>
      <h3>Payment pending</h3>
      <p>Send <b>{fmt(order.total)}</b> via {method}, then submit your transaction ID so we can confirm it.</p>
      <Link to={`/payment?orderId=${order.id}`} className="btn btn-primary">Pay &amp; submit transaction ID</Link>
    </div>
  )
}
