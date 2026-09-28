import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { getCategories } from '../../services/api'
import type { Category } from '../../types'
import { ThemedLogo } from '../ui/Logo'
import { SPECIAL_LINKS } from '../../data/homeContent'
import { categoryLink } from '../../hooks/useCategories'
import ThemeToggle from '../ui/ThemeToggle'

interface Suggestion {
  type: 'category' | 'subcategory' | 'search'
  label: string
  icon: string
  url: string
  parent?: string
}

// Stable reference so `categories` doesn't become a new [] on every render
// while the query is still loading — a fresh array there would re-trigger
// the effect below on every render (it calls setSuggestions), causing an
// infinite render loop until the query resolves.
const EMPTY_CATEGORIES: Category[] = []

export default function Navbar() {
  const { cartCount, openCart } = useCart()
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { setMenuOpen(false) }, [location.pathname, location.search])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenuOpen(false); setSearchOpen(false) } }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [menuOpen])

  // Fetch categories for smart search matching
  const { data: categories = EMPTY_CATEGORIES } = useQuery({ queryKey: ['categories'], queryFn: getCategories })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Build suggestions from categories + subcategories as user types
  useEffect(() => {
    const q = searchQ.trim().toLowerCase()
    if (!q || q.length < 1) { setSuggestions([]); return }

    const results: Suggestion[] = []

    // Match categories
    categories.forEach(cat => {
      if (cat.name.toLowerCase().includes(q)) {
        results.push({ type: 'category', label: cat.name, icon: '🗂️', url: `/shop?category=${cat.id}` })
      }
      // Match subcategories
      ;(cat.subcategories || []).forEach(sub => {
        if (sub.name.toLowerCase().includes(q)) {
          results.push({ type: 'subcategory', label: sub.name, parent: cat.name, icon: '👗', url: `/shop?category=${cat.id}&subcategory=${sub.id}` })
        }
      })
    })

    // Always add a "search products" option
    results.push({ type: 'search', label: `Search products for "${searchQ.trim()}"`, icon: '🔍', url: `/shop?q=${encodeURIComponent(searchQ.trim())}` })

    setSuggestions(results.slice(0, 6))
  }, [searchQ, categories])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQ.trim()) return
    // If first suggestion is a category/subcategory, go there directly
    const first = suggestions[0]
    if (first && (first.type === 'category' || first.type === 'subcategory')) {
      navigate(first.url)
    } else {
      navigate(`/shop?q=${encodeURIComponent(searchQ.trim())}`)
    }
    closeSearch()
  }

  const handleSuggestion = (url: string) => {
    navigate(url)
    closeSearch()
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQ('')
    setSuggestions([])
  }

  return (
    <>
      <header id="main-navbar" className={scrolled ? 'scrolled' : ''}>
        <div className="nb-inner">
          <div className="nb-left">
            <button className={`nb-burger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(m => !m)} aria-label="Menu" aria-expanded={menuOpen}>
              <span /><span /><span />
            </button>
            <nav className="nb-quick">
              <Link to={SPECIAL_LINKS[0].to}>{SPECIAL_LINKS[0].label}</Link>
              {categories.slice(0, 4).map(c => <Link key={c.id} to={categoryLink(c)}>{c.name}</Link>)}
            </nav>
          </div>

          <Link to="/" className="nb-logo" aria-label="Malo Garments home"><ThemedLogo height={46} /></Link>

          <div className="nb-actions">
            <ThemeToggle />
            <button onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 100) }} aria-label="Search" className="nb-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <Link to={user ? '/account' : '/login'} aria-label="Account" className="nb-icon nb-account">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>
            <button onClick={openCart} aria-label="Open cart" className="nb-icon nb-cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {cartCount > 0 && <span key={cartCount} className="nb-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Slide-in menu ── */}
      <div className={`drawer-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
      <aside className={`drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="drawer-head">
          <ThemedLogo height={40} />
          <button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <nav className="drawer-links">
          {[{ label: 'Home', to: '/' }, SPECIAL_LINKS[0]].map((l, i) => (
            <Link key={l.label} to={l.to} style={{ ['--i' as string]: i }} tabIndex={menuOpen ? 0 : -1}>
              {l.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          ))}
          {categories.map((c, i) => {
            const open = openCat === c.id
            return (
              <div key={c.id} className={`drawer-cat ${open ? 'open' : ''}`} style={{ ['--i' as string]: i + 2 }}>
                <div className="drawer-cat-row">
                  <Link to={categoryLink(c)} tabIndex={menuOpen ? 0 : -1}>{c.name}</Link>
                  {!!c.subcategories?.length && (
                    <button aria-label={`${c.name} subcategories`} aria-expanded={open} onClick={() => setOpenCat(open ? null : c.id)} tabIndex={menuOpen ? 0 : -1}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                  )}
                </div>
                <div className="drawer-subs"><div>
                  <Link to={categoryLink(c)} tabIndex={open ? 0 : -1}>All {c.name}</Link>
                  {c.subcategories?.map(s => <Link key={s.id} to={categoryLink(c, s)} tabIndex={open ? 0 : -1}>{s.name}</Link>)}
                </div></div>
              </div>
            )
          })}
          <Link to={SPECIAL_LINKS[1].to} className="drawer-sale" style={{ ['--i' as string]: categories.length + 2 }} tabIndex={menuOpen ? 0 : -1}>{SPECIAL_LINKS[1].label}</Link>
        </nav>
        <div className="drawer-foot">
          <Link to="/design-studio" tabIndex={menuOpen ? 0 : -1}>Design Studio</Link>
          <Link to="/about" tabIndex={menuOpen ? 0 : -1}>About</Link>
          <Link to="/contact" tabIndex={menuOpen ? 0 : -1}>Contact</Link>
          <Link to={user ? '/account' : '/login'} tabIndex={menuOpen ? 0 : -1}>{user ? 'My Account' : 'Login / Sign up'}</Link>
        </div>
      </aside>

      {/* ── Smart Search Overlay ── */}
      {searchOpen && (
        <div onClick={closeSearch} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1001, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'100px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'90%', maxWidth:'620px' }}>

            {/* Search Input */}
            <form onSubmit={handleSearch} style={{ display:'flex', background:'var(--white)', borderRadius: suggestions.length ? '16px 16px 0 0' : '50px', overflow:'hidden', boxShadow:'var(--shadow-xl)' }}>
              <span style={{ padding:'0 0 0 20px', display:'flex', alignItems:'center', color:'var(--text-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <input
                ref={inputRef}
                autoFocus
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search products, categories (e.g. bra, dress, undergarments)..."
                style={{ flex:1, padding:'16px 12px', border:'none', outline:'none', fontSize:'var(--fs-md)', fontFamily:'var(--font-body)' }}
              />
              {searchQ && (
                <button type="button" onClick={() => { setSearchQ(''); setSuggestions([]); inputRef.current?.focus() }} style={{ padding:'0 12px', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'1.2rem' }}>✕</button>
              )}
              <button type="submit" style={{ padding:'16px 24px', background:'var(--rose)', color:'white', border:'none', cursor:'pointer', fontWeight:600, fontSize:'var(--fs-sm)', borderRadius: suggestions.length ? 0 : '0 50px 50px 0' }}>Search</button>
            </form>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div style={{ background:'var(--white)', borderRadius:'0 0 16px 16px', boxShadow:'var(--shadow-xl)', overflow:'hidden', borderTop:'1px solid var(--border-light)' }}>
                {suggestions.map((s, i) => (
                  <div key={i} className="suggestion-item" onClick={() => handleSuggestion(s.url)}>
                    <span style={{ fontSize:'1.2rem', flexShrink:0 }}>{s.icon}</span>
                    <div style={{ flex:1 }}>
                      <span style={{ fontWeight: s.type !== 'search' ? 600 : 400, color: s.type !== 'search' ? 'var(--text)' : 'var(--text-light)', fontSize:'var(--fs-sm)' }}>{s.label}</span>
                      {s.parent && <span style={{ fontSize:'var(--fs-xs)', color:'var(--text-muted)', marginLeft:'8px' }}>in {s.parent}</span>}
                    </div>
                    {s.type === 'category' && <span style={{ fontSize:'var(--fs-xs)', background:'var(--blush-light)', color:'var(--rose)', padding:'3px 10px', borderRadius:'12px', fontWeight:600 }}>Category</span>}
                    {s.type === 'subcategory' && <span style={{ fontSize:'var(--fs-xs)', background:'var(--cream)', color:'var(--text-light)', padding:'3px 10px', borderRadius:'12px' }}>Subcategory</span>}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color:'var(--text-muted)', flexShrink:0 }}><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Category Pills */}
            {!searchQ && (
              <div style={{ marginTop:'16px', display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center' }}>
                {categories.slice(0, 6).map(cat => (
                  <button key={cat.id} onClick={() => handleSuggestion(`/shop?category=${cat.id}`)}
                    style={{ padding:'8px 18px', background:'rgba(255,255,255,0.9)', border:'none', borderRadius:'50px', cursor:'pointer', fontSize:'var(--fs-sm)', fontWeight:500, color:'var(--dark)', backdropFilter:'blur(4px)', transition:'all 0.2s' }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.background='var(--rose)'; (e.target as HTMLElement).style.color='white' }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background='rgba(255,255,255,0.9)'; (e.target as HTMLElement).style.color='var(--dark)' }}>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
