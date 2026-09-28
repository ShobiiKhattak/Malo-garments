import { Link } from 'react-router-dom'
import SmartImage from '../components/home/SmartImage'
import Reveal from '../components/home/Reveal'
import CountUp from '../components/home/CountUp'

const VALUES = [
  ['🧵', 'Quality Craftsmanship', 'Every piece is made with premium fabrics built to last.'],
  ['💗', 'Comfort First', 'We design for real bodies — soft fabrics, true-to-size fits.'],
  ['🌿', 'Honest & Sustainable', 'Transparent pricing and responsible sourcing.'],
]

const STATS = [
  { to: 15, suffix: 'K+', label: 'Happy Customers' },
  { to: 500, suffix: '+', label: 'Curated Styles' },
  { to: 4.8, decimals: 1, suffix: '★', label: 'Average Rating' },
  { to: 6, suffix: '', label: 'Years of Trust' },
]

export default function About() {
  return (
    <div>
      <section className="about-hero">
        <div className="about-hero-bg">
          <SmartImage src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&h=800&fit=crop" alt="Our Story" tone={0} quiet eager />
        </div>
        <div className="about-hero-shade" />
        <div className="about-hero-text">
          <span className="rise" style={{ ['--d' as string]: 100 }}>Est. 2020</span>
          <h1 className="rise" style={{ ['--d' as string]: 250 }}>Our Story</h1>
        </div>
      </section>

      <div className="container" style={{ paddingTop: 'var(--sp-3xl)', paddingBottom: 'var(--sp-4xl)' }}>
        <Reveal>
          <div style={{ maxWidth: '700px', margin: '0 auto var(--sp-3xl)', textAlign: 'center' }}>
            <span className="section-subtitle">Who we are</span>
            <h2 className="section-title" style={{ margin: 'var(--sp-md) 0 var(--sp-xl)' }}>Elegance, Comfort & Confidence</h2>
            <p style={{ color: 'var(--text-light)', lineHeight: 1.8, marginBottom: 'var(--sp-lg)' }}>Malo Garments began with a simple belief: every woman deserves clothing that makes her feel beautiful, comfortable, and confident — without compromise.</p>
            <p style={{ color: 'var(--text-light)', lineHeight: 1.8, marginBottom: 'var(--sp-lg)' }}>What started as a small boutique has grown into a beloved destination for elegant women's fashion and intimate apparel across Pakistan.</p>
            <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>Today, Malo Garments serves thousands of customers who trust us for quality, honest pricing, and a shopping experience as smooth as our fabrics.</p>
          </div>
        </Reveal>

        <div className="about-values">
          {VALUES.map(([icon, title, desc], i) => (
            <Reveal key={title} delay={i * 120}>
              <div className="value-card">
                <div className="value-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="about-stats">
          {STATS.map((s, i) => (
            <Reveal key={s.label} variant="zoom" delay={i * 100}>
              <div className="stat">
                <div className="stat-num"><CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} /></div>
                <p>{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="center">
          <Link to="/shop" className="btn btn-primary btn-lg">Shop Now</Link>
        </Reveal>
      </div>
    </div>
  )
}
