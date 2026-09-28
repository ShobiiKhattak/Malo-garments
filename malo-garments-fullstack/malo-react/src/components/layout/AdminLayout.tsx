import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getAllOrders } from '../../services/api'
import { showToast } from '../ui/Toast'
import Toast from '../ui/Toast'
import Logo from '../ui/Logo'
import ThemeToggle from '../ui/ThemeToggle'
import '../../styles/admin.css'

const PAGES = [
  { to: '/admin/dashboard',   label: 'Dashboard',  icon: '📊' },
  { to: '/admin/products',    label: 'Products',   icon: '👗' },
  { to: '/admin/categories',  label: 'Categories', icon: '🗂️' },
  { to: '/admin/orders',      label: 'Orders',     icon: '📦' },
  { to: '/admin/customers',   label: 'Customers',  icon: '👥' },
]

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function AdminLayout() {
  const { logoutAdmin, admin } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  // Payments customers say they made, waiting for the admin to check the wallet / bank and confirm
  const { data: orders = [] } = useQuery({ queryKey: ['allOrders'], queryFn: getAllOrders, refetchInterval: 20000 })
  const toVerify = orders.filter(o => o.payment_status === 'submitted').length
  const seen = useRef<number | null>(null)
  useEffect(() => {
    if (seen.current !== null && toVerify > seen.current) showToast('💰 A customer submitted a payment — please verify it in Orders.', 'info')
    seen.current = toVerify
  }, [toVerify])

  const handleLogout = () => { logoutAdmin(); navigate('/admin') }
  const current = PAGES.find(p => pathname.startsWith(p.to))

  // close the phone menu after navigating, and start each page at the top
  useEffect(() => { setNavOpen(false); window.scrollTo({ top: 0 }) }, [pathname])

  return (
    <div className="admin-layout" style={{ minHeight: '100vh' }}>
      <div className={`admin-overlay ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(false)} />
      <aside className={`admin-sidebar ${navOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-logo">
          <Logo variant="light" height={40} />
        </div>
        <nav className="admin-nav">
          {PAGES.map((p, i) => (
            <NavLink key={p.to} to={p.to} style={{ ['--i' as string]: i }} className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="admin-nav-icon">{p.icon}</span> {p.label}
              {p.to === '/admin/orders' && toVerify > 0 && <span className="admin-nav-badge" title="Payments to verify">{toVerify}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-view-site">🌐 View website</a>
          <button onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <button className={`admin-burger ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(o => !o)} aria-label="Menu"><span /><span /><span /></button>
            <h1 key={pathname}>{current?.label || 'Admin'}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-lg)' }}>
            <ThemeToggle />
            <div className="admin-topbar-user">👋 {greeting()}, {admin?.name || 'Admin'}</div>
          </div>
        </div>
        <div className="admin-content" key={pathname}>
          <Outlet />
        </div>
      </main>
      <Toast />
    </div>
  )
}
