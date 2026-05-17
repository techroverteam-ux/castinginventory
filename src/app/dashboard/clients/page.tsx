'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Building2, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { RoleGuard } from '@/components/RoleGuard'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface ClientItem {
  _id: string
  name: string
  slug: string
  logo?: string
  contactEmail: string
  contactPhone?: string
  status: string
  createdAt: string
}

export default function ClientsPage() {
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <ClientManagement />
    </RoleGuard>
  )
}

function ClientManagement() {
  const [clients, setClients] = useState<ClientItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ name: '', contactEmail: '', contactPhone: '', address: '', logo: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10', search })
      const res = await fetchWithAuth(`/api/clients?${params}`)
      if (res.ok) { const data = await res.json(); setClients(data.clients); setTotal(data.total) }
    } catch {} finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchClients() }, [fetchClients])

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.contactEmail.trim()) e.contactEmail = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = 'Invalid email'
    setFormErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/clients', { method: 'POST', body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) {
        toast.success('Client created')
        setShowModal(false)
        setForm({ name: '', contactEmail: '', contactPhone: '', address: '', logo: '' })
        fetchClients()
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Client Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} clients</p>
        </div>
        <button onClick={() => setShowModal(true)} className="ci-button flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="ci-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search clients..." className="form-input pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ci-card p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                </div>
              </div>
            </div>
          ))
        ) : clients.length === 0 ? (
          <div className="col-span-full ci-card p-12 text-center">
            <Building2 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No clients yet</p>
          </div>
        ) : (
          clients.map(client => (
            <div key={client._id} className="ci-card p-5">
              <div className="flex items-center gap-3">
                {client.logo ? (
                  <img src={client.logo} alt={client.name} className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{client.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{client.contactEmail}</p>
                </div>
                <span className={`badge ${client.status === 'active' ? 'badge-green' : 'badge-red'}`}>{client.status}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs">Prev</button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs">Next</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content sm:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Client</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="form-label">Company Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Acme Corp" />
                {formErrors.name && <p className="text-danger text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="form-label">Contact Email *</label>
                <input type="email" className="form-input" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} placeholder="contact@company.com" />
                {formErrors.contactEmail && <p className="text-danger text-xs mt-1">{formErrors.contactEmail}</p>}
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="form-label">Logo URL</label>
                <input className="form-input" value={form.logo} onChange={e => setForm({ ...form, logo: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="form-label">Address</label>
                <textarea className="form-input min-h-[80px]" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="ci-button flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
