import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`
const FREE_SHIPPING = 5000
const SHIPPING_FEE = 250

export default function Cart() {
  const { cart, updateItem, removeItem, cartTotal } = useCart()
  const shipping = cartTotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE
  const total = cartTotal + shipping

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .cart-layout { grid-template-columns: minmax(0, 1fr) !important; gap: var(--sp-lg) !important; }
          .cart-layout > * { min-width: 0; }
          .cart-summary { position: static !important; padding: var(--sp-lg) !important; }
        }
        @media (max-width: 480px) {
          .cart-item-row { grid-template-columns: 60px minmax(0, 1fr) !important; column-gap: var(--sp-md) !important; row-gap: var(--sp-sm) !important; padding: var(--sp-md) !important; }
          .cart-item-row > img { width: 60px !important; height: 76px !important; }
          .cart-item-qty { grid-column: 2 / -1; justify-self: start; }
          .cart-item-actions { grid-column: 1 / -1; display: flex !important; justify-content: space-between !important; align-items: center !important; text-align: left !important; }
        }
      `}</style>
      <div className="page-header"><div className="container"><h1>Shopping Cart</h1><div className="breadcrumb"><a href="/">Home</a><span className="separator">/</span><span className="current">Cart</span></div></div></div>
      <div className="container" style={{paddingTop:'var(--sp-2xl)',paddingBottom:'var(--sp-4xl)'}}>
        {cart.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🛍️</div><h3>Your cart is empty</h3><p>Add some products before checking out.</p><Link to="/shop" className="btn btn-primary">Start Shopping</Link></div>
        ) : (
          <div className="cart-layout" style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:'var(--sp-2xl)',alignItems:'start'}}>
            <div>
              {cart.map((item,i)=>(
                <div key={i} className="cart-item-row cart-anim" style={{['--i' as string]:i,display:'grid',gridTemplateColumns:'80px 1fr auto auto',gap:'var(--sp-lg)',alignItems:'center',padding:'var(--sp-lg)',background:'var(--white)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--border-light)',marginBottom:'var(--sp-md)'}}>
                  <img src={item.image} alt={item.name} style={{width:'80px',height:'100px',objectFit:'cover',borderRadius:'var(--border-radius)'}} />
                  <div>
                    {item.productId ? (
                      <Link to={`/product/${item.productId}`} style={{fontWeight:500,color:'var(--text)'}}>{item.name}</Link>
                    ) : (
                      <span style={{fontWeight:500,color:'var(--text)'}}>{item.name}</span>
                    )}
                    <p style={{fontSize:'var(--fs-sm)',color:'var(--text-light)',marginTop:'4px'}}>{item.size ? `Size: ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''}</p>
                    <p style={{fontWeight:600,marginTop:'var(--sp-sm)'}}>{fmt(item.price)}</p>
                  </div>
                  <div className="cart-item-qty" style={{display:'flex',alignItems:'center',border:'1.5px solid var(--border)',borderRadius:'var(--border-radius)'}}>
                    <button className="qty-btn" onClick={()=>updateItem(i,item.quantity-1)} style={{padding:'8px 12px',background:'none',border:'none',cursor:'pointer',fontSize:'var(--fs-md)'}}>−</button>
                    <span style={{padding:'8px',minWidth:'32px',textAlign:'center',fontWeight:500}}>{item.quantity}</span>
                    <button className="qty-btn" onClick={()=>updateItem(i,item.quantity+1)} style={{padding:'8px 12px',background:'none',border:'none',cursor:'pointer',fontSize:'var(--fs-md)'}}>+</button>
                  </div>
                  <div className="cart-item-actions" style={{textAlign:'right'}}>
                    <p style={{fontWeight:600,marginBottom:'var(--sp-sm)'}}>{fmt(item.price*item.quantity)}</p>
                    <button onClick={()=>removeItem(i)} style={{color:'var(--error)',background:'none',border:'none',cursor:'pointer',fontSize:'var(--fs-xs)'}}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary" style={{background:'var(--white)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--border-light)',padding:'var(--sp-xl)',position:'sticky',top:'calc(var(--navbar-height) + 20px)'}}>
              <h3 style={{fontFamily:'var(--font-heading)',marginBottom:'var(--sp-xl)'}}>Order Summary</h3>
              {[['Subtotal',fmt(cartTotal)],['Shipping',shipping===0?'Free':fmt(shipping)],].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',marginBottom:'var(--sp-md)',fontSize:'var(--fs-sm)'}}><span style={{color:'var(--text-light)'}}>{l}</span><span>{v}</span></div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'var(--sp-md) 0',borderTop:'2px solid var(--border-light)',fontWeight:700,fontSize:'var(--fs-md)'}}><span>Total</span><span>{fmt(total)}</span></div>
              <div className="free-ship">
                <p>{shipping>0 ? <>Add <b>{fmt(FREE_SHIPPING-cartTotal)}</b> more for free shipping!</> : <>🎉 You have unlocked <b>free shipping</b>!</>}</p>
                <div className="free-bar"><span style={{width:`${Math.min(100,(cartTotal/FREE_SHIPPING)*100)}%`}} /></div>
              </div>
              <Link to="/checkout" className="btn btn-primary btn-lg btn-block" style={{display:'flex',marginTop:'var(--sp-md)'}}>Proceed to Checkout</Link>
              <Link to="/shop" className="btn btn-outline btn-block" style={{display:'flex',marginTop:'var(--sp-md)'}}>Continue Shopping</Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
