import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../../services/api'
import { showToast } from '../../components/ui/Toast'
import type { Category, Color, Product } from '../../types'
import { detectColors, mergeColors } from '../../utils/colorDetect'
import { compressImage } from '../../utils/compressImage'

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`

// ── Image Upload Component ─────────────────────────────────────────────────────
function ImageGallery({ images, onChange, onAdd }: { images: string[]; onChange: (imgs: string[]) => void; onAdd: (imgs: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Convert uploaded files to base64 data URLs for preview & storage — all at once,
  // so picking several photos keeps every one (not just the last).
  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    const read = (file: File) => compressImage(file)
    const results = await Promise.allSettled(Array.from(files).filter(f => f.type.startsWith('image/')).map(read))
    const added = results.flatMap(r => (r.status === 'fulfilled' ? [r.value] : []))
    if (added.length < results.length) showToast('Some photos could not be read — try JPG or PNG.', 'error')
    if (added.length) onAdd(added)
  }

  const removeImage = (idx: number) => onChange(images.filter((_, i) => i !== idx))

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      {/* Preview Grid */}
      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative', width: '90px', height: '112px', flexShrink: 0 }}>
              <img
                src={img}
                alt={`Product ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: i === 0 ? '2px solid var(--rose)' : '1px solid var(--border)' }}
              />
              {i === 0 && (
                <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'var(--rose)', color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>MAIN</span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#e74c3c', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{ border: '2px dashed var(--border)', borderRadius: '10px', padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rose)'; e.currentTarget.style.background = 'rgba(201,123,123,0.04)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#fafafa' }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
        <p style={{ fontWeight: 600, color: 'var(--dark)', marginBottom: '4px', fontSize: 'var(--fs-sm)' }}>Click to upload or drag & drop</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>PNG, JPG, WEBP • photos are resized automatically • First image = main image</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  )
}

interface ProductFormState {
  name: string; price: string | number; original_price: string | number; stock: string | number
  category_id: string; subcategory_id: string; description: string
  featured: boolean; on_sale: boolean; sizes: string; colors: Color[]; images: string[]
  // dropshipping — admin-only, never shown to customers
  is_dropship: boolean; supplier_name: string; supplier_url: string; supplier_sku: string; supplier_price: string | number
}

// ── Product Modal ──────────────────────────────────────────────────────────────
function ProductModal({ product, categories, onClose, onSave, saving }: {
  product: Product | null
  categories: Category[]
  onClose: () => void
  onSave: (data: any) => void
  saving: boolean
}) {
  const [form, setForm] = useState<ProductFormState>(product ? {
    name: product.name,
    price: product.price,
    original_price: product.original_price || '',
    stock: product.stock,
    category_id: product.category_id || '',
    subcategory_id: product.subcategory_id || '',
    description: product.description || '',
    featured: !!product.featured,
    on_sale: !!product.on_sale,
    sizes: (product.sizes || []).join(', '),
    colors: [...(product.colors || [])],
    images: [...(product.images || [])],
    is_dropship: !!product.is_dropship,
    supplier_name: product.supplier_name || '',
    supplier_url: product.supplier_url || '',
    supplier_sku: product.supplier_sku || '',
    supplier_price: product.supplier_price ?? '',
  } : {
    name: '', price: '', original_price: '', stock: '',
    category_id: '', subcategory_id: '', description: '',
    featured: false, on_sale: false,
    sizes: '', colors: [{ name: '', hex: '#C97B7B' }], images: [],
    is_dropship: false, supplier_name: '', supplier_url: '', supplier_sku: '', supplier_price: '',
  })

  const set = <K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) => setForm(f => ({ ...f, [k]: v }))
  const cat = categories.find(c => c.id === form.category_id)
  const [detecting, setDetecting] = useState(false)
  const formRef = useRef(form)
  formRef.current = form

  /* Reads the garment colours from photos and adds any new ones to the Colors list. */
  const autoColors = async (imgs: string[], announce: boolean) => {
    if (!imgs.length) return announce && showToast('Add a product photo first.', 'error')
    setDetecting(true)
    const found: Color[] = []
    let failed = 0
    for (const img of imgs) {
      try { found.push(...await detectColors(img)) } catch { failed++ }
    }
    const current = formRef.current.colors
    const added = mergeColors(current, found).filter(c => !current.some(o => o.name === c.name && o.hex === c.hex))
    setForm(f => {
      const merged = mergeColors(f.colors, found)
      return { ...f, colors: merged.length ? merged : f.colors }
    })
    setDetecting(false)
    if (added.length) showToast(`🎨 Colours added: ${added.map(c => c.name).join(', ')}`, 'success')
    else if (announce) showToast(failed === imgs.length ? 'Could not read these photos (image link blocks it) — add colours by hand.' : 'No new colours found.', failed === imgs.length ? 'error' : 'info')
  }

  const addImages = (imgs: string[]) => {
    setForm(f => ({ ...f, images: [...f.images, ...imgs] }))
    autoColors(imgs, false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.images.length) return showToast('Please add at least one product image.', 'error')
    if (!form.name.trim()) return showToast('Product name is required.', 'error')
    if (!form.price) return showToast('Price is required.', 'error')
    if (!form.category_id) return showToast('Please select a category.', 'error')

    const data = {
      ...form,
      price: Number(form.price),
      original_price: Number(form.original_price) || Number(form.price),
      stock: Number(form.stock) || 0,
      supplier_price: form.supplier_price === '' ? null : Number(form.supplier_price),
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: form.colors.filter(c => c.name.trim()),
      // a struck-through original price means the product is on sale (keeps Sale filter + badges consistent)
      on_sale: form.on_sale || Number(form.original_price) > Number(form.price),
    }
    onSave(data)
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ overflowY: 'auto' }}>
      <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', margin: '20px auto' }}>
        <div className="admin-modal-header">
          <h3>{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="form-input" placeholder="e.g. Floral Maxi Dress" required />
            </div>
            <div className="form-group">
              <label className="form-label">Stock Quantity {form.is_dropship ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(not needed — supplier holds stock)</span> : '*'}</label>
              <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} className="form-input" min="0" required={!form.is_dropship} disabled={form.is_dropship} placeholder={form.is_dropship ? 'Always in stock' : ''} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sale Price (Rs.) *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} className="form-input" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Original Price (Rs.)</label>
              <input type="number" value={form.original_price} onChange={e => set('original_price', e.target.value)} className="form-input" min="0" placeholder="Leave blank if no discount" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select value={form.category_id} onChange={e => { set('category_id', e.target.value); set('subcategory_id', '') }} className="form-select" required>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Subcategory</label>
              <select value={form.subcategory_id} onChange={e => set('subcategory_id', e.target.value)} className="form-select">
                <option value="">None</option>
                {(cat?.subcategories || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} className="form-textarea" placeholder="Describe the product..." required />
          </div>

          <div className="form-group">
            <label className="form-label">Sizes (comma-separated)</label>
            <input value={form.sizes} onChange={e => set('sizes', e.target.value)} className="form-input" placeholder="e.g. XS, S, M, L, XL" />
          </div>

          {/* Dropshipping — you find the product on another store and order it there yourself */}
          <div className={`ds-box ${form.is_dropship ? 'on' : ''}`}>
            <label className="ds-toggle">
              <input type="checkbox" checked={form.is_dropship} onChange={e => set('is_dropship', e.target.checked)} />
              <span><b>🚚 Dropship product</b><small>I don't keep stock — I order it from a supplier after the customer buys. Supplier details are never shown to customers.</small></span>
            </label>
            {form.is_dropship && (() => {
              const cost = Number(form.supplier_price) || 0
              const sell = Number(form.price) || 0
              const profit = sell - cost
              return (
                <div className="ds-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Supplier / store name</label>
                      <input className="form-input" value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} placeholder="e.g. Daraz shop, AliExpress seller, wholesaler" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Supplier price (your cost, Rs.)</label>
                      <input className="form-input" type="number" min="0" value={form.supplier_price} onChange={e => set('supplier_price', e.target.value)} placeholder="What you pay the supplier" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier product link</label>
                    <input className="form-input" type="url" value={form.supplier_url} onChange={e => set('supplier_url', e.target.value)} placeholder="https://… (the page where you found this product)" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier SKU / code <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                    <input className="form-input" value={form.supplier_sku} onChange={e => set('supplier_sku', e.target.value)} />
                  </div>
                  {cost > 0 && sell > 0 && (
                    <div className={`ds-profit ${profit > 0 ? 'good' : 'bad'}`}>
                      <span>Profit per piece</span>
                      <b>Rs. {profit.toLocaleString('en-PK')}</b>
                      <em>{profit > 0 ? `${Math.round((profit / sell) * 100)}% margin` : 'You would lose money at this price'}</em>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Colors */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-sm)', flexWrap: 'wrap', marginBottom: 'var(--sp-sm)' }}>
              <label className="form-label" style={{ margin: 0 }}>Colors <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(auto-detected from photos — edit freely)</span></label>
              <button type="button" className="add-row-btn" style={{ width: 'auto', padding: '6px 14px' }} disabled={detecting} onClick={() => autoColors(form.images, true)}>
                {detecting ? 'Detecting…' : '🎨 Detect from photos'}
              </button>
            </div>
            {form.colors.map((c, i) => (
              <div key={i} className="color-input-row">
                <input
                  type="text"
                  value={c.name}
                  onChange={e => { const cols = [...form.colors]; cols[i] = { ...cols[i], name: e.target.value }; set('colors', cols) }}
                  className="form-input"
                  placeholder="Color name (e.g. Blush Pink)"
                />
                <input
                  type="color"
                  value={c.hex || '#C97B7B'}
                  onChange={e => { const cols = [...form.colors]; cols[i] = { ...cols[i], hex: e.target.value }; set('colors', cols) }}
                />
                <button type="button" className="remove-row-btn" onClick={() => set('colors', form.colors.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button type="button" className="add-row-btn" onClick={() => set('colors', [...form.colors, { name: '', hex: '#C97B7B' }])}>
              + Add Color
            </button>
          </div>

          {/* Image Gallery Upload + Cloudinary/Public URL support */}
          <div className="form-group">
            <label className="form-label">Product Images * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(upload or paste Cloudinary/public URLs)</span></label>
            <ImageGallery images={form.images} onChange={imgs => set('images', imgs)} onAdd={addImages} />
            <div style={{ marginTop: '12px' }}>
              <textarea
                value={form.images.join('\n')}
                onChange={e => set('images', e.target.value.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean))}
                className="form-textarea"
                rows={3}
                placeholder="Paste one or more image URLs here (Cloudinary, Unsplash, etc.) and separate them by new lines or commas"
              />
            </div>
          </div>

          {/* Flags */}
          <div style={{ display: 'flex', gap: 'var(--sp-xl)', marginBottom: 'var(--sp-lg)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--fs-sm)' }}>
              <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} style={{ accentColor: 'var(--rose)', width: '16px', height: '16px' }} />
              ⭐ Featured (New Arrival)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--fs-sm)' }}>
              <input type="checkbox" checked={form.on_sale} onChange={e => set('on_sale', e.target.checked)} style={{ accentColor: 'var(--rose)', width: '16px', height: '16px' }} />
              🏷️ On Sale
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={saving}>
            {saving ? '⏳ Saving...' : product ? '✓ Update Product' : '✓ Add Product'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main Products Page ─────────────────────────────────────────────────────────
export default function Products() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal] = useState<'new' | Product | null>(null) // null = closed | 'new' | product object
  const qc = useQueryClient()

  const { data: products = [] } = useQuery({ queryKey: ['products', { admin: true }], queryFn: () => getProducts({ admin: true }) })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })

  const saveMut = useMutation({
    mutationFn: (data: any) => data.id ? updateProduct(data.id, data) : createProduct(data),
    onSuccess: () => {
      showToast(modal === 'new' ? 'Product added!' : 'Product updated!', 'success')
      qc.invalidateQueries({ queryKey: ['products'] })
      setModal(null)
    },
    onError: (e: any) => showToast(e.response?.data?.error || 'Save failed.', 'error')
  })

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { showToast('Product deleted.', 'info'); qc.invalidateQueries({ queryKey: ['products'] }) }
  })

  const filtered = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.category_id === catFilter)
  )

  return (
    <>
      {modal !== null && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={(data) => saveMut.mutate(modal === 'new' ? data : { ...data, id: (modal as Product).id })}
          saving={saveMut.isPending}
        />
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-toolbar">
            <input className="admin-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." />
            <select className="form-select" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setModal('new')}>+ Add Product</button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--sp-xl)' }}>No products found.</td></tr>
              ) : filtered.map(p => {
                const cat = categories.find(c => c.id === p.category_id)
                const st = p.is_dropship ? 'in-stock' : p.stock <= 0 ? 'out-of-stock' : p.stock <= 5 ? 'low-stock' : 'in-stock'
                const stLabel = p.is_dropship ? '🚚 Dropship' : p.stock <= 0 ? 'Out of Stock' : p.stock <= 5 ? 'Low Stock' : 'In Stock'
                const profit = p.is_dropship && p.supplier_price ? p.price - p.supplier_price : null
                return (
                  <tr key={p.id}>
                    <td data-label="">
                      <img src={p.images?.[0]} alt={p.name} className="admin-table-thumb"
                        onError={e => { const img = e.target as HTMLImageElement; img.style.background = 'var(--cream)'; img.style.opacity = '0.5' }} />
                    </td>
                    <td data-label="Name"><strong>{p.name}</strong>{profit !== null && <small className="ds-mini">Profit Rs. {profit.toLocaleString('en-PK')}</small>}</td>
                    <td data-label="Category">{cat?.name || '—'}</td>
                    <td data-label="Price">{fmt(p.price)}</td>
                    <td data-label="Stock">{p.is_dropship ? '—' : p.stock}</td>
                    <td data-label="Status"><span className={`admin-badge ${st}`}>{stLabel}</span></td>
                    <td data-label="Actions">
                      <div className="admin-table-actions">
                        <button className="admin-icon-btn" onClick={() => setModal(p)} title="Edit">✏️</button>
                        <button className="admin-icon-btn danger" title="Delete"
                          onClick={() => { if (window.confirm(`Delete "${p.name}"? This cannot be undone.`)) deleteMut.mutate(p.id) }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
