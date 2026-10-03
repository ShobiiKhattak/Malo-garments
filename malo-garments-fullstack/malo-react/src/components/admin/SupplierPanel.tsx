import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateOrderSupplier } from '../../services/api'
import { showToast } from '../ui/Toast'
import type { Order } from '../../types'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`

/**
 * Dropshipping helper inside the admin order window. Everything is manual: the admin opens the
 * supplier's page, places the order there, then marks it here (and adds tracking if they have it).
 */
export default function SupplierPanel({ order }: { order: Order }) {
  const qc = useQueryClient()
  const items = (order.items || []).filter(i => i.is_dropship)
  const [ref, setRef] = useState(order.supplier_ref || '')
  useEffect(() => { setRef(order.supplier_ref || '') }, [order.id, order.supplier_ref])

  const mut = useMutation({
    mutationFn: (status: 'placed' | 'shipped' | null) => updateOrderSupplier(order.id, { status, ref }),
    onSuccess: (_d, status) => {
      showToast(status === 'placed' ? 'Marked as placed with the supplier.' : status === 'shipped' ? 'Marked as shipped by the supplier.' : 'Supplier status cleared.', 'success')
      qc.invalidateQueries({ queryKey: ['allOrders'] })
    },
    onError: (e: any) => showToast(e.response?.data?.error || 'Could not update.', 'error'),
  })

  if (!items.length) return null

  const c = order.customer || {}
  const unpaidCod = order.payment_method === 'cod' || !order.payment_method
  const shipTo = [
    c.name || order.customer_name,
    c.phone || order.customer_phone,
    [c.address || order.address, c.city || order.city, c.state || order.state].filter(Boolean).join(', '),
  ].filter(Boolean).join('\n')

  const sales = items.reduce((n, i) => n + i.price * i.quantity, 0)
  const cost = items.reduce((n, i) => n + (Number(i.cost_price) || 0) * i.quantity, 0)
  const missingCost = items.some(i => i.cost_price == null)

  const copy = (text: string, what: string) =>
    navigator.clipboard?.writeText(text).then(() => showToast(`${what} copied.`, 'success')).catch(() => showToast('Could not copy.', 'error'))

  const status = order.supplier_status
  return (
    <div className={`sp-box ${status || 'todo'}`}>
      <div className="sp-head">
        <b>🚚 Dropship — place with supplier</b>
        <span className={`sp-badge ${status || 'todo'}`}>{status === 'placed' ? 'Placed ✓' : status === 'shipped' ? 'Shipped 📦' : 'To place'}</span>
      </div>

      {items.map((i, n) => (
        <div key={n} className="sp-item">
          <div>
            <b>{i.name}</b>
            <small>Qty {i.quantity}{i.size ? ` · Size ${i.size}` : ''}{i.color ? ` · ${i.color}` : ''}{i.supplier_sku ? ` · SKU ${i.supplier_sku}` : ''}</small>
            <small>{i.supplier_name || 'Supplier'}{i.cost_price != null ? ` · cost ${fmt(Number(i.cost_price))} each` : ''}</small>
          </div>
          {i.supplier_url
            ? <a className="btn btn-outline btn-sm" href={i.supplier_url} target="_blank" rel="noopener noreferrer">Open supplier ↗</a>
            : <span className="sp-nolink">No link saved</span>}
        </div>
      ))}

      <div className="sp-ship">
        <div className="sp-ship-head">
          <span>Ship to (paste in the supplier's checkout)</span>
          <button type="button" className="sp-copy" onClick={() => copy(shipTo, 'Delivery details')}>Copy</button>
        </div>
        <pre>{shipTo}</pre>
        <small>{unpaidCod ? `Cash on Delivery — customer pays ${fmt(order.total)} on delivery.` : 'Paid online — nothing to collect from the customer.'}</small>
      </div>

      <div className="sp-money">
        <div><span>Items sold</span><b>{fmt(sales)}</b></div>
        {!!order.discount && order.discount > 0 && <div><span>Online discount given</span><b>− {fmt(order.discount)}</b></div>}
        <div><span>Supplier cost</span><b>− {fmt(cost)}</b></div>
        <div className="sp-profit"><span>Your profit</span><b>{fmt(sales - (order.discount || 0) - cost)}</b></div>
        {missingCost && <small>Some items have no supplier price saved — add it on the product to see the exact profit.</small>}
      </div>

      <div className="sp-actions">
        <input className="form-input" value={ref} onChange={e => setRef(e.target.value)} placeholder="Supplier order no. / tracking (optional)" />
        <div className="sp-btns">
          <button type="button" className="btn btn-primary btn-sm" disabled={mut.isPending} onClick={() => mut.mutate('placed')}>✓ Placed with supplier</button>
          <button type="button" className="btn btn-outline btn-sm" disabled={mut.isPending} onClick={() => mut.mutate('shipped')}>📦 Supplier shipped</button>
          {status && <button type="button" className="sp-reset" disabled={mut.isPending} onClick={() => mut.mutate(null)}>Reset</button>}
        </div>
      </div>
    </div>
  )
}
