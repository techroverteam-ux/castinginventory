'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Package, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface Item {
  _id: string
  name: string
  sku: string
  quantity: number
  weight?: number
  unit?: string
  material?: string
  status: string
  categoryId?: { _id: string; name: string }
  clientId?: { _id: string; name: string }
  createdAt: string
}

interface Category { _id: string; name: string }

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const { user } = useCurrentUser()

  const [form, setForm] = useState({ name: '', categoryId: '', sku: '', quantity: '', weight: '', unit: 'kg', material: '', description: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10', search, status: statusFilter })
      const res = await fetchWithAuth(`/api/inventory/items?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
        setTotal(data.total)
      }
    } catch {} finally { setLoading(false) }
  }, [page, search, statusFilter])

  const fetchCategories = async () => {
    const res = await fetchWithAuth('/api/inventory/categories?limit=100')
    if (res.ok) { const data = await res.json(); setCategories(data.categories) }
  }

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => { fetchCategories() }, [])

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.categoryId) e.categoryId = 'Required'
    if (!form.sku.trim()) e.sku = 'Required'
    if (!form.quantity || Number(form.quantity) < 0) e.quantity = 'Valid quantity required'
    setFormErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/inventory/items', {
        method: 'POST',
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), weight: form.weight ? Number(form.weight) : undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Item added successfully')
        setShowModal(false)
        setForm({ name: '', categoryId: '', sku: '', quantity: '', weight: '', unit: 'kg', material: '', description: '' })
        fetchItems()
      } else {
        toast.error(data.message || 'Failed to add item')
      }
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      in_stock: 'badge-green',
      low_stock: 'badge-yellow',
      out_of_stock: 'badge-red',
    }
    return map[status] || 'badge-blue'
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Items</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} items total</p>
        </div>
        {user && ['superadmin', 'admin', 'manager'].includes(user.role) && (
          <button onClick={() => setShowModal(true)} className="ci-button flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="ci-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            className="form-input pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="form-select w-full sm:w-44"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="ci-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Item</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">SKU</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Category</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Qty</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Material</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No items found</p>
                </td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="table-row">
                    <td className="table-cell font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="table-cell font-mono text-xs">{item.sku}</td>
                    <td className="table-cell">{item.categoryId?.name || '—'}</td>
                    <td className="table-cell font-semibold">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</td>
                    <td className="table-cell">{item.material || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${statusBadge(item.status)}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700/50">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5">Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content sm:max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Inventory Item</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Item Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Steel Rod 10mm" />
                  {formErrors.name && <p className="text-danger text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="form-label">SKU *</label>
                  <input className="form-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. SR-10MM-001" />
                  {formErrors.sku && <p className="text-danger text-xs mt-1">{formErrors.sku}</p>}
                </div>
                <div>
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  {formErrors.categoryId && <p className="text-danger text-xs mt-1">{formErrors.categoryId}</p>}
                </div>
                <div>
                  <label className="form-label">Quantity *</label>
                  <input type="number" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" min="0" />
                  {formErrors.quantity && <p className="text-danger text-xs mt-1">{formErrors.quantity}</p>}
                </div>
                <div>
                  <label className="form-label">Weight</label>
                  <input type="number" className="form-input" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="0" min="0" step="0.01" />
                </div>
                <div>
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    <option value="kg">Kg</option>
                    <option value="g">Grams</option>
                    <option value="pcs">Pieces</option>
                    <option value="ltr">Liters</option>
                    <option value="m">Meters</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Material</label>
                  <input className="form-input" value={form.material} onChange={e => setForm({ ...form, material: e.target.value })} placeholder="e.g. Cast Iron, Aluminum" />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-input min-h-[80px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="ci-button flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
