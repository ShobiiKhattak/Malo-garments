import { useEffect, useState } from 'react'
import { useInView } from './Reveal'

interface Props { to: number; decimals?: number; prefix?: string; suffix?: string; duration?: number; group?: boolean }

/** Counts up from 0 the first time it scrolls into view. */
export default function CountUp({ to, decimals = 0, prefix = '', suffix = '', duration = 1600, group = false }: Props) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.4)
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!seen) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setVal(to * (1 - Math.pow(1 - p, 3))) // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to, duration])

  const text = group ? Math.round(val).toLocaleString('en-PK') : val.toFixed(decimals)
  return <span ref={ref}>{prefix}{text}{suffix}</span>
}
