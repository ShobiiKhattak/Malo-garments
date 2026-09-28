import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../types'
import SmartImage from './SmartImage'
import Rail from './Rail'
import Reveal from './Reveal'
import SectionTitle from './SectionTitle'

const rs = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`

function LoveCard({ p, i }: { p: Product; i: number }) {
  const [liked, setLiked] = useState(false)
  const off = p.original_price > p.price ? Math.round((1 - p.price / p.original_price) * 100) : 0

  return (
    <Link to={`/product/${p.id}`} className="love-card">
      <div className="love-media">
        <SmartImage src={p.images?.[0]} alt={p.name} tone={i} label={p.name} />
        {p.images?.[1] && <div className="love-alt"><SmartImage src={p.images[1]} alt={p.name} tone={i} /></div>}
        {off > 0 && <span className="badge-off">-{off}%</span>}
        <button
          className={`wish ${liked ? 'on' : ''}`}
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={e => { e.preventDefault(); e.stopPropagation(); setLiked(v => !v) }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
        </button>
        <span className="love-quick">Select Options</span>
      </div>
      <h3 className="love-name">{p.name}</h3>
      <div className="love-price">
        <b>{rs(p.price)}</b>
        {off > 0 && <s>{rs(p.original_price)}</s>}
      </div>
    </Link>
  )
}

export default function MostLoved({ products }: { products: Product[] }) {
  if (!products.length) return null
  return (
    <section className="sec">
      <SectionTitle>Most Loved Designs</SectionTitle>
      <Reveal className="wrap-rail" delay={100}>
        <Rail>
          {products.map((p, i) => <LoveCard key={p.id} p={p} i={i} />)}
        </Rail>
      </Reveal>
      <Reveal className="center" delay={150}>
        <Link to="/shop" className="link-pill">View all products</Link>
      </Reveal>
    </section>
  )
}
