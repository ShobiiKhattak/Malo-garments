import { useEffect, useState } from 'react'
import { ANNOUNCEMENTS } from '../../data/homeContent'

/** Top promo strip. Shows all offers side by side on desktop, and rotates
 *  through them on phones. Tapping a code copies it. It slides away on scroll. */
export default function AnnouncementBar() {
  const [idx, setIdx] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setIdx(v => (v + 1) % ANNOUNCEMENTS.length), 3500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const copy = (code: string) => {
    try { navigator.clipboard?.writeText(code) } catch { /* clipboard unavailable */ }
    setCopied(code)
    setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className={`announce ${hidden ? 'hide' : ''}`} role="region" aria-label="Offers">
      {ANNOUNCEMENTS.map((a, i) => (
        <button key={a.code} className={`announce-item ${i === idx ? 'active' : ''}`} onClick={() => copy(a.code)} title="Tap to copy code">
          <span>{a.text}</span>
          <b>{copied === a.code ? 'COPIED ✓' : `USE CODE ${a.code}`}</b>
        </button>
      ))}
    </div>
  )
}
