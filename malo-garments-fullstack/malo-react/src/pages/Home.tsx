import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProducts, subscribeNewsletter } from '../services/api'
import { showToast } from '../components/ui/Toast'
import HeroSlider from '../components/home/HeroSlider'
import MostLoved from '../components/home/MostLoved'
import CategoryShowcase from '../components/home/CategoryShowcase'
import Reveal from '../components/home/Reveal'
import SectionTitle from '../components/home/SectionTitle'
import { Marquee, Bundles, ScrollTiles, Tools, WatchAndBuy } from '../components/home/ExtraSections'
import { TESTIMONIALS } from '../data/homeContent'

export default function Home() {
  const [nlEmail, setNlEmail] = useState('')
  const [nlLoading, setNlLoading] = useState(false)

  const { data: products = [] } = useQuery({ queryKey: ['products', { sort: 'newest' }], queryFn: () => getProducts({ sort: 'newest' }) })

  // Only real products from the admin panel: featured ones first, then the newest.
  const featured = products.filter(p => p.featured)
  const rest = products.filter(p => !p.featured)
  const loved = [...featured, ...rest].slice(0, 12)

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nlEmail) return
    setNlLoading(true)
    try {
      await subscribeNewsletter(nlEmail)
      showToast('Subscribed! Thank you for joining.', 'success')
      setNlEmail('')
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Something went wrong.'
      if (msg.includes('already')) showToast('This email is already subscribed.', 'info')
      else showToast(msg, 'error')
    } finally { setNlLoading(false) }
  }

  return (
    <>
      <HeroSlider />
      <Marquee />
      <MostLoved products={loved} />
      <CategoryShowcase />
      <Bundles />
      <ScrollTiles />
      <Tools />
      <WatchAndBuy />

      {/* ── Customer love ── */}
      <section className="sec">
        <SectionTitle sub="What our customers say">Customer Love</SectionTitle>
        <div className="wrap">
          <div className="testimonials">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 120}>
                <figure className="testi">
                  <span className="testi-quote">“</span>
                  <blockquote>{t.text}</blockquote>
                  <figcaption><b>{t.name}</b><span>{t.role}</span></figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="newsletter">
        <Reveal className="newsletter-inner">
          <h2>Join Our Newsletter</h2>
          <p>Subscribe and get <strong>10% off</strong> your first order — new arrivals and exclusive deals every week.</p>
          <form onSubmit={handleNewsletter} className="nl-pill">
            <input type="email" value={nlEmail} onChange={e => setNlEmail(e.target.value)} placeholder="Enter your email address" required />
            <button type="submit" disabled={nlLoading}>{nlLoading ? '...' : 'Subscribe'}</button>
          </form>
        </Reveal>
      </section>
    </>
  )
}
