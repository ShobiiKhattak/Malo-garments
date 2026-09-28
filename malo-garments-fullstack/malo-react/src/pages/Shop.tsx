import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getProducts } from '../services/api'
import ProductCard from '../components/ui/ProductCard'
import { useCategories, findCategory, findSubcategory } from '../hooks/useCategories'
import type { Category } from '../types'

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [visible, setVisible] = useState(9)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // The URL is the single source of truth — a category link from the menu / footer / home works instantly.
  // `category` / `subcategory` may be a slug (new links) or an id (old links).
  const category    = searchParams.get('category') || ''
  const subcategory = searchParams.get('subcategory') || ''
  const sale        = searchParams.get('sale') === 'true'
  const q           = searchParams.get('q') || ''
  const sort        = searchParams.get('sort') || 'default'
  const size        = searchParams.get('size') || ''
  const maxPrice    = Number(searchParams.get('maxPrice')) || undefined

  const { categories } = useCategories()
  const catObj = findCategory(categories, category)
  const subObj = findSubcategory(catObj, subcategory)

  useEffect(() => { setVisible(9) }, [category, subcategory, sale, q, sort, size, maxPrice])

  const filters = { category: catObj?.id ?? category, subcategory: subObj?.id ?? subcategory, sale, q, sort, size, maxPrice }

  const { data: products = [], isLoading, isPlaceholderData } = useQuery({
    queryKey: ['products', filters],
    queryFn:  () => getProducts(filters),
    placeholderData: keepPreviousData,
  })

  // Merge changes into the URL; empty values remove the param
  const setParams = (changes: Record<string, string>) => {
    const next: Record<string, string> = Object.fromEntries(searchParams.entries())
    Object.entries(changes).forEach(([k, v]) => { if (v) next[k] = v; else delete next[k] })
    setSearchParams(next)
  }
  const updateParam = (key: string, val: string) => setParams(key === 'category' ? { category: val, subcategory: '' } : { [key]: val })
  const clearFilters = () => { setSearchParams({}); setVisible(9) }

  const hasFilters = !!(category || subcategory || sale || q || size || maxPrice)
  const title = subObj?.name || catObj?.name || (q ? `Results for “${q}”` : sale ? 'Sale' : maxPrice ? `Under Rs. ${maxPrice.toLocaleString('en-PK')}` : 'Shop All')
  const gridKey = [filters.category, filters.subcategory, q, sale, sort, size, maxPrice].join('|')

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .shop-layout { grid-template-columns: 1fr !important; }
          .shop-desktop-sidebar { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
        }
      `}</style>

      <div className="page-header">
        <div className="container">
          <h1 key={title}>{title}</h1>
          <div className="breadcrumb">
            <Link to="/">Home</Link><span className="separator">/</span>
            {catObj
              ? <>
                  <Link to="/shop">Shop</Link><span className="separator">/</span>
                  {subObj
                    ? <><Link to={`/shop?category=${catObj.slug}`}>{catObj.name}</Link><span className="separator">/</span><span className="current">{subObj.name}</span></>
                    : <span className="current">{catObj.name}</span>}
                </>
              : <span className="current">Shop</span>}
          </div>
        </div>
      </div>

      {/* ── Category chips: jump straight to any category ── */}
      <div className="chip-bar-wrap">
        <div className="container">
          <div className="chip-bar">
            <button className={`chip ${!catObj && !sale ? 'active' : ''}`} onClick={() => setSearchParams({})}>All</button>
            {categories.map(c => (
              <button key={c.id} className={`chip ${catObj?.id === c.id ? 'active' : ''}`} onClick={() => setParams({ category: c.slug, subcategory: '', q: '' })}>{c.name}</button>
            ))}
            <button className={`chip sale ${sale ? 'active' : ''}`} onClick={() => setParams({ sale: sale ? '' : 'true' })}>Sale</button>
          </div>
          <div className={`sub-bar ${catObj?.subcategories?.length ? 'open' : ''}`}>
            <div className="chip-bar">
              {catObj && (
                <>
                  <button className={`chip small ${!subObj ? 'active' : ''}`} onClick={() => setParams({ subcategory: '' })}>All {catObj.name}</button>
                  {catObj.subcategories?.map(s => (
                    <button key={s.id} className={`chip small ${subObj?.id === s.id ? 'active' : ''}`} onClick={() => setParams({ subcategory: s.slug })}>{s.name}</button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop:'var(--sp-xl)', paddingBottom:'var(--sp-4xl)' }}>
        <div className="shop-layout" style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'var(--sp-2xl)', alignItems:'start' }}>

          {/* ── Desktop Sidebar ── */}
          <aside className="shop-desktop-sidebar" style={{ background:'var(--white)', borderRadius:'var(--border-radius-lg)', border:'1px solid var(--border-light)', padding:'var(--sp-xl)', position:'sticky', top:'calc(var(--navbar-height) + 20px)' }}>
            <SidebarContent
              categories={categories}
              catId={catObj?.id || ''}
              subId={subObj?.id || ''}
              sale={sale}
              size={size}
              setParams={setParams}
              updateParam={updateParam}
              clearFilters={clearFilters}
              hasFilters={hasFilters}
            />
          </aside>

          {/* ── Mobile Sidebar Overlay ── */}
          {sidebarOpen && (
            <div className="filter-overlay" onClick={()=>setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(20,12,16,0.5)', zIndex:1200, display:'flex' }}>
              <div className="filter-panel" onClick={e=>e.stopPropagation()} style={{ width:'min(86vw,320px)', background:'var(--white)', height:'100%', overflowY:'auto', padding:'var(--sp-xl)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--sp-lg)' }}>
                  <h3 style={{ fontWeight:600 }}>Filters</h3>
                  <button onClick={()=>setSidebarOpen(false)} style={{ background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer' }}>✕</button>
                </div>
                <SidebarContent
                  categories={categories}
                  catId={catObj?.id || ''}
                  subId={subObj?.id || ''}
                  sale={sale}
                  size={size}
                  setParams={setParams}
                  updateParam={updateParam}
                  clearFilters={clearFilters}
                  hasFilters={hasFilters}
                  onApply={()=>setSidebarOpen(false)}
                />
              </div>
            </div>
          )}

          {/* ── Products ── */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-xl)', flexWrap:'wrap', gap:'var(--sp-md)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-md)' }}>
                <button
                  className="mobile-filter-btn"
                  onClick={()=>setSidebarOpen(true)}
                  style={{ display:'none', alignItems:'center', gap:'6px', padding:'8px 16px', border:'1.5px solid var(--border)', borderRadius:'50px', cursor:'pointer', fontSize:'var(--fs-sm)', background:'var(--white)', fontFamily:'var(--font-body)', color:'var(--text)' }}>
                  🔧 Filters {hasFilters && <span style={{ background:'var(--rose)', color:'white', borderRadius:'50%', width:'18px', height:'18px', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700 }}>!</span>}
                </button>
                <span style={{ color:'var(--text-light)', fontSize:'var(--fs-sm)' }}>
                  <strong>{products.length}</strong> product{products.length !== 1 ? 's' : ''} found
                  {catObj && <span style={{ color:'var(--rose)', marginLeft:'6px' }}>in {subObj ? `${catObj.name} › ${subObj.name}` : catObj.name}</span>}
                </span>
              </div>
              <select value={sort} onChange={e=>updateParam('sort', e.target.value)} className="form-select" style={{ width:'auto' }}>
                <option value="default">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {isLoading ? (
              <div className="product-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <div className="skel" style={{ aspectRatio:'3/4', borderRadius:14 }} />
                    <div className="skel" style={{ height:12, width:'80%', borderRadius:6, marginTop:12 }} />
                    <div className="skel" style={{ height:12, width:'45%', borderRadius:6, marginTop:8 }} />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No products found</h3>
                <p>{catObj ? `Nothing in ${subObj?.name || catObj.name} yet — check back soon or browse another category.` : 'Try adjusting your filters or search terms.'}</p>
                <button className="btn btn-outline" onClick={clearFilters}>Clear All Filters</button>
              </div>
            ) : (
              <>
                <div key={gridKey} className={`product-grid grid-swap ${isPlaceholderData ? 'is-fetching' : ''}`}>
                  {products.slice(0, visible).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </div>
                {visible < products.length && (
                  <div style={{ textAlign:'center', marginTop:'var(--sp-2xl)' }}>
                    <button className="btn btn-outline" onClick={()=>setVisible(v=>v+9)}>
                      Load More ({products.length - visible} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Sidebar extracted as a separate named function (not inside render) ────────
interface SidebarContentProps {
  categories: Category[]
  catId: string
  subId: string
  sale: boolean
  size: string
  setParams: (changes: Record<string, string>) => void
  updateParam: (key: string, val: string) => void
  clearFilters: () => void
  hasFilters: boolean
  onApply?: () => void
}

function SidebarContent({ categories, catId, subId, sale, size, setParams, updateParam, clearFilters, hasFilters, onApply }: SidebarContentProps) {
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--sp-lg)' }}>
        <h3 style={{ fontFamily:'var(--font-body)', fontWeight:600, fontSize:'var(--fs-md)' }}>Filters</h3>
        {hasFilters && (
          <button onClick={clearFilters} style={{ background:'none', border:'none', color:'var(--rose)', cursor:'pointer', fontSize:'var(--fs-xs)', fontWeight:600 }}>Clear All</button>
        )}
      </div>

      {/* ── Category (+ its subcategories, expanding smoothly) ── */}
      <div style={{ marginBottom:'var(--sp-xl)' }}>
        <p style={{ fontWeight:600, fontSize:'var(--fs-xs)', marginBottom:'var(--sp-md)', textTransform:'uppercase', letterSpacing:'1px', color:'var(--text-muted)' }}>Category</p>

        <label className="sidebar-radio-label" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', borderRadius:'var(--border-radius)', cursor:'pointer', marginBottom:'4px', background: !catId ? 'rgba(201,123,123,0.08)' : 'transparent' }}>
          <input type="radio" name="shopCat" checked={!catId} onChange={() => { updateParam('category', ''); onApply?.() }} style={{ accentColor:'var(--rose)' }} />
          <span style={{ fontSize:'var(--fs-sm)', fontWeight: !catId ? 600 : 400, color: !catId ? 'var(--rose)' : 'var(--text)' }}>All Categories</span>
        </label>

        {categories.map(cat => {
          const active = catId === cat.id
          return (
            <div key={cat.id}>
              <label className="sidebar-radio-label" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', borderRadius:'var(--border-radius)', cursor:'pointer', marginBottom:'4px', background: active ? 'rgba(201,123,123,0.08)' : 'transparent' }}>
                <input type="radio" name="shopCat" checked={active} onChange={() => { updateParam('category', cat.slug); if (!cat.subcategories?.length) onApply?.() }} style={{ accentColor:'var(--rose)' }} />
                <span style={{ fontSize:'var(--fs-sm)', fontWeight: active ? 600 : 400, color: active ? 'var(--rose)' : 'var(--text)' }}>{cat.name}</span>
              </label>
              <div className={`side-subs ${active ? 'open' : ''}`}>
                <div>
                  {cat.subcategories?.map(s => (
                    <button key={s.id} className={`side-sub ${subId === s.id ? 'active' : ''}`} onClick={() => { setParams({ subcategory: subId === s.id ? '' : s.slug }); onApply?.() }}>{s.name}</button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Size ── */}
      <div style={{ marginBottom:'var(--sp-xl)' }}>
        <p style={{ fontWeight:600, fontSize:'var(--fs-xs)', marginBottom:'var(--sp-md)', textTransform:'uppercase', letterSpacing:'1px', color:'var(--text-muted)' }}>Size</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
          {SIZES.map(sz => (
            <button key={sz} className="opt" onClick={() => updateParam('size', size === sz ? '' : sz)}
              style={{ padding:'6px 14px', border:`1.5px solid ${size === sz ? 'var(--rose)' : 'var(--border)'}`, borderRadius:'var(--border-radius)', fontSize:'var(--fs-xs)', fontWeight:500, color: size === sz ? 'var(--rose)' : 'var(--text)', cursor:'pointer', background: size === sz ? 'rgba(201,123,123,0.05)' : 'var(--white)' }}>
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sale ── */}
      <div style={{ marginBottom:'var(--sp-xl)' }}>
        <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', padding:'8px 10px', borderRadius:'var(--border-radius)', background: sale ? 'rgba(201,123,123,0.08)' : 'transparent', transition:'background 0.15s' }}>
          <input type="checkbox" checked={sale} onChange={e => updateParam('sale', e.target.checked ? 'true' : '')} style={{ accentColor:'var(--rose)', width:'16px', height:'16px' }} />
          <span style={{ fontSize:'var(--fs-sm)', fontWeight: sale ? 600 : 400, color: sale ? 'var(--rose)' : 'var(--text)' }}>🏷️ Sale Items Only</span>
        </label>
      </div>

      {hasFilters && (
        <button onClick={clearFilters} style={{ width:'100%', padding:'10px', border:'1.5px solid var(--border)', borderRadius:'var(--border-radius)', cursor:'pointer', fontSize:'var(--fs-sm)', color:'var(--error)', background:'var(--error-bg)', fontWeight:500 }}>
          ✕ Clear All Filters
        </button>
      )}
    </div>
  )
}
