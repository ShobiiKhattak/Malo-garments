import { useCallback, useEffect, useRef, useState } from 'react'
import SmartImage from '../home/SmartImage'

interface Props { images: string[]; name: string; tone?: number }

/** Vertical thumbnails + big image with hover-zoom, swipe, and a fullscreen lightbox. */
export default function ProductGallery({ images, name, tone = 0 }: Props) {
  const list = images.length ? images : ['']
  const [idx, setIdx] = useState(0)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const [lightbox, setLightbox] = useState(false)
  const touchX = useRef<number | null>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setIdx(0) }, [images.join('|')])

  const go = useCallback((n: number) => setIdx(((n % list.length) + list.length) % list.length), [list.length])

  // keep the active thumbnail in view
  useEffect(() => {
    const el = thumbsRef.current?.children[idx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [idx])

  // lightbox keyboard + scroll lock
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') go(idx + 1)
      if (e.key === 'ArrowLeft') go(idx - 1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [lightbox, idx, go])

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }

  return (
    <div className="pg">
      <div className="pg-thumbs-wrap">
        <div className="pg-thumbs" ref={thumbsRef}>
          {list.map((img, i) => (
            <button key={i} className={`pg-thumb ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} aria-label={`Image ${i + 1}`}>
              <SmartImage src={img} alt="" tone={tone + i} label=" " />
            </button>
          ))}
        </div>
      </div>

      <div
        className={`pg-main ${zoom ? 'zooming' : ''}`}
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
        onTouchStart={e => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1))
          touchX.current = null
        }}
      >
        <div className="pg-stage" key={idx} style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}>
          <SmartImage src={list[idx]} alt={name} tone={tone} label={name} eager />
        </div>

        <button className="pg-expand" aria-label="View fullscreen" onClick={() => setLightbox(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
        </button>
        {list.length > 1 && (
          <>
            <button className="pg-arrow prev" aria-label="Previous image" onClick={() => go(idx - 1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button className="pg-arrow next" aria-label="Next image" onClick={() => go(idx + 1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
            </button>
            <div className="pg-count">{idx + 1} / {list.length}</div>
          </>
        )}
      </div>

      {lightbox && (
        <div className="lb" onClick={() => setLightbox(false)} role="dialog" aria-modal="true" aria-label={`${name} images`}>
          <button className="lb-close" aria-label="Close" onClick={() => setLightbox(false)}>✕</button>
          {list.length > 1 && <button className="lb-nav prev" aria-label="Previous" onClick={e => { e.stopPropagation(); go(idx - 1) }}>‹</button>}
          <div className="lb-img" key={idx} onClick={e => e.stopPropagation()}>
            <SmartImage src={list[idx]} alt={name} tone={tone} label={name} eager />
          </div>
          {list.length > 1 && <button className="lb-nav next" aria-label="Next" onClick={e => { e.stopPropagation(); go(idx + 1) }}>›</button>}
          <div className="lb-count">{idx + 1} / {list.length}</div>
        </div>
      )}
    </div>
  )
}
