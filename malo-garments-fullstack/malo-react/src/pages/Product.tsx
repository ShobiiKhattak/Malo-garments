import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProductById, getProducts, getSizeRecommendation, type SizeRecommendation } from '../services/api'
import { useCart } from '../context/CartContext'
import { showToast } from '../components/ui/Toast'
import ProductCard from '../components/ui/ProductCard'
import Reveal from '../components/home/Reveal'
import SmartImage from '../components/home/SmartImage'
import ProductGallery from '../components/product/ProductGallery'
import Accordion from '../components/product/Accordion'
import { useCategories, categoryLink } from '../hooks/useCategories'
import type { Product as ProductT } from '../types'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`

// Which measurements make sense to ask for. Decided from the subcategory / category slug
// so it keeps working whatever ids the database uses.
type MeasureField = 'bust' | 'waist' | 'hip' | 'underbust'
const FIELD_LABEL: Record<MeasureField, string> = { bust: 'Bust', waist: 'Waist', hip: 'Hip', underbust: 'Underbust' }

function measureFieldsFor(catSlug = '', subSlug = ''): MeasureField[] | undefined {
  const s = `${catSlug} ${subSlug}`
  if (/lingerie|bodysuit|bridal|lace-sets|satin-sets/.test(s)) return ['underbust', 'bust', 'waist', 'hip']
  if (/bra/.test(s) && !/sports-t|t-shirts/.test(s)) return ['underbust', 'bust']
  if (/panties|underwear|shapewear|cincher|skirts|jeans|trousers|leggings|shorts/.test(s)) return ['waist', 'hip']
  if (/dress|kurti|nightie|night-dress|suits|abaya/.test(s)) return ['bust', 'waist', 'hip']
  if (/tops|shirts|blouse|camisole|slips|pajama|night-suits|robes|t-shirt/.test(s)) return ['bust', 'waist']
  return undefined
}

/** Every colour × size combination of a product, for the "bought together" pickers. */
const variantsOf = (p: ProductT) => {
  const colors = p.colors?.length ? p.colors.map(c => c.name) : ['']
  const sizes = p.sizes?.length ? p.sizes : ['']
  return colors.flatMap(color => sizes.map(size => ({ color, size, label: [color, size].filter(Boolean).join(' / ') || 'Standard' })))
}
type Variant = ReturnType<typeof variantsOf>[number]

const TRUST = [
  { t: 'Free delivery', d: 'above Rs. 5,000', icon: <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" /> },
  { t: 'Cash on delivery', d: 'pay when it arrives', icon: <path d="M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /> },
  { t: 'Easy exchange', d: 'within 7 days', icon: <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /> },
]

export default function Product() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [selSize, setSelSize] = useState('')
  const [selColor, setSelColor] = useState('')
  const [qty, setQty] = useState(1)
  const [openSec, setOpenSec] = useState<string>('description')
  const [measurements, setMeasurements] = useState<Record<MeasureField, string>>({ bust: '', waist: '', hip: '', underbust: '' })
  const [sizeRec, setSizeRec] = useState<SizeRecommendation | null>(null)
  const [sizeLoading, setSizeLoading] = useState(false)
  const [fbtOff, setFbtOff] = useState<Set<string>>(new Set())
  const [fbtVariant, setFbtVariant] = useState<Record<string, number>>({})

  const { data: product, isLoading } = useQuery({ queryKey: ['product', id], queryFn: () => getProductById(id as string), enabled: !!id })
  const { categories } = useCategories()

  useEffect(() => {
    if (product) {
      setSelSize(product.sizes?.[0] || '')
      setSelColor(product.colors?.[0]?.name || '')
      setQty(1)
      setFbtOff(new Set())
      setFbtVariant({})
      setSizeRec(null)
    }
  }, [product])

  const { data: related = [] } = useQuery({ queryKey: ['products', { category: product?.category_id }], queryFn: () => getProducts({ category: product?.category_id }), enabled: !!product?.category_id })

  const category = categories.find(c => c.id === product?.category_id)
  const subcategory = category?.subcategories?.find(s => s.id === product?.subcategory_id)
  const sizeFields = product ? measureFieldsFor(category?.slug, subcategory?.slug) : undefined

  const others = useMemo(() => related.filter(p => p.id !== id && p.stock > 0).slice(0, 2), [related, id])

  const toggleSec = (s: string) => setOpenSec(cur => (cur === s ? '' : s))
  const openSizeGuide = () => {
    setOpenSec('size')
    setTimeout(() => document.getElementById('acc-size')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
  }

  const findSize = async () => {
    if (!product || !sizeFields) return
    const parsed = Object.fromEntries(sizeFields.map(f => [f, parseFloat(measurements[f]) || undefined]))
    if (!Object.values(parsed).some(Boolean)) return
    setSizeLoading(true)
    try {
      const r = await getSizeRecommendation({
        productName: product.name,
        category: category?.name || '',
        subcategory: subcategory?.name || '',
        sizes: product.sizes || [],
        measurements: parsed,
      })
      setSizeRec(r)
    } catch {
      showToast('Could not get a size recommendation right now.', 'error')
    } finally { setSizeLoading(false) }
  }

  const add = (p: ProductT, size: string, color: string, quantity = 1) =>
    addToCart({ productId: p.id, name: p.name, image: p.images?.[0] || '', price: p.price, originalPrice: p.original_price, stock: p.stock, size, color, quantity })

  const handleAddToCart = () => {
    if (!product) return
    add(product, selSize, selColor, qty)
  }

  if (isLoading) return (
    <div className="container" style={{ padding: 'var(--sp-2xl) var(--sp-md)' }}>
      <div className="pd-layout">
        <div className="skel" style={{ aspectRatio: '3/4', borderRadius: 16 }} />
        <div>{[70, 40, 30, 90, 60].map((w, i) => <div key={i} className="skel" style={{ height: i === 0 ? 34 : 18, width: `${w}%`, borderRadius: 8, marginBottom: 18 }} />)}</div>
      </div>
    </div>
  )
  if (!product) return <div style={{ textAlign: 'center', padding: 'var(--sp-4xl)' }}>Product not found. <Link to="/shop">Back to Shop</Link></div>

  const discount = product.original_price > product.price ? Math.round((1 - product.price / product.original_price) * 100) : 0
  const stockStatus = product.stock <= 0 ? 'out' : product.stock <= 5 ? 'low' : 'in'
  const stockLabel = product.stock <= 0 ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left — order soon` : 'In stock, ready to ship'

  // "Frequently bought together" maths
  const fbtItems: { p: ProductT; self: boolean; v: Variant | null; vs: Variant[] }[] = [
    { p: product, self: true, v: null, vs: [] },
    ...others.map(p => { const vs = variantsOf(p); return { p, self: false, v: vs[fbtVariant[p.id] ?? 0], vs } }),
  ]
  const checked = fbtItems.filter(i => !fbtOff.has(i.p.id))
  const fbtTotal = checked.reduce((n, i) => n + i.p.price, 0)
  const fbtWas = checked.reduce((n, i) => n + Math.max(i.p.original_price, i.p.price), 0)

  const addBundle = () => {
    if (!checked.length) return
    checked.forEach(i => i.self ? add(product, selSize, selColor, 1) : add(i.p, i.v?.size || '', i.v?.color || '', 1))
  }

  return (
    <div>
      <div className="container" style={{ paddingTop: 'var(--sp-lg)', paddingBottom: 'var(--sp-4xl)' }}>
        <div className="breadcrumb" style={{ justifyContent: 'flex-start', marginBottom: 'var(--sp-lg)', flexWrap: 'wrap' }}>
          <Link to="/">Home</Link><span className="separator">/</span>
          <Link to="/shop">Shop</Link><span className="separator">/</span>
          {category && <><Link to={categoryLink(category)}>{category.name}</Link><span className="separator">/</span></>}
          <span className="current">{product.name}</span>
        </div>

        <div className="pd-layout">
          {/* ── Gallery ── */}
          <Reveal variant="left" className="pd-gallery">
            <ProductGallery images={product.images || []} name={product.name} />
          </Reveal>

          {/* ── Info ── */}
          <Reveal variant="right" delay={120}>
            {category && <Link to={categoryLink(category, subcategory)} className="pd-cat">{subcategory ? `${category.name} › ${subcategory.name}` : category.name}</Link>}
            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-rating">
              <span className="pd-stars" aria-label={`${product.rating} out of 5`}>{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
              <button onClick={() => setOpenSec('reviews')}>{product.reviews} reviews</button>
            </div>

            <div className="pd-price">
              <b>{fmt(product.price)}</b>
              {product.original_price > product.price && <s>{fmt(product.original_price)}</s>}
              {discount > 0 && <span className="pd-off">-{discount}%</span>}
            </div>

            {product.colors?.length > 0 && (
              <div className="pd-field">
                <p>Color: <strong>{selColor}</strong></p>
                <div className="pd-chips">
                  {product.colors.map(c => (
                    <button key={c.name} className={`pd-chip ${selColor === c.name ? 'on' : ''}`} onClick={() => setSelColor(c.name)}>
                      <i style={{ background: c.hex }} />{c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes?.length > 0 && (
              <div className="pd-field">
                <p>Size: <strong>{selSize}</strong></p>
                <div className="pd-chips">
                  {product.sizes.map(sz => (
                    <button key={sz} className={`pd-chip ${selSize === sz ? 'on' : ''}`} onClick={() => setSelSize(sz)}>{sz}</button>
                  ))}
                </div>
                <button className="pd-sizeguide" onClick={openSizeGuide}><span>+</span> Size Guide</button>
              </div>
            )}

            <div className="pd-cta">
              <div className="pd-qty">
                <button aria-label="Decrease" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span key={qty}>{qty}</span>
                <button aria-label="Increase" onClick={() => setQty(q => Math.min(Math.max(1, product.stock), q + 1))}>+</button>
              </div>
              <button className="pd-add" onClick={handleAddToCart} disabled={product.stock <= 0}>{product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</button>
            </div>
            <button className="pd-buy" onClick={() => { handleAddToCart(); navigate('/checkout') }} disabled={product.stock <= 0}>Buy it now</button>

            <div className={`pd-stock ${stockStatus}`}><i /> {stockLabel}</div>

            <div className="pd-trust">
              {TRUST.map(t => (
                <div key={t.t}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
                  <b>{t.t}</b><span>{t.d}</span>
                </div>
              ))}
            </div>

            {/* ── Accordions ── */}
            <div className="acc-list">
              <Accordion id="description" title="Description" open={openSec === 'description'} onToggle={toggleSec}>
                <p>{product.description || 'No description added yet.'}</p>
              </Accordion>

              {sizeFields && (
                <Accordion id="size" title="Size Guide & Fit Assistant" open={openSec === 'size'} onToggle={toggleSec}>
                  <h4 style={{ marginBottom: 4 }}>✨ AI Fit Assistant</h4>
                  <p className="acc-note">Enter your measurements (in inches) and we will recommend the best size.</p>
                  <div className="size-fields-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(sizeFields.length, 2)},1fr)`, gap: 'var(--sp-md)', marginBottom: 'var(--sp-md)' }}>
                    {sizeFields.map(field => (
                      <div key={field}>
                        <label style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, display: 'block', marginBottom: 6 }}>{FIELD_LABEL[field]} (in)</label>
                        <input type="number" value={measurements[field]} onChange={e => setMeasurements(m => ({ ...m, [field]: e.target.value }))} placeholder="e.g. 36" className="form-input" style={{ padding: '8px 12px' }} />
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={findSize} disabled={sizeLoading}>{sizeLoading ? 'Thinking...' : 'Get My Size'}</button>
                  {sizeRec && (
                    <div className="fit-result">
                      <div><strong>Recommended size: </strong><span>{sizeRec.size}</span></div>
                      <p>{sizeRec.note}</p>
                    </div>
                  )}
                  {!sizeFields.includes('underbust') && (
                    <div style={{ overflowX: 'auto', marginTop: 'var(--sp-lg)' }}>
                      <table className="size-table">
                        <thead><tr>{['Size', 'Bust', 'Waist', 'Hip'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                        <tbody>{[['XS', '32–33', '25–26', '35–36'], ['S', '34–35', '27–28', '37–38'], ['M', '36–37', '29–30', '39–40'], ['L', '38–40', '31–33', '41–43'], ['XL', '41–43', '34–36', '44–46'], ['XXL', '44–46', '37–39', '47–49']].map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{i === 0 ? <strong>{c}</strong> : c}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </Accordion>
              )}

              <Accordion id="returns" title="Return Policies" open={openSec === 'returns'} onToggle={toggleSec}>
                <p>Free shipping on orders above Rs. 5,000. Standard delivery takes 3–5 business days within major cities.</p>
                <p style={{ marginTop: 10 }}>Unworn items with original tags can be exchanged within the return window. Innerwear is exchangeable only if the hygiene seal is intact.</p>
              </Accordion>

              <Accordion id="reviews" title={`Reviews (${product.reviews})`} open={openSec === 'reviews'} onToggle={toggleSec}>
                <p><strong>{product.rating}</strong> out of 5 stars, based on {product.reviews} reviews.</p>
              </Accordion>
            </div>

            {/* ── Frequently bought together ── */}
            {others.length > 0 && (
              <div className="fbt">
                <h3>Frequently Bought Together</h3>
                <div className="fbt-top">
                  <div className="fbt-imgs">
                    {fbtItems.map((i, n) => (
                      <div key={i.p.id} className="fbt-img-wrap">
                        {n > 0 && <span className="fbt-plus">+</span>}
                        <div className={`fbt-img ${fbtOff.has(i.p.id) ? 'off' : ''}`}><SmartImage src={i.p.images?.[0]} alt={i.p.name} tone={n} label=" " /></div>
                      </div>
                    ))}
                  </div>
                  <div className="fbt-buy">
                    <p>Total price: <b key={fbtTotal}>{fmt(fbtTotal)}</b> {fbtWas > fbtTotal && <s>{fmt(fbtWas)}</s>}</p>
                    <button className="pd-add" onClick={addBundle} disabled={!checked.length}>Add selected to cart</button>
                  </div>
                </div>

                <div className="fbt-list">
                  {fbtItems.map(i => (
                    <label key={i.p.id} className="fbt-row">
                      <input type="checkbox" checked={!fbtOff.has(i.p.id)} onChange={() => setFbtOff(s => { const n = new Set(s); if (n.has(i.p.id)) n.delete(i.p.id); else n.add(i.p.id); return n })} />
                      <span className="fbt-name">
                        {i.self ? <><b>This item:</b> {i.p.name}</> : <Link to={`/product/${i.p.id}`} onClick={e => e.stopPropagation()}>{i.p.name}</Link>}
                      </span>
                      {i.self
                        ? (selColor || selSize) && <span className="fbt-var">{[selColor, selSize].filter(Boolean).join(' / ')}</span>
                        : i.vs.length > 1 && (
                          <select className="fbt-select" value={fbtVariant[i.p.id] ?? 0} onClick={e => e.stopPropagation()} onChange={e => setFbtVariant(v => ({ ...v, [i.p.id]: Number(e.target.value) }))}>
                            {i.vs.map((v, n) => <option key={n} value={n}>{v.label}</option>)}
                          </select>
                        )}
                      <span className="fbt-price">{fmt(i.p.price)} {i.p.original_price > i.p.price && <s>{fmt(i.p.original_price)}</s>}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </Reveal>
        </div>

        {/* ── Related ── */}
        {related.filter(p => p.id !== id).length > 0 && (
          <section className="pd-related">
            <Reveal><div className="section-header"><span className="section-subtitle">You May Also Like</span><h2 className="section-title">Related Products</h2><hr className="section-divider" /></div></Reveal>
            <div className="product-grid">{related.filter(p => p.id !== id).slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
          </section>
        )}
      </div>
    </div>
  )
}
