'use client'
import { useEffect, useState } from 'react'
import { FileDown, UserCheck } from 'lucide-react'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { exportToExcel, exportToPDF } from '@/lib/export'

interface PartyItem { _id: string; code: string; name: string; currentBalance: number; currentBalanceType: string }
interface EntryItem { _id: string; recNo: number; date: string; productId?: { name: string }; paymentModeId?: { name: string }; pcs: number; rate: number; amount: number; remarks?: string }

export default function PartyLedgerPage() {
  const [parties, setParties] = useState<PartyItem[]>([])
  const [entries, setEntries] = useState<EntryItem[]>([])
  const [selectedParty, setSelectedParty] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useCurrentUser()

  useEffect(() => {
    fetchWithAuth('/api/parties').then(r => r.ok ? r.json() : null).then(d => { if (d) setParties(d.parties) })
  }, [])

  const fetchLedger = async (partyId: string) => {
    if (!partyId) { setEntries([]); return }
    setLoading(true)
    try {
      const res = await fetchWithAuth(`/api/entries?partyId=${partyId}&limit=500`)
      if (res.ok) { const d = await res.json(); setEntries(d.entries) }
    } catch {} finally { setLoading(false) }
  }

  const handlePartyChange = (id: string) => {
    setSelectedParty(id)
    fetchLedger(id)
  }

  const party = parties.find(p => p._id === selectedParty)
  const totalAmount = entries.reduce((s, e) => s + e.amount, 0)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const cols = [
    { header: 'Rec#', key: 'recNo', width: 8 }, { header: 'Date', key: 'date', width: 12 },
    { header: 'Product', key: 'product', width: 12 }, { header: 'Mode', key: 'mode', width: 10 },
    { header: 'PCS', key: 'pcs', width: 6 }, { header: 'Rate', key: 'rate', width: 8 },
    { header: 'Amount', key: 'amount', width: 10 },
  ]
  const rows = entries.map(e => ({ recNo: e.recNo, date: formatDate(e.date), product: e.productId?.name || '', mode: e.paymentModeId?.name || '', pcs: e.pcs, rate: `₹${e.rate}`, amount: `₹${e.amount}` }))

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Party Ledger</h1>
        {entries.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => exportToExcel({ title: `Ledger - ${party?.name}`, clientName: user?.clientName, columns: cols, data: rows, fileName: `ledger-${party?.name}` })} className="btn-secondary text-xs flex items-center gap-1"><FileDown className="h-3.5 w-3.5" />Excel</button>
            <button onClick={() => exportToPDF({ title: `Ledger - ${party?.name}`, clientName: user?.clientName, clientLogo: user?.clientLogo, columns: cols, data: rows, fileName: `ledger-${party?.name}` })} className="btn-secondary text-xs flex items-center gap-1"><FileDown className="h-3.5 w-3.5" />PDF</button>
          </div>
        )}
      </div>

      {/* Party Selector */}
      <div className="ci-card p-4 flex flex-wrap items-center gap-4">
        <select className="form-select w-64" value={selectedParty} onChange={e => handlePartyChange(e.target.value)}>
          <option value="">Select Party</option>
          {parties.map(p => <option key={p._id} value={p._id}>{p.code} - {p.name}</option>)}
        </select>
        {party && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{party.name}</span>
            <span className={`badge ${party.currentBalanceType === 'Dr' ? 'badge-red' : 'badge-green'}`}>
              ₹{party.currentBalance.toFixed(2)} {party.currentBalanceType}
            </span>
          </div>
        )}
      </div>

      {/* Entries Table */}
      {selectedParty && (
        <div className="ci-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Rec#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Product</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Mode</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">PCS</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Rate</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="table-row animate-pulse">
                      {[1,2,3,4,5,6,7].map(j => <td key={j} className="table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14" /></td>)}
                    </tr>
                  ))
                ) : entries.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-xs">No entries for this party</p>
                  </td></tr>
                ) : (
                  <>
                    {entries.map(e => (
                      <tr key={e._id} className="table-row text-sm">
                        <td className="table-cell font-mono">{e.recNo}</td>
                        <td className="table-cell text-xs">{formatDate(e.date)}</td>
                        <td className="table-cell">{e.productId?.name || '—'}</td>
                        <td className="table-cell text-xs">{e.paymentModeId?.name || '—'}</td>
                        <td className="table-cell text-right">{e.pcs}</td>
                        <td className="table-cell text-right">₹{e.rate.toFixed(2)}</td>
                        <td className="table-cell text-right font-semibold">₹{e.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                      <td colSpan={6} className="px-4 py-3 text-right text-sm">Total</td>
                      <td className="px-4 py-3 text-right text-sm">₹{totalAmount.toFixed(2)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
