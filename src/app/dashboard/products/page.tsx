'use client'
import { useEffect, useState } from 'react'
import { Plus, ShoppingBag, Loader2, X, Pencil, Trash2, LayoutGrid, List } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface RateSlab { minQty: number; rate: number }
interface ProductItem { _id: string; code: number; name: string; category: string; rateSlabs: RateSlab[]; remarks?: string; createdBy?: { name: string }; createdAt: string }

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'grid'>('list')
  const { user } = useCurrentUser()

  const [form, setForm] = useState({ name: '', category: 'gold', rateSlabs: [{ minQty: 1, rate: 0 }] as RateSlab[], remarks: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/products')
      if (res.ok) { const d = await res.json(); setProducts(d.products) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const resetForm = () => {
    setForm({ name: '', category: 'gold', rateSlabs: [{ minQty: 1, rate: 0 }], remarks: '' })
    setEditId(null)
    setFormErrors({})
  }

  const openEdit = (p: ProductItem) => {
    setEditId(p._id)
    setForm({ name: p.name, category: p.category || 'gold', rateSlabs: p.rateSlabs.length ? p.rateSlabs : [{ minQty: 1, rate: 0 }], remarks: p.remarks || '' })
    setShowModal(true)
  }

  const addSlab = () => {
    const lastQty = form.rateSlabs[form.rateSlabs.length - 1]?.minQty || 0
    setForm(prev => ({ ...prev, rateSlabs: [...prev.rateSlabs, { minQty: lastQty + 20, rate: 0 }] }))
  }

  const removeSlab = (i: number) => {
    if (form.rateSlabs.length <= 1) return
    setForm(prev => ({ ...prev, rateSlabs: prev.rateSlabs.filter((_, idx) => idx !== i) }))
  }

  const updateSlab = (i: number, field: 'minQty' | 'rate', value: number) => {
    setForm(prev => ({ ...prev, rateSlabs: prev.rateSlabs.map((s, idx) => idx === i ? { ...s, [field]: value } : s) }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Product name required'
    if (form.rateSlabs.some(s => s.rate < 0)) e.rateSlabs = 'Rates cannot be negative'
    setFormErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const url = editId ? `/api/products/${editId}` : '/api/products'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetchWithAuth(url, { method, body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) {
        toast.success(editId ? 'Product updated' : 'Product created')
        setShowModal(false)
        resetForm()
        fetchProducts()
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetchWithAuth(`/api/products/${confirmModal.id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Product deleted'); fetchProducts() }
      else { const d = await res.json(); toast.error(d.message || 'Failed') }
    } catch { toast.error('Failed') } finally { setDeleting(false); setConfirmModal({ open: false, id: '', name: '' }) }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Master</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{products.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setView('grid')} className={`p-1.5 rounded-md ${view === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}><LayoutGrid className="h-4 w-4" /></button>
          </div>
          {user && ['superadmin', 'admin', 'manager'].includes(user.role) && (
            <button onClick={() => { resetForm(); setShowModal(true) }} className="ci-button flex items-center gap-2 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="ci-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Code</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Category</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Rates</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Created</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="table-row animate-pulse">
                      {[1,2,3,4,5,6].map(j => <td key={j} className="table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>)}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No products yet</p>
                  </td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p._id} className="table-row">
                      <td className="table-cell font-mono font-semibold">{p.code}</td>
                      <td className="table-cell font-medium text-gray-900 dark:text-white">{p.name}</td>
                      <td className="table-cell"><span className={`badge ${p.category === 'gold' ? 'badge-yellow' : p.category === 'silver' ? 'badge-blue' : 'badge-purple'}`}>{p.category}</span></td>
                      <td className="table-cell text-xs">{p.rateSlabs.map((s, i) => <span key={i} className="mr-2">{s.minQty === 1 ? 'Main' : `≥${s.minQty}`}: ₹{s.rate}</span>)}</td>
                      <td className="table-cell text-xs text-gray-500">{p.createdBy?.name || '—'} · {formatDate(p.createdAt)}</td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setConfirmModal({ open: true, id: p._id, name: p.name })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="ci-card p-5 animate-pulse"><div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" /></div>)
          ) : products.length === 0 ? (
            <div className="col-span-full ci-card p-12 text-center">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-gray-300" /><p className="text-sm text-gray-400">No products yet</p>
            </div>
          ) : (
            products.map(p => (
              <div key={p._id} className="ci-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-mono text-gray-400">#{p.code}</span>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                  </div>
                  <span className={`badge text-[10px] ${p.category === 'gold' ? 'badge-yellow' : p.category === 'silver' ? 'badge-blue' : 'badge-purple'}`}>{p.category}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.rateSlabs.map((s, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{s.minQty === 1 ? 'Main' : `≥${s.minQty}`}: ₹{s.rate}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
                  <span className="text-[10px] text-gray-400">{p.createdBy?.name} · {formatDate(p.createdAt)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1 rounded text-blue-500 hover:bg-blue-50"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => setConfirmModal({ open: true, id: p._id, name: p.name })} className="p-1 rounded text-red-500 hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content sm:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editId ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. 10K, 22K, SILVER" />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="form-label">Category *</label>
                <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Rate Slabs</label>
                  <button type="button" onClick={addSlab} className="text-xs text-primary hover:text-indigo-700 font-medium flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
                </div>
                <div className="space-y-2">
                  {form.rateSlabs.map((slab, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="number" className="form-input text-xs py-2 w-20" placeholder="Min Qty" value={slab.minQty || ''} onChange={e => updateSlab(i, 'minQty', Number(e.target.value))} min={0} />
                      <span className="text-xs text-gray-400">→ ₹</span>
                      <input type="number" className="form-input text-xs py-2 flex-1" placeholder="Rate" value={slab.rate || ''} onChange={e => updateSlab(i, 'rate', Number(e.target.value))} min={0} step="0.01" />
                      {form.rateSlabs.length > 1 && <button onClick={() => removeSlab(i)} className="p-1 text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>}
                    </div>
                  ))}
                </div>
                {formErrors.rateSlabs && <p className="text-red-500 text-xs mt-1">{formErrors.rateSlabs}</p>}
              </div>
              <div>
                <label className="form-label">Remarks</label>
                <input className="form-input" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="ci-button flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : editId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={confirmModal.open} title="Delete Product" message={`Delete "${confirmModal.name}"?`} confirmText="Delete" variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setConfirmModal({ open: false, id: '', name: '' })} />
    </div>
  )
}
