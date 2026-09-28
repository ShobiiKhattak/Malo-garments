import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { subscribeNewsletter } from '../../services/api'
import { ThemedLogo } from '../ui/Logo'
import { SPECIAL_LINKS, STORE } from '../../data/homeContent'
import { POLICY_LINKS } from '../../data/policies'
import { useCategories, categoryLink } from '../../hooks/useCategories'

/** Collapsible on phones, always open on desktop (handled in CSS).
 *  `dropdown`: on desktop too it stays closed and opens as a floating list. */
function Acc({ title, children, dropdown }: { title: string; children: ReactNode; dropdown?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // dropdown closes on an outside click or Esc
  useEffect(() => {
    if (!dropdown || !open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [dropdown, open])

  return (
    <div ref={ref} className={`f-acc ${dropdown ? 'dd' : ''} ${open ? 'open' : ''}`}>
      <button className="f-acc-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {title}<span className="f-acc-ico" />
      </button>
      <div className="f-acc-body"><div>{children}</div></div>
    </div>
  )
}

/** Optional in homeContent.ts — delete the `landline` line and "TEL" simply disappears. */
const LANDLINE = (STORE as { landline?: string }).landline

const Social = ({ href, label, children }: { href: string; label: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="f-social">{children}</a>
)

export default function Footer() {
  const { categories } = useCategories()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await subscribeNewsletter(email)
      setMsg('✓ Subscribed! Thank you.')
      setEmail('')
    } catch {
      setMsg('Already subscribed or invalid email.')
    }
  }

  return (
    <footer id="main-footer" className="footer">
      <div className="footer-grid">
        <div className="f-contact">
          <h4 className="f-head">Contact Us</h4>
          <ThemedLogo height={54} />
          <p>{STORE.address}</p>
          <p>PH: {STORE.phone}{LANDLINE && <> &nbsp;TEL: {LANDLINE}</>}</p>
          <div className="f-socials">
            <Social href={STORE.social.facebook} label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </Social>
            <Social href={STORE.social.instagram} label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></svg>
            </Social>
            <Social href={STORE.social.tiktok} label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V3a5 5 0 0 0 5 5" /></svg>
            </Social>
          </div>
        </div>

        <Acc title="Useful Links">
          <ul>
            {[['/about', 'About Us'], ['/contact', 'Contact Us'], ['/design-studio', 'Design Studio'], ['/cart', 'My Cart'], ['/account', 'My Account']].map(([to, label]) => (
              <li key={label}><Link to={to}>{label}</Link></li>
            ))}
          </ul>
        </Acc>

        <Acc title="Customer Care">
          <ul>
            {POLICY_LINKS.map(l => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}
          </ul>
        </Acc>

        <Acc title="Shop by Category" dropdown>
          <ul>
            <li><Link to={SPECIAL_LINKS[0].to}>{SPECIAL_LINKS[0].label}</Link></li>
            {categories.map(c => <li key={c.id}><Link to={categoryLink(c)}>{c.name}</Link></li>)}
            <li><Link to={SPECIAL_LINKS[1].to}>{SPECIAL_LINKS[1].label}</Link></li>
          </ul>
        </Acc>

        <Acc title="Sign Up to Newsletter">
          <p className="f-note">Subscribe to get 10% off your first order.</p>
          <form onSubmit={handleNewsletter} className="f-nl">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" required />
            <button type="submit">Join</button>
          </form>
          {msg && <p className="f-msg">{msg}</p>}
        </Acc>
      </div>
      <div className="f-copy">
        © {new Date().getFullYear()} {STORE.name}. All rights reserved.
        <span className="f-legal"><Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link> · <Link to="/returns">Returns</Link></span>
      </div>
    </footer>
  )
}
