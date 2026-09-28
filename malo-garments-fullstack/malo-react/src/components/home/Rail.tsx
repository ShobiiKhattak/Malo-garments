import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/** Horizontal scroll-snap row with arrow buttons and mouse-drag scrolling. */
export default function Rail({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef({ down: false, x: 0, left: 0, moved: false })
  const [edge, setEdge] = useState({ start: true, end: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const go = (dir: number) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  const stop = () => {
    drag.current.down = false
    ref.current?.classList.remove('dragging')
  }

  return (
    <div className={`rail-wrap ${className}`}>
      <button className="rail-btn prev" aria-label="Previous" disabled={edge.start} onClick={() => go(-1)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <div
        ref={ref}
        className="rail"
        onScroll={update}
        onMouseDown={e => {
          const el = ref.current
          if (!el) return
          drag.current = { down: true, x: e.pageX, left: el.scrollLeft, moved: false }
        }}
        onMouseMove={e => {
          const el = ref.current
          if (!el || !drag.current.down) return
          const dx = e.pageX - drag.current.x
          if (Math.abs(dx) > 5) { drag.current.moved = true; el.classList.add('dragging') }
          if (drag.current.moved) el.scrollLeft = drag.current.left - dx
        }}
        onMouseUp={stop}
        onMouseLeave={stop}
        onClickCapture={e => {
          if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false }
        }}
      >
        {children}
      </div>
      <button className="rail-btn next" aria-label="Next" disabled={edge.end} onClick={() => go(1)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>
  )
}
