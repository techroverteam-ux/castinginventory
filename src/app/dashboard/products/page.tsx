'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, ShoppingBag, Loader2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface RateSlab { minQty: number; rate: number }
interface ProductItem { _id: string; code: number; name: string; rateSlabs: RateSlab[]; remarks?: string; status: string }

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { user } = useCurrentUser()

  const [form, setForm] = useState({ name: '', rateSlabs: [{ minQty: 1, rate: 0 }] as RateSlab[], remarks: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/products')
      if (res.ok) { const data = await res.json(); setProducts(data.products) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const resetForm = () => {
    setForm({ name: '', rateSlabs: [{ minQty: 1, rate: 0 }], remarks: '' })
    setSelectedId(null)
    setFormErrors({})
  }

  const openProduct = (p: ProductItem) => {
    setSelectedId(p._id)
    setForm({ name: p.name, rateSlabs: p.rateSlabs.length ? p.rateSlabs : [{ minQty: 1, rate: 0 }], remarks: p.remarks || '' })
    setFormErrors({})
  }

  const addRateSlab = () => {
    const lastQty = form.rateSlabs[form.rateSlabs.length - 1]?.minQty || 0
    setForm(prev => ({ ...prev, rateSlabs: [...prev.rateSlabs, { minQty: lastQty + 20, rate: 0 }] }))
  }

  const removeRateSlab = (index: number) => {
    if (form.rateSlabs.length <= 1) return
    setForm(prev => ({ ...prev, rateSlabs: prev.rateSlabs.filter((_, i) => i !== index) }))
  }

  const updateSlab = (index: number, field: 'minQty' | 'rate', value: number) => {
    setForm(prev => ({
      ...prev,
      rateSlabs: prev.rateSlabs.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }))
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
      const url = selectedId ? `/api/products/${selectedId}` : '/api/products'
      const method = selectedId ? 'PATCH' : 'POST'
      const res = await fetchWithAuth(url, { method, body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) {
        toast.success(selectedId ? 'Product updated' : 'Product created')
        resetForm()
        fetchProducts()
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetchWithAuth(`/api/products/${confirmModal.id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Product deleted'); resetForm(); fetchProducts() }
      else { const d = await res.json(); toast.error(d.message || 'Failed') }
    } catch { toast.error('Failed') } finally {
      setDeleting(false)
      setConfirmModal({ open: false, id: '', name: '' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Product Master</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="ci-card p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {selectedId ? 'Edit Product' : 'New Product'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="form-label">Code</label>
              <input className="form-input bg-gray-100 dark:bg-gray-700" value={selectedId ? products.find(p => p._id === selectedId)?.code || 'Auto' : 'Auto'} disabled />
            </div>
            <div>
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. 10K, 22K, SILVER, GOLD 916" />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            {/* Dynamic Rate Slabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label mb-0">Rate Slabs</label>
                <button type="button" onClick={addRateSlab} className="text-xs text-primary hover:text-indigo-700 font-medium flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add Slab
                </button>
              </div>
              <div className="space-y-2">
                {form.rateSlabs.map((slab, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        className="form-input text-xs py-2"
                        placeholder="Min Qty"
                        value={slab.minQty || ''}
                        onChange={e => updateSlab(i, 'minQty', Number(e.target.value))}
                        min={0}
                      />
                    </div>
                    <span className="text-xs text-gray-400">→</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        className="form-input text-xs py-2"
                        placeholder="Rate ₹"
                        value={slab.rate || ''}
                        onChange={e => updateSlab(i, 'rate', Number(e.target.value))}
                        min={0}
                        step="0.01"
                      />
                    </div>
                    {form.rateSlabs.length > 1 && (
                      <button onClick={() => removeRateSlab(i)} className="p-1 text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                ))}
              </div>
              {formErrors.rateSlabs && <p className="text-red-500 text-xs mt-1">{formErrors.rateSlabs}</p>}
              <p className="text-[10px] text-gray-400 mt-1">Min Qty = minimum pieces for that rate to apply</p>
            </div>

            <div>
              <label className="form-label">Remarks</label>
              <textarea className="form-input min-h-[60px]" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Optional..." />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={handleSave} disabled={saving} className="ci-button flex items-center gap-2 text-xs">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save
              </button>
              <button onClick={resetForm} className="btn-secondary text-xs">
                {selectedId ? 'Close' : 'Reset'}
              </button>
              {selectedId && (
                <button
                  onClick={() => setConfirmModal({ open: true, id: selectedId, name: form.name })}
                  className="px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="ci-card overflow-hidden lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Code</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Rates</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="table-row animate-pulse">
                      {[1,2,3,4].map(j => <td key={j} className="table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>)}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No products yet</p>
                  </td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p._id} onClick={() => openProduct(p)} className={`table-row cursor-pointer ${selectedId === p._id ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                      <td className="table-cell font-mono font-semibold">{p.code}</td>
                      <td className="table-cell font-medium text-gray-900 dark:text-white">{p.name}</td>
                      <td className="table-cell text-xs">
                        {p.rateSlabs.map((s, i) => (
                          <span key={i} className="inline-block mr-2">
                            {s.minQty === 1 ? 'Main' : `≥${s.minQty}`}: <span className="font-semibold">₹{s.rate}</span>
                          </span>
                        ))}
                      </td>
                      <td className="table-cell text-xs text-gray-500">{p.remarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmModal.name}"? This will deactivate the product.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ open: false, id: '', name: '' })}
      />
    </div>
  )
}
