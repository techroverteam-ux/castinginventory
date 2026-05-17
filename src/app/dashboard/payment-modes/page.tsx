'use client'
import { useEffect, useState } from 'react'
import { Plus, CreditCard, Loader2, Power, Trash2, LayoutGrid, List } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface ModeItem { _id: string; code: number; name: string; status: string; createdBy?: { name: string }; clientId?: { name: string }; createdAt: string }

export default function PaymentModesPage() {
  const [modes, setModes] = useState<ModeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')
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
      if (res.ok) { toast.success('Added'); setName(''); fetchModes() }
      else { const d = await res.json(); toast.error(d.message || 'Failed') }
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const askToggle = (m: ModeItem) => {
    const newStatus = m.status === 'active' ? 'inactive' : 'active'
    setConfirmModal({
      open: true, title: newStatus === 'inactive' ? 'Deactivate' : 'Activate',
      message: `${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} "${m.name}"?`,
      confirmText: newStatus === 'inactive' ? 'Deactivate' : 'Activate', variant: 'warning',
      action: async () => {
        const res = await fetchWithAuth(`/api/payment-modes/${m._id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
        if (res.ok) { toast.success('Updated'); fetchModes() } else toast.error('Failed')
      },
    })
  }

  const askDelete = (m: ModeItem) => {
    setConfirmModal({
      open: true, title: 'Delete', message: `Delete "${m.name}" permanently?`,
      confirmText: 'Delete', variant: 'danger',
      action: async () => {
        const res = await fetchWithAuth(`/api/payment-modes/${m._id}`, { method: 'DELETE' })
        if (res.ok) { toast.success('Deleted'); fetchModes() } else toast.error('Failed')
      },
    })
  }

  const handleConfirm = async () => {
    setActionLoading(true)
    try { await confirmModal.action() } finally { setActionLoading(false); setConfirmModal(prev => ({ ...prev, open: false })) }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Modes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{modes.length} modes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setView('grid')} className={`p-1.5 rounded-md ${view === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}><LayoutGrid className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* Add Form */}
      <div className="ci-card p-4 flex flex-wrap items-center gap-3">
        <input className="form-input text-sm flex-1 min-w-[200px]" value={name} onChange={e => setName(e.target.value)} placeholder="Enter mode name (e.g. CASH, UPI, CREDIT, GPAY)" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <button onClick={handleAdd} disabled={saving} className="ci-button text-xs flex items-center gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add Mode
        </button>
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
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No payment modes. Add CASH, UPI, CREDIT to start.</p>
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
                          <button onClick={() => askToggle(m)} className={`p-1.5 rounded-lg transition-colors ${m.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}><Power className="h-3.5 w-3.5" /></button>
                          <button onClick={() => askDelete(m)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
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
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="ci-card p-4 animate-pulse"><div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" /></div>)
          ) : modes.length === 0 ? (
            <div className="col-span-full ci-card p-12 text-center">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-300" /><p className="text-sm text-gray-400">No payment modes</p>
            </div>
          ) : (
            modes.map(m => (
              <div key={m._id} className={`ci-card p-4 ${m.status === 'inactive' ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{m.code}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.name}</span>
                  </div>
                  <span className={`badge text-[10px] ${m.status === 'active' ? 'badge-green' : 'badge-red'}`}>{m.status}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
                  <span className="text-[10px] text-gray-400">{m.createdBy?.name} · {formatDate(m.createdAt)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => askToggle(m)} className={`p-1 rounded ${m.status === 'active' ? 'text-amber-600' : 'text-green-600'}`}><Power className="h-3 w-3" /></button>
                    <button onClick={() => askDelete(m)} className="p-1 rounded text-red-500"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} confirmText={confirmModal.confirmText} variant={confirmModal.variant} loading={actionLoading} onConfirm={handleConfirm} onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))} />
    </div>
  )
}
