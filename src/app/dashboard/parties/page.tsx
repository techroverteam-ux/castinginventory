'use client'
import { useEffect, useState } from 'react'
import { Plus, UserCheck, Loader2, Search, X, FileDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { exportToExcel, exportToPDF } from '@/lib/export'

interface PartyItem { _id: string; code: string; name: string; address?: string; phone?: string; gstin?: string; openingBalance: number; balanceType: string; currentBalance: number; currentBalanceType: string; status: string }

export default function PartiesPage() {
  const [parties, setParties] = useState<PartyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const { user } = useCurrentUser()

  const [form, setForm] = useState({ name: '', address: '', phone: '', gstin: '', openingBalance: '', balanceType: 'Dr' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [deleting, setDeleting] = useState(false)

  const fetchParties = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/parties')
      if (res.ok) { const d = await res.json(); setParties(d.parties) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchParties() }, [])

  const filtered = search
    ? parties.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search) || p.phone?.includes(search))
    : parties

  const resetForm = () => {
    setForm({ name: '', address: '', phone: '', gstin: '', openingBalance: '', balanceType: 'Dr' })
    setEditId(null)
    setFormErrors({})
  }

  const openEdit = (p: PartyItem) => {
    setEditId(p._id)
    setForm({ name: p.name, address: p.address || '', phone: p.phone || '', gstin: p.gstin || '', openingBalance: String(p.openingBalance || ''), balanceType: p.balanceType || 'Dr' })
    setShowModal(true)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Party name required'
    if (form.phone && form.phone.length !== 10) e.phone = 'Must be 10 digits'
    if (form.gstin && form.gstin.length !== 15) e.gstin = 'Must be 15 characters'
    setFormErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const url = editId ? `/api/parties/${editId}` : '/api/parties'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetchWithAuth(url, { method, body: JSON.stringify({ ...form, openingBalance: Number(form.openingBalance) || 0 }) })
      const data = await res.json()
      if (res.ok) {
        toast.success(editId ? 'Party updated' : 'Party created')
        setShowModal(false)
        resetForm()
        fetchParties()
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetchWithAuth(`/api/parties/${confirmModal.id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Party deleted'); fetchParties() }
      else { const d = await res.json(); toast.error(d.message || 'Failed') }
    } catch { toast.error('Failed') } finally { setDeleting(false); setConfirmModal({ open: false, id: '', name: '' }) }
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Parties</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{parties.length} parties</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToExcel({
            title: 'Party List', clientName: user?.clientName,
            columns: [{ header: 'Code', key: 'code', width: 8 }, { header: 'Name', key: 'name', width: 25 }, { header: 'Phone', key: 'phone', width: 12 }, { header: 'GSTIN', key: 'gstin', width: 16 }, { header: 'Balance', key: 'balance', width: 12 }],
            data: parties.map(p => ({ code: p.code, name: p.name, phone: p.phone || '', gstin: p.gstin || '', balance: `${p.currentBalance} ${p.currentBalanceType}` })),
            fileName: 'parties'
          })} className="btn-secondary text-xs flex items-center gap-1"><FileDown className="h-3.5 w-3.5" />Export</button>
          {user && ['superadmin', 'admin', 'manager'].includes(user.role) && (
            <button onClick={() => { resetForm(); setShowModal(true) }} className="ci-button flex items-center gap-2 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add Party
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="ci-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input className="form-input pl-10 text-sm" placeholder="Search by name, code, or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="ci-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Code</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Phone</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">GSTIN</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Balance</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row animate-pulse">
                    {[1,2,3,4,5,6].map(j => <td key={j} className="table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No parties found</p>
                </td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p._id} className="table-row">
                    <td className="table-cell font-mono font-semibold text-xs">{p.code}</td>
                    <td className="table-cell font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="table-cell text-xs">{p.phone ? `+91 ${p.phone}` : '—'}</td>
                    <td className="table-cell text-xs font-mono">{p.gstin || '—'}</td>
                    <td className={`table-cell text-right text-xs font-semibold ${p.currentBalanceType === 'Dr' ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{p.currentBalance.toFixed(2)} {p.currentBalanceType}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs">Edit</button>
                        <button onClick={() => setConfirmModal({ open: true, id: p._id, name: p.name })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-xs">Del</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Party Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content sm:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editId ? 'Edit Party' : 'Add Party'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Party Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. RAMESHWAR JI" />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Contact No.</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9876543210" inputMode="numeric" maxLength={10} />
                  {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                </div>
                <div>
                  <label className="form-label">GSTIN</label>
                  <input className="form-input uppercase" value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase().slice(0, 15) })} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                  {formErrors.gstin && <p className="text-red-500 text-xs mt-1">{formErrors.gstin}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="form-label">Opening Balance</label>
                  <input type="number" className="form-input" value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: e.target.value })} placeholder="0" min={0} step="0.01" />
                </div>
                <div>
                  <label className="form-label">Dr/Cr</label>
                  <select className="form-select" value={form.balanceType} onChange={e => setForm({ ...form, balanceType: e.target.value })}>
                    <option value="Dr">Dr</option>
                    <option value="Cr">Cr</option>
                  </select>
                </div>
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

      <ConfirmModal open={confirmModal.open} title="Delete Party" message={`Delete "${confirmModal.name}"? This cannot be undone.`} confirmText="Delete" variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setConfirmModal({ open: false, id: '', name: '' })} />
    </div>
  )
}
