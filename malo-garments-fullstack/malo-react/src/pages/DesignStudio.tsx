import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '../context/CartContext'
import { generateDesignPreview, getDesignPricing, type DesignPricing } from '../services/api'
import TweenNumber from '../components/ui/TweenNumber'
import GarmentPreview, { type GarmentType, type PatternName } from '../components/ui/GarmentPreview'
import SmartImage from '../components/home/SmartImage'
import Reveal from '../components/home/Reveal'
import Rail from '../components/home/Rail'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`

const COLORS = [
  { name: 'Blush Pink', hex: '#F2B5B5' }, { name: 'Black', hex: '#111111' }, { name: 'Burgundy', hex: '#800020' },
  { name: 'Ivory', hex: '#FFFFF0' }, { name: 'Sky Blue', hex: '#87CEEB' }, { name: 'Emerald', hex: '#50C878' },
  { name: 'Lavender', hex: '#E6E6FA' }, { name: 'Nude', hex: '#E3BC9A' }, { name: 'Red', hex: '#DC143C' }, { name: 'Navy', hex: '#000080' },
]

// Photos shown on the design screens. Swap any of these for your own
// (e.g. '/images/design/bra.jpg' placed in public/images/design/).
const PHOTO = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&h=1200&fit=crop&q=80`
const TYPE_PHOTO: Record<GarmentType, string> = {
  dress: PHOTO('1572804013309-59a88b7e92f1'),
  bra: PHOTO('1518622358385-8ea7d0794bf6'),
  underwear: PHOTO('1518611012118-696072aa579a'),
  nighty: PHOTO('1596783074918-c84cb06531ca'),
}
// "Get inspired" strip — each card links to a real category page (by slug).
const INSPIRATION = [
  { title: 'Dresses', img: PHOTO('1566174053879-31528523f8ae'), to: '/shop?category=ladies-garments&subcategory=dresses' },
  { title: 'Evening Wear', img: PHOTO('1595777457583-95e059d581b8'), to: '/shop?category=ladies-garments' },
  { title: 'Nightwear', img: PHOTO('1596783074918-c84cb06531ca'), to: '/shop?category=nightwear' },
  { title: 'Activewear', img: PHOTO('1518622358385-8ea7d0794bf6'), to: '/shop?category=activewear' },
  { title: 'Outerwear', img: PHOTO('1594938298603-c8148c4dae35'), to: '/shop?category=outerwear' },
  { title: 'Traditional', img: PHOTO('1610030469983-98e550d6193c'), to: '/shop?category=traditional-wear' },
]
const HERO_PHOTO = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&h=900&fit=crop&q=80'

const STEPS = [
  { n: '01', t: 'Choose', d: 'Pick the garment you want to create' },
  { n: '02', t: 'Customize', d: 'Colour, pattern, cut and size' },
  { n: '03', t: 'Preview', d: 'See it live, or make a realistic photo' },
  { n: '04', t: 'Order', d: 'We craft it and deliver to your door' },
]

interface StyleGroup { key: string; label: string; options: string[] }
interface GarmentConfig {
  label: string; icon: string; category: string; subcategory: string; basePrice: number
  patterns: PatternName[]; styleGroups: StyleGroup[]; sizes: string[]
}

const GARMENT_CONFIG: Record<GarmentType, GarmentConfig> = {
  dress: {
    label: 'Dress', icon: '👗', category: 'Ladies Garments', subcategory: 'Dresses', basePrice: 4500,
    patterns: ['Solid', 'Floral', 'Polka Dot', 'Stripes', 'Lace'],
    styleGroups: [
      { key: 'neckline', label: 'Neckline', options: ['Round', 'V-Neck', 'Off-Shoulder', 'Halter'] },
      { key: 'length', label: 'Length', options: ['Mini', 'Midi', 'Maxi'] },
      { key: 'sleeve', label: 'Sleeve', options: ['Sleeveless', 'Short Sleeve', 'Long Sleeve'] },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  bra: {
    label: 'Bra', icon: '👙', category: 'Undergarments', subcategory: 'Bras', basePrice: 1600,
    patterns: ['Solid', 'Lace', 'Floral', 'Polka Dot'],
    styleGroups: [{ key: 'style', label: 'Style', options: ['Push-Up', 'Wireless', 'Sports', 'T-Shirt Bra'] }],
    sizes: ['32B', '34B', '34C', '36B', '36C', '38B', '38C'],
  },
  underwear: {
    label: 'Underwear', icon: '🩲', category: 'Undergarments', subcategory: 'Panties', basePrice: 900,
    patterns: ['Solid', 'Lace', 'Polka Dot'],
    styleGroups: [{ key: 'style', label: 'Style', options: ['Bikini', 'Hipster', 'Thong', 'Boyshort'] }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  nighty: {
    label: 'Nighty', icon: '🌙', category: 'Undergarments', subcategory: 'Sleepwear', basePrice: 3200,
    patterns: ['Solid', 'Floral', 'Lace', 'Satin Sheen'],
    styleGroups: [
      { key: 'length', label: 'Length', options: ['Short', 'Knee-Length', 'Long'] },
      { key: 'sleeve', label: 'Sleeve', options: ['Sleeveless', 'Spaghetti Strap', 'Short Sleeve'] },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
}

interface Quote { unit: number; lines: { label: string; amount: number }[] }

/** Same formula as the server: base + pattern + every style option + size + colour. */
function quoteFor(label: string, basePrice: number, t: DesignPricing | undefined, pick: { color: string; pattern: string; styles: Record<string, string>; size: string }): Quote {
  const lines = [{ label: `${label} (base)`, amount: t?.base ?? basePrice }]
  if (t) {
    const add = (name: string, amount: number | undefined) => { if (amount) lines.push({ label: name, amount }) }
    add(`${pick.pattern} pattern`, t.patterns[pick.pattern])
    Object.entries(pick.styles).forEach(([group, option]) => add(option, t.styles[group]?.[option]))
    add(`Size ${pick.size}`, t.sizes[pick.size])
    add(`${pick.color} colour`, t.colors[pick.color])
  }
  return { unit: lines.reduce((n, l) => n + l.amount, 0), lines }
}

const PillGroup = ({ options, value, onChange, extras }: { options: string[]; value: string; onChange: (v: string) => void; extras?: Record<string, number> }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-sm)' }}>
    {options.map(opt => (
      <button key={opt} type="button" className={`ds-pill ${value === opt ? 'on' : ''}`} onClick={() => onChange(opt)}>
        {opt}{!!extras?.[opt] && <em>+{fmt(extras[opt]).replace('Rs. ', '')}</em>}
      </button>
    ))}
  </div>
)

export default function DesignStudio() {
  const [type, setType] = useState<GarmentType | null>(null)
  const [color, setColor] = useState(COLORS[0])
  const [pattern, setPattern] = useState<PatternName>('Solid')
  const [styles, setStyles] = useState<Record<string, string>>({})
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [aiImage, setAiImage] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const { addToCart } = useCart()
  const { data: pricing } = useQuery({ queryKey: ['design-pricing'], queryFn: getDesignPricing, staleTime: 5 * 60_000 })

  useEffect(() => {
    if (!type) return
    const cfg = GARMENT_CONFIG[type]
    setPattern('Solid')
    setStyles(Object.fromEntries(cfg.styleGroups.map(g => [g.key, g.options[0]])))
    setSize(cfg.sizes[0])
    setQty(1)
  }, [type])

  // Any change to the design invalidates the AI photo — it's costed/on-demand,
  // so we don't auto-regenerate, just fall back to the free instant sketch.
  useEffect(() => { setAiImage(null); setAiError('') }, [type, color, pattern, styles])

  const cfg = type ? GARMENT_CONFIG[type] : null

  const quote = useMemo(
    () => (type && cfg ? quoteFor(cfg.label, cfg.basePrice, pricing?.[type], { color: color.name, pattern, styles, size }) : null),
    [type, cfg, pricing, color.name, pattern, styles, size],
  )
  const typePricing = type ? pricing?.[type] : undefined

  const styleSummary = cfg ? cfg.styleGroups.map(g => styles[g.key]).filter(Boolean).join(', ') : ''

  const handleGeneratePreview = async () => {
    if (!cfg) return
    setAiLoading(true)
    setAiError('')
    try {
      const r = await generateDesignPreview({ garmentType: cfg.label, color: color.name, pattern, styleSummary })
      setAiImage(r.image)
    } catch (err: any) {
      setAiError(err.response?.data?.error || 'Could not generate a realistic preview right now.')
    } finally { setAiLoading(false) }
  }

  const handleAddToCart = () => {
    if (!type || !cfg) return
    const name = `Custom ${cfg.label} — ${color.name}, ${pattern}${styleSummary ? ', ' + styleSummary : ''}`
    let image = aiImage || ''
    if (!image) {
      const svgEl = previewRef.current?.querySelector('svg')
      image = svgEl ? `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(svgEl))}` : ''
    }

    addToCart({
      productId: null, name, image, price: quote?.unit ?? cfg.basePrice, size, color: color.name, quantity: qty, customType: type,
      customization: { color: color.name, pattern, styles, size },
    })
  }

  return (
    <div>
      <section className="ds-hero">
        <div className="ds-hero-bg"><SmartImage src={HERO_PHOTO} alt="Design your own" tone={0} quiet eager /></div>
        <div className="ds-hero-shade" />
        <div className="ds-hero-text">
          <span className="rise" style={{ ['--d' as string]: 100 }}>Made for you</span>
          <h1 className="rise" style={{ ['--d' as string]: 250 }}>Design Your Own</h1>
          <p className="rise" style={{ ['--d' as string]: 450 }}>Pick a garment, customize it exactly how you like, and watch it come together live.</p>
        </div>
      </section>

      <div className="ds-steps container">
        {STEPS.map((st, i) => (
          <Reveal key={st.n} delay={i * 90}>
            <div className={`ds-step ${(i === 0 && !type) || (i > 0 && type && i <= 2) ? 'on' : ''}`}>
              <span>{st.n}</span><b>{st.t}</b><p>{st.d}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .design-layout { grid-template-columns: 1fr !important; }
          .design-preview { position: static !important; }
        }
      `}</style>

      <div className="container" style={{ paddingTop: 'var(--sp-2xl)', paddingBottom: 'var(--sp-4xl)' }}>
        {!type ? (
          <>
            <div className="ds-types">
              {(Object.keys(GARMENT_CONFIG) as GarmentType[]).map((t, i) => (
                <Reveal key={t} delay={i * 100}>
                  <button className="ds-type zoom" onClick={() => setType(t)}>
                    <SmartImage src={TYPE_PHOTO[t]} alt={GARMENT_CONFIG[t].label} tone={i} label={GARMENT_CONFIG[t].label} />
                    <span className="ds-type-icon">{GARMENT_CONFIG[t].icon}</span>
                    <div className="ds-type-label">
                      <b>{GARMENT_CONFIG[t].label}</b>
                      <span>from {fmt(GARMENT_CONFIG[t].basePrice)}</span>
                      <em>Start designing →</em>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>

            <div className="ds-inspo">
              <Reveal><h3>Get inspired</h3><p>Browse our collections for ideas before you design.</p></Reveal>
              <Rail>
                {INSPIRATION.map(c => (
                  <Link key={c.title} to={c.to} className="ds-inspo-card zoom">
                    <SmartImage src={c.img} alt={c.title} tone={1} label={c.title} />
                    <b>{c.title}</b>
                  </Link>
                ))}
              </Rail>
            </div>
          </>
        ) : cfg && (
          <div className="design-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--sp-3xl)', alignItems: 'start' }}>
            {/* Controls */}
            <div className="ds-controls">
              <button className="ds-back" onClick={() => setType(null)}>← Choose a different garment</button>
              <div className="ds-title">
                <span className="ds-title-photo"><SmartImage src={TYPE_PHOTO[type]} alt={cfg.label} tone={0} quiet /></span>
                <h3>Design Your {cfg.label}</h3>
              </div>

              <div className="ds-block" style={{ ['--i' as string]: 0 }}>
                <p className="ds-label">Color <strong key={color.name}>{color.name}</strong></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-sm)' }}>
                  {COLORS.map(c => (
                    <button key={c.name} type="button" onClick={() => setColor(c)} title={typePricing?.colors[c.name] ? `${c.name} (+${fmt(typePricing.colors[c.name])})` : c.name} aria-label={c.name}
                      className={`ds-swatch ${color.name === c.name ? 'on' : ''}`} style={{ background: c.hex }} />
                  ))}
                </div>
              </div>

              <div className="ds-block" style={{ ['--i' as string]: 1 }}>
                <p className="ds-label">Pattern <strong key={pattern}>{pattern}</strong></p>
                <PillGroup options={cfg.patterns} value={pattern} extras={typePricing?.patterns} onChange={v => setPattern(v as PatternName)} />
              </div>

              {cfg.styleGroups.map((g, gi) => (
                <div key={g.key} className="ds-block" style={{ ['--i' as string]: 2 + gi }}>
                  <p className="ds-label">{g.label} <strong>{styles[g.key]}</strong></p>
                  <PillGroup options={g.options} value={styles[g.key] || g.options[0]} extras={typePricing?.styles[g.key]} onChange={v => setStyles(s => ({ ...s, [g.key]: v }))} />
                </div>
              ))}

              <div className="ds-block" style={{ ['--i' as string]: 2 + cfg.styleGroups.length }}>
                <p className="ds-label">Size <strong>{size}</strong></p>
                <PillGroup options={cfg.sizes} value={size} extras={typePricing?.sizes} onChange={setSize} />
              </div>

              <div className="ds-block" style={{ ['--i' as string]: 3 + cfg.styleGroups.length }}>
                <p className="ds-label">Quantity</p>
                <div className="pd-qty" style={{ width: 'fit-content' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span key={qty}>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}>+</button>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="design-preview ds-panel" style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 20px)', background: 'var(--cream)', borderRadius: 'var(--border-radius-lg)', padding: 'var(--sp-xl)', textAlign: 'center' }}>
              <div ref={previewRef} className="ds-stage" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '340px', background: aiImage ? 'white' : 'transparent', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
                {aiImage ? (
                  <img src={aiImage} alt={`Realistic preview of your custom ${cfg.label}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div key={`${type}-${pattern}`} className="ds-garment"><GarmentPreview type={type} color={color.hex} pattern={pattern} /></div>
                )}
                {aiLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-sm)' }}>
                    <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-light)', borderTopColor: 'var(--rose)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-light)' }}>Creating your design… (5–10s)</span>
                  </div>
                )}
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

              <button type="button" className="btn btn-outline btn-block" style={{ marginTop: 'var(--sp-md)' }} onClick={handleGeneratePreview} disabled={aiLoading}>
                {aiLoading ? 'Generating…' : aiImage ? '✨ Regenerate Realistic Photo' : '✨ Generate Realistic Photo'}
              </button>
              {aiError && <p style={{ color: 'var(--error)', fontSize: 'var(--fs-xs)', marginTop: 'var(--sp-sm)' }}>{aiError}</p>}

              <hr style={{ margin: 'var(--sp-lg) 0', border: 'none', borderTop: '1px solid var(--border)' }} />
              <div className="ds-quote">
                <p className="ds-quote-title">Your price</p>
                {quote?.lines.map(l => (
                  <div key={l.label} className="ds-quote-row"><span>{l.label}</span><b>{l.amount > 0 && quote.lines.indexOf(l) > 0 ? '+' : ''}{fmt(l.amount)}</b></div>
                ))}
                <div className="ds-quote-row unit"><span>Per piece</span><b><TweenNumber value={quote?.unit ?? 0} format={fmt} /></b></div>
                {qty > 1 && <div className="ds-quote-row"><span>× {qty} pieces</span><b /></div>}
              </div>
              <p className="ds-price"><TweenNumber value={(quote?.unit ?? cfg.basePrice) * qty} format={fmt} /></p>
              <button className="btn btn-primary btn-lg btn-block" onClick={handleAddToCart}>Add to Cart</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
