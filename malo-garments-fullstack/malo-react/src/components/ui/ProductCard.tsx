import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { showToast } from './Toast'
import SmartImage from '../home/SmartImage'
import Reveal from '../home/Reveal'
import type { Product } from '../../types'

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{display:'flex',alignItems:'center',gap:'2px'}}>
      {[1,2,3,4,5].map(i => (
        <i key={i} className={`star${rating>=i?' filled':rating>=i-0.5?' half':''}`} style={{fontStyle:'normal',fontSize:'0.75rem',color:rating>=i||rating>=i-0.5?'var(--gold)':'var(--text-muted)'}}>
          {rating>=i||rating>=i-0.5?'★':'☆'}
        </i>
      ))}
    </span>
  )
}

/** `index` only drives the stagger delay of the scroll-in animation. */
export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart } = useCart()
  const [liked, setLiked] = useState(false)
  const discount = product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0
  const to = `/product/${product.id}`

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images?.[0] || '',
      price: product.price,
      originalPrice: product.original_price,
      stock: product.stock,
      size: product.sizes?.[0] || '',
      color: product.colors?.[0]?.name || '',
      quantity: 1
    })
  }

  return (
    <Reveal delay={(index % 4) * 70}>
      <div className="product-card">
        <div className="pc-media">
          <Link to={to} className="product-card-link" aria-label={product.name}>
            <div className="product-card-image">
              <SmartImage src={product.images?.[0]} alt={product.name} tone={index} label={product.name} />
              {product.images?.[1] && <div className="pc-alt"><SmartImage src={product.images[1]} alt={product.name} tone={index} /></div>}
            </div>
          </Link>
          {discount > 0 && <span className="product-badge sale">-{discount}%</span>}
          {product.featured && <span className="product-badge featured">New</span>}
          <button
            className={`wish ${liked ? 'on' : ''}`}
            aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={() => setLiked(v => !v)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
          </button>
          <button className="pc-add" onClick={handleAddToCart}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Add to Cart
          </button>
        </div>
        <Link to={to} className="product-card-info">
          <h3 className="product-card-name">{product.name}</h3>
          <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <Stars rating={product.rating} />
            <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>({product.reviews})</span>
          </div>
          <div className="product-card-price">
            <span className="current-price">Rs. {Number(product.price).toLocaleString('en-PK')}</span>
            {product.original_price > product.price &&
              <span className="original-price">Rs. {Number(product.original_price).toLocaleString('en-PK')}</span>}
          </div>
        </Link>
      </div>
    </Reveal>
  )
}
