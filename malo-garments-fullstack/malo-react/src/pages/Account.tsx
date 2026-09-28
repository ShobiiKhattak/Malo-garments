import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getMe, getMyOrders, updateMe, addAddress, removeMyOrder } from '../services/api'
import { showToast } from '../components/ui/Toast'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`

export default function Account() {
  const { user, logoutUser } = useAuth()
  const [panel, setPanel] = useState<'orders' | 'addresses' | 'profile'>('orders')
  const qc = useQueryClient()
  if (!user) return <Navigate to="/login" replace />

  const { data: profile } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const { data: orders = [] } = useQuery({ queryKey: ['myOrders'], queryFn: getMyOrders })

  const [profileForm, setProfileForm] = useState({ name: user.name, email: user.email, phone: user.phone||'' })
  const [addrForm, setAddrForm] = useState({ address:'', city:'', state:'', zip:'' })
  const [showAddrForm, setShowAddrForm] = useState(false)

  const removeMutation = useMutation({
    mutationFn: removeMyOrder,
    onSuccess: () => { showToast('Order removed from your list.', 'success'); qc.invalidateQueries({ queryKey: ['myOrders'] }) },
    onError: (e: any) => showToast(e.response?.data?.error || 'Could not remove this order.', 'error'),
  })
  const canRemove = (status: string) => status === 'Delivered' || status === 'Cancelled'
  const updateMutation = useMutation({ mutationFn: updateMe, onSuccess: () => { showToast('Profile updated!','success'); qc.invalidateQueries({ queryKey: ['me'] }) } })
  const addAddrMutation = useMutation({ mutationFn: addAddress, onSuccess: () => { showToast('Address saved!','success'); setShowAddrForm(false); setAddrForm({address:'',city:'',state:'',zip:''}); qc.invalidateQueries({ queryKey: ['me'] }) } })

  const initials = user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()

  return (
    <div>
      <style>{`@media (max-width: 768px) { .account-layout { grid-template-columns: 1fr !important; } }`}</style>
      <div className="page-header"><div className="container"><h1>My Account</h1></div></div>
      <div className="container" style={{paddingTop:'var(--sp-2xl)',paddingBottom:'var(--sp-4xl)'}}>
        <div className="account-layout" style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:'var(--sp-2xl)',alignItems:'start'}}>
          <aside style={{background:'var(--white)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--border-light)',padding:'var(--sp-xl)',textAlign:'center'}}>
            <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'var(--rose)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'var(--fs-xl)',fontWeight:700,margin:'0 auto var(--sp-md)'}}>{initials}</div>
            <h3 style={{fontFamily:'var(--font-heading)',marginBottom:'4px'}}>{user.name}</h3>
            <p style={{fontSize:'var(--fs-sm)',color:'var(--text-light)',marginBottom:'var(--sp-xl)'}}>{user.email}</p>
            <nav style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              {([['orders','📦 My Orders'],['addresses','📍 Saved Addresses'],['profile','👤 Profile Settings']] as const).map(([p,label])=>(
                <button key={p} onClick={()=>setPanel(p)} style={{padding:'10px 16px',borderRadius:'var(--border-radius)',border:'none',cursor:'pointer',fontWeight:panel===p?600:400,background:panel===p?'var(--rose)':'transparent',color:panel===p?'white':'var(--text)',textAlign:'left',fontSize:'var(--fs-sm)'}}>{label}</button>
              ))}
              <button onClick={()=>{logoutUser();window.location.href='/'}} style={{padding:'10px 16px',borderRadius:'var(--border-radius)',border:'none',cursor:'pointer',color:'var(--error)',background:'transparent',textAlign:'left',fontSize:'var(--fs-sm)',marginTop:'var(--sp-md)'}}>🚪 Logout</button>
            </nav>
          </aside>

          <div style={{background:'var(--white)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--border-light)',padding:'var(--sp-xl)'}}>
            {panel === 'orders' && (
              <>
                <h2 style={{fontFamily:'var(--font-heading)',marginBottom:'var(--sp-xl)'}}>My Orders</h2>
                {orders.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-icon">📦</div><h3>No orders yet</h3><Link to="/shop" className="btn btn-primary">Start Shopping</Link></div>
                ) : orders.map(order=>(
                  <div key={order.id} style={{border:'1px solid var(--border-light)',borderRadius:'var(--border-radius-lg)',padding:'var(--sp-lg)',marginBottom:'var(--sp-md)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'var(--sp-md)'}}>
                      <div><strong>{order.id}</strong> <span style={{color:'var(--text-muted)',fontSize:'var(--fs-xs)',marginLeft:'var(--sp-sm)'}}>{new Date(order.created_at||order.createdAt||'').toLocaleDateString()}</span></div>
                      <span style={{padding:'3px 12px',borderRadius:'20px',fontSize:'var(--fs-xs)',fontWeight:600,background:order.status==='Delivered'?'var(--success-bg)':order.status==='Cancelled'?'var(--error-bg)':'var(--warning-bg)',color:order.status==='Delivered'?'var(--success)':order.status==='Cancelled'?'var(--error)':'var(--warning)'}}>{order.status}</span>
                    </div>
                    {order.items?.map((item,i)=>(
                      <div key={i} style={{display:'flex',gap:'var(--sp-md)',alignItems:'center',marginBottom:'var(--sp-sm)'}}>
                        <img src={item.image} alt={item.name} style={{width:'48px',height:'60px',objectFit:'cover',borderRadius:'4px'}} />
                        <div style={{flex:1}}><p style={{fontSize:'var(--fs-sm)',fontWeight:500}}>{item.name}</p><p style={{fontSize:'var(--fs-xs)',color:'var(--text-muted)'}}>Qty: {item.quantity}</p></div>
                        <span style={{fontSize:'var(--fs-sm)',fontWeight:500}}>{fmt(item.price*item.quantity)}</span>
                      </div>
                    ))}
                    <div style={{borderTop:'1px solid var(--border-light)',paddingTop:'var(--sp-sm)',marginTop:'var(--sp-sm)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'var(--sp-md)',flexWrap:'wrap'}}>
                      {canRemove(order.status) ? (
                        <button type="button" className="order-remove" disabled={removeMutation.isPending}
                          onClick={() => { if (window.confirm(`Remove order ${order.id} from your list?

This only hides it from My Orders — you cannot undo it.`)) removeMutation.mutate(order.id) }}>
                          🗑 Remove
                        </button>
                      ) : <span />}
                      <b>Total: {fmt(order.total)}</b>
                    </div>
                  </div>
                ))}
              </>
            )}

            {panel === 'addresses' && (
              <>
                <h2 style={{fontFamily:'var(--font-heading)',marginBottom:'var(--sp-xl)'}}>Saved Addresses</h2>
                {(profile?.addresses||[]).length === 0 && !showAddrForm && <p style={{color:'var(--text-light)',marginBottom:'var(--sp-lg)'}}>No saved addresses yet.</p>}
                {(profile?.addresses||[]).map((a,i)=>(
                  <div key={i} style={{padding:'var(--sp-lg)',border:'1px solid var(--border-light)',borderRadius:'var(--border-radius-lg)',marginBottom:'var(--sp-md)'}}>
                    <p style={{fontWeight:500}}>{a.street}</p>
                    <p style={{color:'var(--text-light)',fontSize:'var(--fs-sm)'}}>{a.city}{a.state?`, ${a.state}`:''} {a.zip||''}</p>
                  </div>
                ))}
                {showAddrForm ? (
                  <form onSubmit={e=>{e.preventDefault();addAddrMutation.mutate({street:addrForm.address,city:addrForm.city,state:addrForm.state,zip:addrForm.zip})}}>
                    <div className="form-row">
                      <div className="form-group"><label className="form-label">Street Address *</label><input value={addrForm.address} onChange={e=>setAddrForm(f=>({...f,address:e.target.value}))} className="form-input" required /></div>
                      <div className="form-group"><label className="form-label">City *</label><input value={addrForm.city} onChange={e=>setAddrForm(f=>({...f,city:e.target.value}))} className="form-input" required /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label className="form-label">State</label><input value={addrForm.state} onChange={e=>setAddrForm(f=>({...f,state:e.target.value}))} className="form-input" /></div>
                      <div className="form-group"><label className="form-label">Zip</label><input value={addrForm.zip} onChange={e=>setAddrForm(f=>({...f,zip:e.target.value}))} className="form-input" /></div>
                    </div>
                    <button type="submit" className="btn btn-primary">Save Address</button>
                    <button type="button" className="btn btn-outline" style={{marginLeft:'var(--sp-md)'}} onClick={()=>setShowAddrForm(false)}>Cancel</button>
                  </form>
                ) : <button className="btn btn-outline" onClick={()=>setShowAddrForm(true)}>+ Add New Address</button>}
              </>
            )}

            {panel === 'profile' && (
              <>
                <h2 style={{fontFamily:'var(--font-heading)',marginBottom:'var(--sp-xl)'}}>Profile Settings</h2>
                <form onSubmit={e=>{e.preventDefault();updateMutation.mutate(profileForm)}}>
                  <div className="form-group"><label className="form-label">Full Name</label><input value={profileForm.name} onChange={e=>setProfileForm(f=>({...f,name:e.target.value}))} className="form-input" /></div>
                  <div className="form-group"><label className="form-label">Email</label><input type="email" value={profileForm.email} onChange={e=>setProfileForm(f=>({...f,email:e.target.value}))} className="form-input" /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input value={profileForm.phone} onChange={e=>setProfileForm(f=>({...f,phone:e.target.value}))} className="form-input" /></div>
                  <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>Save Changes</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
