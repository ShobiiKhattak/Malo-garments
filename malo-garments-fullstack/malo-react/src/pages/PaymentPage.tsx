import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { submitOnlinePayment } from '../services/api'
import { showToast } from '../components/ui/Toast'
import PaymentStatus, { useLiveOrder } from '../components/payment/PaymentStatus'
import { PAY_ACCOUNTS, REF_RULES, isOnlineMethod, cleanRef, refError } from '../data/payments'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button" className={`pay-copy ${done ? 'done' : ''}`} aria-label={`Copy ${label}`} onClick={() => {
      try { navigator.clipboard?.writeText(text) } catch { /* clipboard unavailable */ }
      setDone(true); setTimeout(() => setDone(false), 1600)
    }}>{done ? '✓ Copied' : 'Copy'}</button>
  )
}

export default function PaymentPage() {
  const [params] = useSearchParams()
  const id = params.get('orderId')
  const qc = useQueryClient()
  const { data: order, isLoading } = useLiveOrder(id)
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)

  if (isLoading) return <div className="container" style={{ padding: 'var(--sp-3xl) var(--sp-md)' }}><div className="skel" style={{ height: 320, borderRadius: 16, maxWidth: 680, margin: '0 auto' }} /></div>
  if (!order) return (
    <div className="empty-state" style={{ paddingTop: 'var(--sp-4xl)' }}>
      <div className="empty-state-icon">😕</div><h3>Order not found</h3><Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  )

  const method = order.payment_method || ''
  if (!isOnlineMethod(method)) return <Navigate to={`/order-confirmation?id=${order.id}`} replace />
  const acc = PAY_ACCOUNTS[method]
  const status = order.payment_status || 'awaiting'
  const needsForm = status === 'awaiting' || status === 'rejected'
  const email = order.customer?.email || order.customer_email || ''
  const rule = REF_RULES[method]
  const ref = cleanRef(reference)
  const refErr = refError(method, ref)
  const showErr = touched && !!refErr

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (refErr) return showToast(refErr, 'error')
    setBusy(true)
    try {
      await submitOnlinePayment(order.id, { email, reference: ref })
      await qc.invalidateQueries({ queryKey: ['order', id] })
      showToast('Thank you! We are confirming your payment.', 'success')
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Could not submit. Please try again.', 'error')
    } finally { setBusy(false) }
  }

  return (
    <div className="container pay">
      <header className="pay-head">
        <span>Order #{order.id}</span>
        <h1>{status === 'confirmed' ? 'Payment complete' : 'Complete your payment'}</h1>
      </header>

      {status === 'confirmed' || status === 'submitted' ? (
        <>
          <PaymentStatus order={order} />
          <div className="pay-actions">
            <Link to={`/order-confirmation?id=${order.id}`} className="btn btn-outline">View order details</Link>
            <Link to="/shop" className="btn btn-primary">Continue shopping</Link>
          </div>
        </>
      ) : (
        <div className="pay-grid">
          {status === 'rejected' && <div className="pay-full"><PaymentStatus order={order} /></div>}

          <section className="pay-card" style={{ ['--c' as string]: acc.color }}>
            <h2>1. Send the payment</h2>
            <ol>{acc.steps.map(s => <li key={s}>{s}</li>)}</ol>

            <div className="pay-box">
              <div><small>Amount to send</small><b className="pay-amount">{fmt(order.total)}</b></div>
              <CopyButton text={String(order.total)} label="amount" />
            </div>
            <div className="pay-box">
              <div>
                <small>{acc.accountLabel}{acc.bank ? ` · ${acc.bank}` : ''}</small>
                <b>{acc.account}</b>
                <span>{acc.holder}</span>
              </div>
              <CopyButton text={acc.account} label="account" />
            </div>

            <div className="pay-sum">
              <div><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
              {!!order.discount && order.discount > 0 && <div className="save"><span>Online payment discount</span><span>− {fmt(order.discount)}</span></div>}
              <div><span>Shipping</span><span>{order.shipping === 0 ? 'Free' : fmt(order.shipping)}</span></div>
              <div className="total"><span>Total to pay</span><span>{fmt(order.total)}</span></div>
            </div>
          </section>

          <form className="pay-card" onSubmit={submit}>
            <h2>2. Submit your transaction ID</h2>
            <p className="pay-hint">After sending the money, paste the Transaction ID / Reference number from your payment receipt. We confirm it and you see a payment-received card here and in your email.</p>
            <div className={`co-field ${showErr ? 'has-error' : ''}`}>
              <input id="pay-ref" value={reference} placeholder=" " autoComplete="off"
                inputMode={rule.numeric ? 'numeric' : 'text'} maxLength={rule.maxLength + 4} aria-invalid={showErr} aria-describedby="pay-ref-err"
                onChange={e => setReference(rule.numeric ? e.target.value.replace(/[^\d\s]/g, '') : e.target.value)}
                onBlur={() => setTouched(true)} />
              <label htmlFor="pay-ref">Transaction ID ({rule.example})</label>
              {showErr && <span id="pay-ref-err" className="co-error">{refErr}</span>}
            </div>
            <button type="submit" className="co-submit" disabled={busy || !needsForm || !!refErr}>{busy ? 'Submitting…' : "I have paid — submit"}</button>
            <p className="co-foot">Your order is reserved. Not paid yet? You can come back to this page from your order confirmation.</p>
          </form>
        </div>
      )}
    </div>
  )
}
