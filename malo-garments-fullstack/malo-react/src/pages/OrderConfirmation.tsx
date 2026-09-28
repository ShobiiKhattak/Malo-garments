import { useSearchParams, Link } from 'react-router-dom'
import PaymentStatus, { useLiveOrder } from '../components/payment/PaymentStatus'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`

export default function OrderConfirmation() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const { data: order, isLoading } = useLiveOrder(id)

  if (isLoading) return <div style={{textAlign:'center',padding:'var(--sp-4xl)',paddingTop:'var(--sp-4xl)'}}>Loading...</div>

  if (!order) return (
    <div style={{paddingTop:'var(--sp-4xl)',textAlign:'center'}}>
      <div className="empty-state"><div className="empty-state-icon">😕</div><h3>Order Not Found</h3><Link to="/" className="btn btn-primary">Back to Home</Link></div>
    </div>
  )

  const paymentMethod = order.payment_method || order.paymentMethod || 'cod'
  const paymentLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'jazzcash' ? 'NayaPay' : paymentMethod === 'easypaisa' ? 'EasyPaisa' : paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Card Payment'

  return (
    <div>
      <div className="container" style={{paddingTop:'var(--sp-3xl)',paddingBottom:'var(--sp-4xl)',maxWidth:'680px'}}>
        <div style={{textAlign:'center',padding:'var(--sp-2xl)',background:'var(--white)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--border-light)',boxShadow:'var(--shadow-md)'}}>
          <div style={{fontSize:'4rem',marginBottom:'var(--sp-lg)'}}>🎉</div>
          <h1 style={{fontFamily:'var(--font-heading)',fontSize:'var(--fs-2xl)',marginBottom:'var(--sp-md)'}}>Thank You, {order.customer?.name?.split(' ')[0]}!</h1>
          <p style={{color:'var(--text-light)',marginBottom:'var(--sp-sm)'}}>Your order has been placed successfully.</p>
          <p style={{color:'var(--text-light)',marginBottom:'var(--sp-xl)',fontSize:'var(--fs-sm)'}}>A confirmation will be sent to {order.customer?.email}</p>
          <div style={{background:'var(--cream)',borderRadius:'var(--border-radius)',padding:'var(--sp-md)',display:'inline-block',marginBottom:'var(--sp-xl)'}}>
            <span style={{fontWeight:600}}>Order ID: </span><span style={{color:'var(--rose)',fontFamily:'monospace',fontWeight:700}}>{order.id}</span>
          </div>

          <PaymentStatus order={order} />

          <div style={{textAlign:'left',borderTop:'1px solid var(--border-light)',paddingTop:'var(--sp-xl)'}}>
            <h3 style={{fontFamily:'var(--font-heading)',marginBottom:'var(--sp-lg)'}}>Order Summary</h3>
            {order.items?.map((item,i)=>(
              <div key={i} style={{display:'flex',gap:'var(--sp-md)',alignItems:'center',marginBottom:'var(--sp-md)'}}>
                <img src={item.image} alt={item.name} style={{width:'60px',height:'75px',objectFit:'cover',borderRadius:'var(--border-radius)'}} />
                <div style={{flex:1}}>
                  <p style={{fontWeight:500}}>{item.name}</p>
                  <p style={{fontSize:'var(--fs-xs)',color:'var(--text-muted)'}}>Size: {item.size} · Qty: {item.quantity}</p>
                </div>
                <span style={{fontWeight:600}}>{fmt(item.price*item.quantity)}</span>
              </div>
            ))}
            <div style={{borderTop:'1px solid var(--border-light)',paddingTop:'var(--sp-md)',marginTop:'var(--sp-md)'}}>
              {[['Subtotal',fmt(order.subtotal)],...(order.discount ? [['Online payment discount','− '+fmt(order.discount)]] : []),['Shipping',order.shipping===0?'Free':fmt(order.shipping)],['Total',fmt(order.total)]].map(([l,v],i,arr)=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',marginBottom:'var(--sp-sm)',fontWeight:i===arr.length-1?700:'normal',fontSize:i===arr.length-1?'var(--fs-md)':'var(--fs-sm)',color:l==='Online payment discount'?'var(--success)':undefined}}><span>{l}</span><span>{v}</span></div>
              ))}
            </div>
            <div style={{marginTop:'var(--sp-xl)',paddingTop:'var(--sp-xl)',borderTop:'1px solid var(--border-light)',fontSize:'var(--fs-sm)',color:'var(--text-light)'}}>
              <p><strong>Shipping to:</strong> {order.customer?.address}, {order.customer?.city}</p>
              <p style={{marginTop:'var(--sp-sm)'}}><strong>Payment:</strong> {paymentLabel}</p>
            </div>
          </div>

          <div style={{display:'flex',gap:'var(--sp-md)',marginTop:'var(--sp-2xl)',justifyContent:'center'}}>
            <Link to="/shop" className="btn btn-outline">Continue Shopping</Link>
            <Link to="/account" className="btn btn-primary">View My Orders</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
