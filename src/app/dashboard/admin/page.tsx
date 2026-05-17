'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Users, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { RoleGuard } from '@/components/RoleGuard'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface UserItem {
  _id: string
  name: string
  email: string
  role: string
  status: string
  clientId?: { _id: string; name: string }
  createdAt: string
}

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['superadmin', 'admin']}>
      <UserManagement />
    </RoleGuard>
  )
}

function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useCurrentUser()

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer', phone: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10', search })
      const res = await fetchWithAuth(`/api/admin/users?${params}`)
      if (res.ok) { const data = await res.json(); setUsers(data.users); setTotal(data.total) }
    } catch {} finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) return undefined
    const cleaned = phone.trim()
    if (!/^[\+\d]/.test(cleaned)) return 'Must start with + or digit'
    const digits = cleaned.replace(/[\s\-\(\)\+]/g, '')
    if (!/^\d+$/.test(digits)) return 'Contains invalid characters'
    if (digits.length < 10) return 'Must be at least 10 digits'
    if (digits.length > 15) return 'Must not exceed 15 digits'
    return undefined
  }

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters'
    const phoneErr = validatePhone(form.phone)
    if (phoneErr) e.phone = phoneErr
    setFormErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/admin/users', { method: 'POST', body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) {
        toast.success('User created')
        setShowModal(false)
        setForm({ name: '', email: '', password: '', role: 'viewer', phone: '' })
        fetchUsers()
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { superadmin: 'badge-purple', admin: 'badge-yellow', manager: 'badge-blue', viewer: 'badge-green' }
    return map[role] || 'badge-blue'
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} users</p>
        </div>
        <button onClick={() => setShowModal(true)} className="ci-button flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="ci-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="form-input pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="ci-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Email</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Role</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Client</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No users found</p>
                </td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="table-row">
                    <td className="table-cell font-medium text-gray-900 dark:text-white">{u.name}</td>
                    <td className="table-cell">{u.email}</td>
                    <td className="table-cell"><span className={`badge ${roleBadge(u.role)}`}>{u.role}</span></td>
                    <td className="table-cell">{u.clientId?.name || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>{u.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content sm:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add User</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                {formErrors.name && <p className="text-danger text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
                {formErrors.email && <p className="text-danger text-xs mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="form-label">Password *</label>
                <input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
                {formErrors.password && <p className="text-danger text-xs mt-1">{formErrors.password}</p>}
              </div>
              <div>
                <label className="form-label">Role *</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {user?.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                  {user?.role === 'superadmin' && <option value="admin">Admin</option>}
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" maxLength={16} />
                {formErrors.phone && <p className="text-danger text-xs mt-1">{formErrors.phone}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="ci-button flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
