import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { applyDayPeriodTheme } from './utils/dayPeriod'

// Layout
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'

// Storefront pages
import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import DesignStudio from './pages/DesignStudio'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import PaymentPage from './pages/PaymentPage'
import Login from './pages/Login'
import NexusLogin from './pages/NexusLogin'
import Account from './pages/Account'
import About from './pages/About'
import Contact from './pages/Contact'
import InfoPage from './pages/InfoPage'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import Products from './pages/admin/Products'
import Categories from './pages/admin/Categories'
import Orders from './pages/admin/Orders'
import Customers from './pages/admin/Customers'

function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('malo_admin_token')
  const location = useLocation()
  return token ? <>{children}</> : <Navigate to="/admin" replace state={{ from: location.pathname + location.search }} />
}

export default function App() {
  // The <head> inline script sets the initial theme before first paint;
  // this just keeps it correct if a tab stays open across the day/night boundary.
  useEffect(() => {
    const t = setInterval(applyDayPeriodTheme, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Storefront */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/design-studio" element={<DesignStudio />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment-demo" element={<Navigate to="/checkout" replace />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/nexus-login" element={<NexusLogin />} />
          <Route path="/account" element={<Account />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/returns" element={<InfoPage key="returns" slug="returns" />} />
          <Route path="/shipping" element={<InfoPage key="shipping" slug="shipping" />} />
          <Route path="/privacy" element={<InfoPage key="privacy" slug="privacy" />} />
          <Route path="/terms" element={<InfoPage key="terms" slug="terms" />} />
          <Route path="/faq" element={<InfoPage key="faq" slug="faq" />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/customers" element={<Customers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
