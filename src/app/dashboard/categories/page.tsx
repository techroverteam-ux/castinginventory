'use client'
import { useEffect, useState } from 'react'
import { Plus, Layers, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface Category { _id: string; name: string; description?: string; clientId?: { name: string }; createdAt: string }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { user } = useCurrentUser()

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/inventory/categories?limit=100')
      if (res.ok) { const data = await res.json(); setCategories(data.categories) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchCategories() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormErrors({ name: 'Required' }); return }
    setFormErrors({})
    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/inventory/categories', { method: 'POST', body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) {
        toast.success('Category created')
        setShowModal(false)
        setForm({ name: '', description: '' })
        fetchCategories()
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{categories.length} categories</p>
        </div>
        {user && ['superadmin', 'admin', 'manager'].includes(user.role) && (
          <button onClick={() => setShowModal(true)} className="ci-button flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ci-card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" />
            </div>
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-full ci-card p-12 text-center">
            <Layers className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No categories yet</p>
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat._id} className="ci-card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                  <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{cat.name}</p>
                  {cat.description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{cat.description}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content sm:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Category</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pipes & Fittings" />
                {formErrors.name && <p className="text-danger text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-input min-h-[80px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="ci-button flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
