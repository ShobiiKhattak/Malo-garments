import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SmartImage from './SmartImage'
import { HERO_SLIDES } from '../../data/homeContent'

const INTERVAL = 6500

/** Big title where every letter drops in one after another. */
function SplitTitle({ text }: { text: string }) {
  let n = 0
  return (
    <h1 className="hero-title" aria-label={text}>
      {text.split(' ').map((word, wi) => (
        <span key={wi} className="hero-word" aria-hidden="true">
          {word.split('').map((ch, ci) => (
            <span key={ci} className="hero-char" style={{ ['--ci' as string]: n++ }}>{ch}</span>
          ))}
        </span>
      ))}
    </h1>
  )
}

export default function HeroSlider() {
  const [i, setI] = useState(0)
  const touchX = useRef<number | null>(null)
  const count = HERO_SLIDES.length

  // Restarts whenever the slide changes (manual click included).
  useEffect(() => {
    const t = setTimeout(() => setI(v => (v + 1) % count), INTERVAL)
    return () => clearTimeout(t)
  }, [i, count])

  const go = (n: number) => setI(((n % count) + count) % count)

  return (
    <section
      className="hero"
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1))
        touchX.current = null
      }}
    >
      {HERO_SLIDES.map((s, idx) => (
        <div key={idx} className={`hero-slide ${idx === i ? 'active' : ''}`} aria-hidden={idx !== i}>
          <div className="hero-bg"><SmartImage src={s.img} alt={s.title} tone={s.tone} label={s.title} eager={idx === 0} /></div>
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="hero-tag hero-anim" style={{ ['--d' as string]: 0 }}>{s.tag}</span>
            {idx === i ? <SplitTitle text={s.title} /> : <h1 className="hero-title">{s.title}</h1>}
            <p className="hero-desc hero-anim" style={{ ['--d' as string]: 500 }}>{s.desc}</p>
            <Link to={s.to} className="hero-cta hero-anim" style={{ ['--d' as string]: 700 }} tabIndex={idx === i ? 0 : -1}>
              {s.cta}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      ))}

      <div className="hero-dots">
        {HERO_SLIDES.map((_, idx) => (
          <button key={idx} className={`hero-dot ${idx === i ? 'active' : ''}`} aria-label={`Slide ${idx + 1}`} onClick={() => go(idx)}>
            {idx === i && <span key={i} style={{ animationDuration: `${INTERVAL}ms` }} />}
          </button>
        ))}
      </div>
    </section>
  )
}
