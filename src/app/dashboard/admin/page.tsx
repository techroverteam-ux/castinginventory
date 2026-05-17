'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Users, X, Loader2, Power, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { RoleGuard } from '@/components/RoleGuard'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface UserItem {
  _id: string
  name: string
  email: string
  role: string
  phone?: string
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
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const { user } = useCurrentUser()

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; title: string; message: string; confirmText: string;
    variant: 'danger' | 'warning'; action: () => Promise<void>
  }>({ open: false, title: '', message: '', confirmText: '', variant: 'danger', action: async () => {} })

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

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    setForm(prev => ({ ...prev, phone: digits }))
  }

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters'
    if (form.phone) {
      if (form.phone.length !== 10) e.phone = 'Must be exactly 10 digits'
      else if (!/^[6-9]/.test(form.phone)) e.phone = 'Must start with 6, 7, 8, or 9'
    }
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
        setFormErrors({})
        fetchUsers()
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const askToggleStatus = (u: UserItem) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active'
    setConfirmModal({
      open: true,
      title: newStatus === 'inactive' ? 'Deactivate User' : 'Activate User',
      message: `Are you sure you want to ${newStatus === 'inactive' ? 'deactivate' : 'activate'} "${u.name}"? ${newStatus === 'inactive' ? 'They will not be able to login.' : 'They will regain access.'}`,
      confirmText: newStatus === 'inactive' ? 'Deactivate' : 'Activate',
      variant: newStatus === 'inactive' ? 'warning' : 'warning',
      action: async () => {
        const res = await fetchWithAuth(`/api/admin/users/${u._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        })
        if (res.ok) { toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`); fetchUsers() }
        else { const d = await res.json(); toast.error(d.message || 'Failed') }
      },
    })
  }

  const askDelete = (u: UserItem) => {
    setConfirmModal({
      open: true,
      title: 'Delete User',
      message: `Are you sure you want to delete "${u.name}"? This action cannot be undone and all their data will be permanently removed.`,
      confirmText: 'Delete',
      variant: 'danger',
      action: async () => {
        const res = await fetchWithAuth(`/api/admin/users/${u._id}`, { method: 'DELETE' })
        if (res.ok) { toast.success('User deleted'); fetchUsers() }
        else { const d = await res.json(); toast.error(d.message || 'Failed') }
      },
    })
  }

  const handleConfirm = async () => {
    setActionLoading(true)
    try { await confirmModal.action() } finally {
      setActionLoading(false)
      setConfirmModal(prev => ({ ...prev, open: false }))
    }
  }

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { superadmin: 'badge-purple', admin: 'badge-yellow', manager: 'badge-blue', viewer: 'badge-green' }
    return map[role] || 'badge-blue'
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

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

      <div className="ci-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search users..." className="form-input pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <div className="ci-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Email</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Role</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Created</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (<td key={j} className="table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-40" /><p className="text-sm">No users found</p>
                </td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className={`table-row ${u.status === 'inactive' ? 'opacity-50' : ''}`}>
                    <td className="table-cell font-medium text-gray-900 dark:text-white">{u.name}</td>
                    <td className="table-cell text-xs">{u.email}</td>
                    <td className="table-cell"><span className={`badge ${roleBadge(u.role)}`}>{u.role}</span></td>
                    <td className="table-cell"><span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>{u.status}</span></td>
                    <td className="table-cell text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => askToggleStatus(u)}
                          disabled={u._id === user?.id}
                          title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${u.status === 'active' ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10'}`}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => askDelete(u)}
                          disabled={u._id === user?.id || u.role === 'superadmin'}
                          title="Delete"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="form-label">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pr-10"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
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
                <label className="form-label">Phone <span className="normal-case font-normal text-gray-400">(10 digits)</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 font-medium">+91</span>
                  <input className="form-input pl-12" value={form.phone} onChange={e => handlePhoneChange(e.target.value)} placeholder="9876543210" maxLength={10} inputMode="numeric" />
                </div>
                {form.phone && form.phone.length > 0 && form.phone.length < 10 && (<p className="text-amber-500 text-xs mt-1">{form.phone.length}/10 digits</p>)}
                {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setFormErrors({}) }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="ci-button flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
      />
    </div>
  )
}
