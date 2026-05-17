'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Search, Building2, X, Loader2, Upload, Copy, Check } from 'lucide-react'
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

interface Credentials {
  email: string
  password: string
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
  const [showCredentials, setShowCredentials] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, SVG allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setForm(prev => ({ ...prev, logo: data.url }))
        toast.success('Logo uploaded')
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
  }

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
        toast.success('Client created!')
        setShowModal(false)
        setForm({ name: '', contactEmail: '', contactPhone: '', address: '', logo: '' })
        setCredentials(data.credentials)
        setShowCredentials(true)
        fetchClients()
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const copyCredentials = () => {
    if (!credentials) return
    navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`)
    setCopied(true)
    toast.success('Credentials copied!')
    setTimeout(() => setCopied(false), 2000)
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

      {/* Add Client Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content sm:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Client</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Logo Upload */}
              <div>
                <label className="form-label">Logo</label>
                <div className="flex items-center gap-3">
                  {form.logo ? (
                    <img src={form.logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-600" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
              </div>

              <div>
                <label className="form-label">Company Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Acme Corp" />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="form-label">Contact Email * <span className="normal-case font-normal text-gray-400">(will be used as login)</span></label>
                <input type="email" className="form-input" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} placeholder="contact@company.com" />
                {formErrors.contactEmail && <p className="text-red-500 text-xs mt-1">{formErrors.contactEmail}</p>}
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="form-label">Address</label>
                <textarea className="form-input min-h-[70px]" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address..." />
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

      {/* Credentials Modal - shown after client creation */}
      {showCredentials && credentials && (
        <div className="modal-overlay" onClick={() => setShowCredentials(false)}>
          <div className="modal-content sm:max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Client Created!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Share these credentials with the client</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3 border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white mt-0.5">{credentials.email}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white mt-0.5">{credentials.password}</p>
              </div>
            </div>

            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 text-center">
              ⚠️ Client will be asked to change password on first login
            </p>

            <div className="flex gap-3 mt-5">
              <button onClick={copyCredentials} className="flex-1 btn-secondary flex items-center justify-center gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={() => setShowCredentials(false)} className="flex-1 ci-button">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
