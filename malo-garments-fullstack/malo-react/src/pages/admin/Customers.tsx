import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCustomers } from '../../services/api'
import type { Customer } from '../../types'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`

export default function Customers() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<Customer | null>(null)
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: getCustomers })

  const filtered = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      {modal && (
        <div className="admin-modal-overlay" onClick={()=>setModal(null)}>
          <div className="admin-modal" onClick={e=>e.stopPropagation()}>
            <div className="admin-modal-header"><h3>{modal.name}</h3><button className="admin-modal-close" onClick={()=>setModal(null)}>✕</button></div>
            <p style={{fontSize:'var(--fs-sm)',marginBottom:'var(--sp-sm)'}}><strong>Email:</strong> {modal.email}</p>
            <p style={{fontSize:'var(--fs-sm)',marginBottom:'var(--sp-sm)'}}><strong>Phone:</strong> {modal.phone||'—'}</p>
            <p style={{fontSize:'var(--fs-sm)',marginBottom:'var(--sp-sm)'}}><strong>Joined:</strong> {modal.date_joined?new Date(modal.date_joined).toLocaleDateString():'—'}</p>
            <p style={{fontSize:'var(--fs-sm)',marginBottom:'var(--sp-sm)'}}><strong>Total Orders:</strong> {modal.orderCount||0}</p>
            <p style={{fontSize:'var(--fs-sm)'}}><strong>Total Spent:</strong> {fmt(modal.totalSpent||0)}</p>
          </div>
        </div>
      )}
      <div className="admin-card">
        <div className="admin-card-header">
          <input className="admin-search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers..." />
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Orders</th><th>Total Spent</th><th></th></tr></thead>
            <tbody>
              {filtered.length===0 ? <tr><td colSpan={7} style={{textAlign:'center',color:'var(--text-muted)',padding:'var(--sp-xl)'}}>No customers found.</td></tr>
              : filtered.map(c=>(
                <tr key={c.id}>
                  <td data-label="Name">{c.name}</td><td data-label="Email">{c.email}</td><td data-label="Phone">{c.phone||'—'}</td>
                  <td data-label="Joined">{c.date_joined?new Date(c.date_joined).toLocaleDateString():'—'}</td>
                  <td data-label="Orders">{c.orderCount||0}</td>
                  <td data-label="Total Spent">{fmt(c.totalSpent||0)}</td>
                  <td data-label=""><button className="admin-icon-btn" onClick={()=>setModal(c)} title="View">👁️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
