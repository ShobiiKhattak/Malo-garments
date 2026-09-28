import { useState, useRef } from 'react'
import { compressImage } from '../../utils/compressImage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCategories, getProducts, createCategory, updateCategory, deleteCategory } from '../../services/api'
import { showToast } from '../../components/ui/Toast'
import type { Category } from '../../types'

interface CategoryForm { name: string; slug: string; image: string; subcategories: string }

const FALLBACK_IMG = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23f0ebe5"/><text x="50%" y="50%" font-size="10" fill="%23999" text-anchor="middle" dy=".3em">No image</text></svg>`
)

// ── Single-image picker: upload (drag & drop / click) or paste a URL ───────────
function CategoryImagePicker({ image, onChange }: { image: string; onChange: (img: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (files: FileList | null) => {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    compressImage(file).then(onChange).catch(() => showToast('Could not read this photo — try JPG or PNG.', 'error'))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files)
  }

  const looksLikeImage = image && (image.startsWith('data:image') || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(image) || image.startsWith('http'))

  return (
    <div>
      {image && (
        <div style={{ position: 'relative', width: '120px', height: '150px', marginBottom: '12px' }}>
          <img
            src={image}
            alt="Category preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }}
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#e74c3c', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
            ✕
          </button>
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{ border: '2px dashed var(--border)', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'all 0.2s', marginBottom: '10px' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rose)'; e.currentTarget.style.background = 'rgba(201,123,123,0.04)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#fafafa' }}
      >
        <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>📷</div>
        <p style={{ fontWeight: 600, color: 'var(--dark)', fontSize: 'var(--fs-sm)', margin: 0 }}>Click to upload or drag & drop</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', margin: '4px 0 0' }}>PNG, JPG, WEBP up to 5MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files)} />

      <input
        value={image}
        onChange={e => onChange(e.target.value)}
        className="form-input"
        placeholder="...or paste a direct image URL (https://...)"
      />
      {image && !looksLikeImage && (
        <div className="form-error">This doesn't look like an image URL — upload a file instead, or paste a direct link ending in .jpg/.png/.webp.</div>
      )}
    </div>
  )
}

export default function Categories() {
  const [modal, setModal] = useState<'new' | Category | null>(null)
  const [form, setForm] = useState<CategoryForm>({name:'',slug:'',image:'',subcategories:''})
  const qc = useQueryClient()

  const { data: categories = [] } = useQuery({queryKey:['categories'],queryFn:getCategories})
  const { data: products = [] } = useQuery({queryKey:['products',{}],queryFn:()=>getProducts()})

  const slugify = (t: string) => t.toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/[\s_-]+/g,'-')

  const openModal = (cat: Category | null = null) => {
    if (cat) setForm({name:cat.name,slug:cat.slug,image:cat.image,subcategories:(cat.subcategories||[]).map(s=>s.name).join(', ')})
    else setForm({name:'',slug:'',image:'',subcategories:''})
    setModal(cat||'new')
  }

  const saveMut = useMutation({
    mutationFn: (data: any) => modal==='new' ? createCategory(data) : updateCategory((modal as Category).id, data),
    onSuccess: () => { showToast(modal==='new'?'Category added!':'Category updated!','success'); qc.invalidateQueries({ queryKey: ['categories'] }); setModal(null) },
    onError: (e: any) => showToast(e.response?.data?.error||'Save failed.','error')
  })
  const deleteMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { showToast('Category deleted.','info'); qc.invalidateQueries({ queryKey: ['categories'] }) },
    onError: (e: any) => showToast(e.response?.data?.error||'Cannot delete.','error')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) return showToast('Category name is required.', 'error')
    if (!form.image.trim()) return showToast('Please upload or paste a category image.', 'error')
    saveMut.mutate({
      name,
      slug: (form.slug || slugify(name)).trim(),
      image: form.image.trim(),
      subcategories: form.subcategories.split(',').map(s=>s.trim()).filter(Boolean),
    })
  }

  return (
    <>
      {modal && (
        <div className="admin-modal-overlay" onClick={()=>setModal(null)}>
          <div className="admin-modal" onClick={e=>e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modal==='new'?'Add Category':'Edit Category'}</h3>
              <button className="admin-modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Category Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="form-input" required /></div>
              <div className="form-group"><label className="form-label">Slug</label><input value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value}))} className="form-input" placeholder="auto-generated if empty" /></div>
              <div className="form-group">
                <label className="form-label">Category Image *</label>
                <CategoryImagePicker image={form.image} onChange={img=>setForm(f=>({...f,image:img}))} />
              </div>
              <div className="form-group"><label className="form-label">Subcategories (comma-separated)</label><input value={form.subcategories} onChange={e=>setForm(f=>({...f,subcategories:e.target.value}))} className="form-input" placeholder="Dresses, Tops, Skirts" /></div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving...' : 'Save Category'}</button>
            </form>
          </div>
        </div>
      )}
      <div className="admin-card">
        <div className="admin-card-header"><h3>All Categories</h3><button className="btn btn-primary" onClick={()=>openModal()}>+ Add Category</button></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th></th><th>Name</th><th>Slug</th><th>Subcategories</th><th>Products</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.map(c=>(
                <tr key={c.id}>
                  <td data-label=""><img src={c.image} alt={c.name} className="admin-table-thumb" onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} /></td>
                  <td data-label="Name">{c.name}</td><td data-label="Slug">{c.slug}</td>
                  <td data-label="Subcategories">{(c.subcategories||[]).length}</td>
                  <td data-label="Products">{products.filter(p=>p.category_id===c.id).length}</td>
                  <td data-label="Actions"><div className="admin-table-actions">
                    <button className="admin-icon-btn" onClick={()=>openModal(c)}>✏️</button>
                    <button className="admin-icon-btn danger" onClick={()=>{if(confirm('Delete this category?'))deleteMut.mutate(c.id)}}>🗑️</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
