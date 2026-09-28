import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Reveal from '../components/home/Reveal'
import InfoHero from '../components/info/InfoHero'
import { POLICIES, POLICY_LINKS } from '../data/policies'
import type { Block } from '../data/policies'
import { STORE } from '../data/homeContent'

const HERO_ICON: Record<string, string> = { returns: '🔁', shipping: '🚚', privacy: '🔒', terms: '📜', faq: '💬' }

function BlockView({ b }: { b: Block }) {
  if (typeof b === 'string') return <p>{b}</p>
  if ('list' in b) return <ul className="ip-list">{b.list.map((li, i) => <li key={i} style={{ ['--i' as string]: i }}>{li}</li>)}</ul>
  return <div className="ip-note">{b.note}</div>
}

/** Thin bar at the top of the screen that fills as you read. */
function ReadingProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const on = () => {
      const h = document.documentElement
      setP(Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)))
    }
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return <div className="ip-progress" style={{ transform: `scaleX(${p})` }} aria-hidden="true" />
}

/** Highlights the table-of-contents entry for the section being read. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) setActive(vis[0].target.id)
    }, { rootMargin: '-25% 0px -60% 0px' })
    ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [ids])
  return active
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<number | null>(0)
  const shown = items.map((it, i) => ({ ...it, i })).filter(it => (it.q + it.a).toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div className="faq">
      <Reveal>
        <label className="faq-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search questions… e.g. delivery, exchange, size" aria-label="Search questions" />
        </label>
      </Reveal>
      {shown.length === 0 && <p className="faq-empty">No match — ask us on <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>.</p>}
      {shown.map(({ q: question, a, i }, n) => (
        <Reveal key={i} delay={Math.min(n, 6) * 60}>
          <div className={`faq-item ${open === i ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <span>{question}</span><i className="faq-ico" />
            </button>
            <div className="faq-a"><div><p>{a}</p></div></div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

export default function InfoPage({ slug }: { slug: string }) {
  const page = POLICIES[slug]
  const ids = useMemo(() => (page?.sections || []).map(s => s.id), [page])
  const active = useActiveSection(ids)
  useEffect(() => { if (page) document.title = `${page.title} — ${STORE.name}` }, [page])
  if (!page) return <Navigate to="/" replace />

  return (
    <div className="ip">
      <ReadingProgress />
      <InfoHero icon={HERO_ICON[slug] || '✨'} kicker={page.kicker} title={page.title} intro={page.intro} crumb={page.title}>
        <span className="ih-updated rise" style={{ ['--d' as string]: 520 }}>Last updated · {page.updated}</span>
      </InfoHero>

      <div className="container">
        <div className="ip-highlights">
          {page.highlights.map((h, i) => (
            <Reveal key={h.label} variant="up" delay={i * 110}>
              <div className="ip-hl">
                <span className="ip-hl-ico" aria-hidden="true">{h.icon}</span>
                <b>{h.label}</b>
                <small>{h.sub}</small>
              </div>
            </Reveal>
          ))}
        </div>

        {page.faq ? <Faq items={page.faq} /> : (
          <div className="ip-body">
            <aside className="ip-toc" aria-label="On this page">
              <span className="ip-toc-head">On this page</span>
              {page.sections.map((s, i) => (
                <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'on' : ''}
                  onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
                  <em>{String(i + 1).padStart(2, '0')}</em>{s.title}
                </a>
              ))}
            </aside>
            <div className="ip-sections">
              {page.sections.map((s, i) => (
                <Reveal key={s.id} delay={60}>
                  <section id={s.id} className="ip-sec">
                    <header>
                      <span className="ip-sec-ico" aria-hidden="true">{s.icon}</span>
                      <div><em>{String(i + 1).padStart(2, '0')}</em><h2>{s.title}</h2></div>
                    </header>
                    {s.body.map((b, j) => <BlockView key={j} b={b} />)}
                  </section>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        <Reveal variant="zoom">
          <div className="ip-cta">
            <span className="ip-cta-glow" aria-hidden="true" />
            <h3>Still have a question?</h3>
            <p>Our team replies {STORE.hours.replace(':', ',')}.</p>
            <div className="ip-cta-btns">
              <a className="btn btn-primary" href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(STORE.whatsappMessage)}`} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
              <Link className="btn btn-outline" to="/contact">Contact us</Link>
            </div>
          </div>
        </Reveal>

        <nav className="ip-more" aria-label="More help">
          {POLICY_LINKS.filter(l => l.to !== `/${slug}`).map(l => <Link key={l.to} to={l.to}>{l.label} <i>→</i></Link>)}
        </nav>
      </div>
    </div>
  )
}
