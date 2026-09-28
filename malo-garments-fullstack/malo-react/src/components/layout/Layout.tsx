import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
// Announcement bar off — to bring it back, uncomment this import + <AnnouncementBar /> below and set --announce-h to 36px in storefront.css
// import AnnouncementBar from './AnnouncementBar'
import Navbar from './Navbar'
import Footer from './Footer'
import Toast from '../ui/Toast'
import WhatsAppButton from '../ui/WhatsAppButton'
import CartDrawer from './CartDrawer'

export default function Layout() {
  const { pathname, search } = useLocation()

  // Every navigation (footer link, category tile, menu…) starts at the top of the new page.
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }) }, [pathname, search])

  return (
    <>
      {/* <AnnouncementBar /> */}
      <Navbar />
      <main className="main-content">
        <div key={pathname} className="page-fade"><Outlet /></div>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
      <Toast />
    </>
  )
}
