import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '../../services/api'
import SmartImage from './SmartImage'
import Rail from './Rail'
import Reveal from './Reveal'
import SectionTitle from './SectionTitle'
import { BUNDLES, MARQUEE, TOOLS, VIDEOS } from '../../data/homeContent'
import { useCategories, categoryLink } from '../../hooks/useCategories'
import type { VideoItem } from '../../data/homeContent'

/* ── Slim scrolling text strip ───────────────────────────────────────── */
export function Marquee() {
  const items = [...MARQUEE, ...MARQUEE]
  return (
    <div className="marquee" aria-label={MARQUEE.join(', ')}>
      <div className="marquee-track" aria-hidden="true">
        {items.map((t, i) => <span key={i}>{t}<em>✦</em></span>)}
      </div>
    </div>
  )
}

/* ── Value Bundles / Under 999 ───────────────────────────────────────── */
export function Bundles() {
  // same query as the rest of the home page, so no extra download
  const { data: products = [] } = useQuery({ queryKey: ['products', { sort: 'newest' }], queryFn: () => getProducts({ sort: 'newest' }) })
  return (
    <section className="wrap sec-tight">
      <div className="bundles">
        {BUNDLES.map((b, i) => {
          // 3 portrait product photos side by side fill the wide tile without cropping heads/feet
          const photos = (b.imgs?.length ? b.imgs : products.filter(b.match).map(p => p.images?.[0]).filter(Boolean) as string[]).slice(0, 3)
          return (
            <Reveal key={b.title} variant="zoom" delay={i * 120}>
              <Link to={b.to} className={`bundle zoom ${photos.length ? 'has-photos' : ''}`} style={{ background: b.bg, color: photos.length ? '#fff' : b.ink }}>
                {photos.length ? (
                  <>
                    <div className="bundle-photos" style={{ ['--n' as string]: photos.length }}>
                      {photos.map((src, j) => <SmartImage key={j} src={src} alt="" tone={i + j} quiet />)}
                    </div>
                    <div className="bundle-shade" />
                  </>
                ) : (
                  <>
                    <span className="bundle-orb o1" style={{ background: b.ink }} />
                    <span className="bundle-orb o2" style={{ background: b.ink }} />
                  </>
                )}
                <h3>{b.title}</h3>
                <span className="bundle-cta" style={{ borderColor: photos.length ? '#fff' : b.ink }}>{b.cta}</span>
              </Link>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

/* ── Shop by category rail (real categories) ─────────────────────────── */
export function ScrollTiles() {
  const { categories } = useCategories()
  if (!categories.length) return null
  return (
    <section className="sec-tight">
      <Reveal className="wrap-rail">
        <Rail>
          {categories.map((c, i) => (
            <Link key={c.id} to={categoryLink(c)} className="tall-tile zoom">
              <SmartImage src={c.image} alt={c.name} tone={i} label={c.name} />
              <h3>{c.name}</h3>
            </Link>
          ))}
        </Rail>
      </Reveal>
    </section>
  )
}

/* ── Calculator / tracker cards ──────────────────────────────────────── */
const ICONS = {
  ruler: (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
      <path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2" />
    </svg>
  ),
  calendar: (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M12 19.5s-3-1.9-3-3.9a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 2-3 3.9-3 3.9Z" />
    </svg>
  ),
}

export function Tools() {
  return (
    <section className="wrap sec-tight">
      <div className="tools">
        {TOOLS.map((t, i) => (
          <Reveal key={t.title} variant={i ? 'right' : 'left'}>
            <Link to={t.to} className="tool" style={{ background: t.bg }}>
              <div>
                <h3>{t.title}</h3>
                <p>{t.hint}</p>
              </div>
              <span className="tool-icon">{ICONS[t.icon]}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ── Watch & Buy ─────────────────────────────────────────────────────── */
const rs = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`

function VideoCard({ v }: { v: VideoItem }) {
  const ref = useRef<HTMLVideoElement>(null)
  const boxRef = useRef<HTMLAnchorElement>(null)
  const [playing, setPlaying] = useState(false)
  const off = v.oldPrice > v.price ? Math.round((1 - v.price / v.oldPrice) * 100) : 0

  // Play only while the card is on screen — saves data and battery.
  useEffect(() => {
    const vid = ref.current
    const box = boxRef.current
    if (!vid || !box || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) vid.play().then(() => setPlaying(true)).catch(() => {})
      else { vid.pause(); setPlaying(false) }
    }, { threshold: 0.6 })
    io.observe(box)
    return () => io.disconnect()
  }, [])

  return (
    <Link to={v.to} className="vid-card" ref={boxRef}>
      <div className="vid-media">
        <SmartImage src={v.poster} alt={v.name} tone={v.tone} label={v.name} />
        {v.video && (
          <video ref={ref} src={v.video} poster={v.poster || undefined} muted loop playsInline preload="metadata" className={playing ? 'on' : ''} />
        )}
        {!playing && <span className="vid-play"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>}
      </div>
      <div className="vid-info">
        <span className="vid-thumb"><SmartImage src={v.poster} alt="" tone={v.tone} label=" " /></span>
        <div>
          <b>{v.name}</b>
          <div className="vid-price">{rs(v.price)} {off > 0 && <s>{rs(v.oldPrice)}</s>}</div>
          {off > 0 && <span className="vid-off">{off}% off</span>}
        </div>
      </div>
    </Link>
  )
}

export function WatchAndBuy() {
  // Hidden until real videos / photos are added in data/homeContent.ts
  const items = VIDEOS.filter(v => v.video || v.poster)
  if (!items.length) return null
  return (
    <section className="sec">
      <SectionTitle>Watch and Buy</SectionTitle>
      <Reveal className="wrap-rail" delay={100}>
        <Rail>
          {items.map(v => <VideoCard key={v.name} v={v} />)}
        </Rail>
      </Reveal>
    </section>
  )
}
