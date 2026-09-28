import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

export function useInView<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect() }
    }, { threshold, rootMargin: '0px 0px -6% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen] as const
}

interface Props {
  children: ReactNode
  variant?: 'up' | 'left' | 'right' | 'zoom' | 'clip' | 'fade'
  delay?: number // ms
  className?: string
  style?: CSSProperties
}

/** Fades/slides its children in the first time they scroll into view. */
export default function Reveal({ children, variant = 'up', delay = 0, className = '', style }: Props) {
  const [ref, seen] = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`reveal reveal-${variant} ${seen ? 'in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  )
}
