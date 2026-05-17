'use client'
import { useEffect, useState } from 'react'
import { Plus, CreditCard, Loader2, Trash2, Power } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface ModeItem { _id: string; code: number; name: string; status: string }

export default function PaymentModesPage() {
  const [modes, setModes] = useState<ModeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const { user } = useCurrentUser()

  const fetchModes = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/payment-modes')
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

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Payment Mode Master</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Add Form */}
        <div className="ci-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Add Payment Mode</h3>
          <div className="flex gap-2">
            <input className="form-input text-sm flex-1" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CASH, UPI, CREDIT" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <button onClick={handleAdd} disabled={saving} className="ci-button text-xs flex items-center gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Code is auto-generated. Modes are used in Daily Entry dropdown.</p>
        </div>

        {/* List */}
        <div className="ci-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Code</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="table-row animate-pulse">
                      {[1,2,3].map(j => <td key={j} className="table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>)}
                    </tr>
                  ))
                ) : modes.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-xs">No payment modes yet. Add CASH, UPI, CREDIT to get started.</p>
                  </td></tr>
                ) : (
                  modes.map(m => (
                    <tr key={m._id} className="table-row">
                      <td className="table-cell font-mono font-semibold">{m.code}</td>
                      <td className="table-cell font-medium text-gray-900 dark:text-white">{m.name}</td>
                      <td className="table-cell"><span className="badge badge-green">active</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
