import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '../../services/api'
import SmartImage from './SmartImage'
import Reveal from './Reveal'
import { SHOWCASE_OVERRIDES, SHOWCASE_MAX_TILES } from '../../data/homeContent'
import { useCategories, categoryLink } from '../../hooks/useCategories'
import type { Category } from '../../types'

/** One banner + subcategory tiles per category — always in sync with Admin → Categories. */
export default function CategoryShowcase() {
  const { categories } = useCategories()
  const { data: products = [] } = useQuery({ queryKey: ['products', { sort: 'newest' }], queryFn: () => getProducts({ sort: 'newest' }) })

  const blocks = useMemo(() => categories.map((cat: Category, ci: number) => {
    const ov = SHOWCASE_OVERRIDES[cat.slug] || {}
    const inCat = products.filter(p => p.category_id === cat.id)
    const subs = (cat.subcategories || []).map(sub => {
      const items = inCat.filter(p => p.subcategory_id === sub.id)
      return { sub, count: items.length, photo: items[0]?.images?.[0] || '' }
    })
    // subcategories that already have products come first
    const tiles = [...subs].sort((a, b) => b.count - a.count).slice(0, SHOWCASE_MAX_TILES)
    return {
      cat, ci, ov,
      photo: ov.img || cat.image || inCat[0]?.images?.[0] || '',
      count: inCat.length,
      tiles,
    }
  }), [categories, products])

  if (!blocks.length) return null

  return (
    <section className="wrap showcases">
      {blocks.map(({ cat, ci, ov, photo, count, tiles }) => (
        <div className="showcase" key={cat.id}>
          <Reveal variant="clip">
            <Link to={categoryLink(cat)} className="sc-banner zoom">
              <SmartImage src={photo} alt={cat.name} tone={ci} quiet />
              <div className="sc-banner-shade" />
              <div className="sc-banner-text" style={{ color: '#fff' }}>
                <h2 className={`sc-title ${ov.style || (ci % 2 ? 'caps' : 'italic')}`}>{ov.title || cat.name}</h2>
                <p>{ov.sub || (count ? `${count} style${count > 1 ? 's' : ''} to explore` : 'New styles coming soon')}</p>
                <span className="sc-shop">Shop now <i /></span>
              </div>
            </Link>
          </Reveal>
          {tiles.length > 0 && (
            <div className="sc-tiles" style={{ ['--n' as string]: tiles.length }}>
              {tiles.map(({ sub, photo: tilePhoto }, i) => {
                const t = ov.tiles?.[sub.slug]
                return (
                  <Reveal key={sub.id} variant="up" delay={(i % 2) * 90}>
                    <Link to={categoryLink(cat, sub)} className="sc-tile zoom">
                      <SmartImage src={t?.img || tilePhoto} alt={sub.name} tone={ci + i} label={sub.name} />
                      <div className="sc-tile-label">
                        <b>{t?.title || sub.name}</b>
                        <span>Shop now</span>
                      </div>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
