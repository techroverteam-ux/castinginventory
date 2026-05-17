'use client'
import { useEffect, useState } from 'react'
import { Plus, CreditCard, Loader2, Power, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface ModeItem { _id: string; code: number; name: string; status: string; createdBy?: { name: string }; createdAt: string }

export default function PaymentModesPage() {
  const [modes, setModes] = useState<ModeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; confirmText: string; variant: 'danger' | 'warning'; action: () => Promise<void> }>({ open: false, title: '', message: '', confirmText: '', variant: 'danger', action: async () => {} })
  const { user } = useCurrentUser()

  const fetchModes = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/payment-modes?all=true')
      if (res.ok) { const d = await res.json(); setModes(d.modes) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchModes() }, [])

  const handleAdd = async () => {
    if (!name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/payment-modes', { method: 'POST', body: JSON.stringify({ name: name.trim() }) })
      const data = await res.json()
      if (res.ok) { toast.success('Payment mode added'); setName(''); fetchModes() }
      else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const askToggle = (m: ModeItem) => {
    const newStatus = m.status === 'active' ? 'inactive' : 'active'
    setConfirmModal({
      open: true,
      title: newStatus === 'inactive' ? 'Deactivate Mode' : 'Activate Mode',
      message: `${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} "${m.name}"? ${newStatus === 'inactive' ? 'It will not appear in Daily Entry dropdown.' : 'It will be available again.'}`,
      confirmText: newStatus === 'inactive' ? 'Deactivate' : 'Activate',
      variant: 'warning',
      action: async () => {
        const res = await fetchWithAuth(`/api/payment-modes/${m._id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
        if (res.ok) { toast.success(`Mode ${newStatus}`); fetchModes() }
        else { toast.error('Failed') }
      },
    })
  }

  const askDelete = (m: ModeItem) => {
    setConfirmModal({
      open: true, title: 'Delete Payment Mode',
      message: `Delete "${m.name}" permanently?`,
      confirmText: 'Delete', variant: 'danger',
      action: async () => {
        const res = await fetchWithAuth(`/api/payment-modes/${m._id}`, { method: 'DELETE' })
        if (res.ok) { toast.success('Deleted'); fetchModes() }
        else { toast.error('Failed') }
      },
    })
  }

  const handleConfirm = async () => {
    setActionLoading(true)
    try { await confirmModal.action() } finally { setActionLoading(false); setConfirmModal(prev => ({ ...prev, open: false })) }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Payment Mode Master</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="ci-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Add Payment Mode</h3>
          <div className="flex gap-2">
            <input className="form-input text-sm flex-1" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CASH, UPI, CREDIT, GPAY" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <button onClick={handleAdd} disabled={saving} className="ci-button text-xs flex items-center gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Code is auto-generated. Only active modes appear in Daily Entry.</p>
        </div>

        <div className="ci-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Code</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Created</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="table-row animate-pulse">
                      {[1,2,3,4,5].map(j => <td key={j} className="table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>)}
                    </tr>
                  ))
                ) : modes.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-xs">No payment modes. Add CASH, UPI, CREDIT to start.</p>
                  </td></tr>
                ) : (
                  modes.map(m => (
                    <tr key={m._id} className={`table-row ${m.status === 'inactive' ? 'opacity-50' : ''}`}>
                      <td className="table-cell font-mono font-semibold">{m.code}</td>
                      <td className="table-cell font-medium text-gray-900 dark:text-white">{m.name}</td>
                      <td className="table-cell"><span className={`badge ${m.status === 'active' ? 'badge-green' : 'badge-red'}`}>{m.status}</span></td>
                      <td className="table-cell text-xs text-gray-500">{m.createdBy?.name || '—'} · {formatDate(m.createdAt)}</td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => askToggle(m)} title={m.status === 'active' ? 'Deactivate' : 'Activate'} className={`p-1.5 rounded-lg transition-colors ${m.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}>
                            <Power className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => askDelete(m)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
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
        </div>
      </div>

      <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} confirmText={confirmModal.confirmText} variant={confirmModal.variant} loading={actionLoading} onConfirm={handleConfirm} onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))} />
    </div>
  )
}
