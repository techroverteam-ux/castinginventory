'use client'
import { useEffect, useState, useCallback } from 'react'
import { FileDown, BookOpen } from 'lucide-react'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { exportToExcel, exportToPDF } from '@/lib/export'

interface PartyItem { _id: string; code: string; name: string; currentBalance: number; currentBalanceType: string }
interface EntryItem { _id: string; recNo: number; date: string; partyId?: { name: string; code: string }; productId?: { name: string }; paymentModeId?: { name: string }; clientId?: { name: string }; pcs: number; rate: number; amount: number; remarks?: string; createdBy?: { name: string } }

export default function PartyLedgerPage() {
  const [parties, setParties] = useState<PartyItem[]>([])
  const [entries, setEntries] = useState<EntryItem[]>([])
  const [selectedParty, setSelectedParty] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const { user } = useCurrentUser()

  useEffect(() => {
    fetchWithAuth('/api/parties').then(r => r.ok ? r.json() : null).then(d => { if (d) setParties(d.parties) })
  }, [])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (selectedParty) params.set('partyId', selectedParty)
      if (filterFrom) params.set('from', filterFrom)
      if (filterTo) params.set('to', filterTo)
      const res = await fetchWithAuth(`/api/entries?${params}`)
      if (res.ok) { const d = await res.json(); setEntries(d.entries) }
    } catch {} finally { setLoading(false) }
  }, [selectedParty, filterFrom, filterTo])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const party = parties.find(p => p._id === selectedParty)
  const totalAmount = entries.reduce((s, e) => s + e.amount, 0)
  const totalPcs = entries.reduce((s, e) => s + e.pcs, 0)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const cols = [
    { header: 'Rec#', key: 'recNo', width: 8 }, { header: 'Date', key: 'date', width: 12 },
    { header: 'Party', key: 'party', width: 18 }, { header: 'Product', key: 'product', width: 12 },
    { header: 'Mode', key: 'mode', width: 10 }, { header: 'PCS', key: 'pcs', width: 6 },
    { header: 'Rate', key: 'rate', width: 8 }, { header: 'Amount', key: 'amount', width: 10 },
    { header: 'Created By', key: 'createdBy', width: 12 },
  ]
  const rows = entries.map(e => ({ recNo: e.recNo, date: formatDate(e.date), party: e.partyId?.name || '', product: e.productId?.name || '', mode: e.paymentModeId?.name || '', pcs: e.pcs, rate: `₹${e.rate}`, amount: `₹${e.amount}`, createdBy: e.createdBy?.name || '' }))

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Party Ledger</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{entries.length} entries · Total: ₹{totalAmount.toLocaleString('en-IN')}</p>
        </div>
        {entries.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => exportToExcel({ title: party ? `Ledger - ${party.name}` : 'All Entries Ledger', clientName: user?.clientName, columns: cols, data: rows, fileName: `ledger-${party?.name || 'all'}` })} className="btn-secondary text-xs flex items-center gap-1"><FileDown className="h-3.5 w-3.5" />Excel</button>
            <button onClick={() => exportToPDF({ title: party ? `Ledger - ${party.name}` : 'All Entries Ledger', clientName: user?.clientName, clientLogo: user?.clientLogo, columns: cols, data: rows, fileName: `ledger-${party?.name || 'all'}` })} className="btn-secondary text-xs flex items-center gap-1"><FileDown className="h-3.5 w-3.5" />PDF</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="ci-card p-4 flex flex-wrap items-center gap-3">
        <select className="form-select text-xs py-1.5 w-48" value={selectedParty} onChange={e => setSelectedParty(e.target.value)}>
          <option value="">All Parties</option>
          {parties.map(p => <option key={p._id} value={p._id}>{p.code} - {p.name}</option>)}
        </select>
        <input type="date" className="form-input text-xs py-1.5 w-36" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} placeholder="From" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" className="form-input text-xs py-1.5 w-36" value={filterTo} onChange={e => setFilterTo(e.target.value)} placeholder="To" />
        {party && (
          <div className="ml-auto">
            <span className={`badge text-sm ${party.currentBalanceType === 'Dr' ? 'badge-red' : 'badge-green'}`}>
              Balance: ₹{party.currentBalance.toFixed(2)} {party.currentBalanceType}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="ci-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Rec#</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Party</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Product</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Mode</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">PCS</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Rate</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Amount</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="table-row animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => <td key={j} className="px-3 py-2.5"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" /></td>)}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-xs">No entries found</p>
                </td></tr>
              ) : (
                <>
                  {entries.map(e => (
                    <tr key={e._id} className="table-row text-xs">
                      <td className="px-3 py-2 font-mono font-semibold">{e.recNo}</td>
                      <td className="px-3 py-2 text-gray-500">{formatDate(e.date)}</td>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{e.partyId?.name || '—'}</td>
                      <td className="px-3 py-2">{e.productId?.name || '—'}</td>
                      <td className="px-3 py-2">{e.paymentModeId?.name || '—'}</td>
                      <td className="px-3 py-2 text-right">{e.pcs}</td>
                      <td className="px-3 py-2 text-right">₹{e.rate.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-semibold">₹{e.amount.toFixed(2)}</td>
                      <td className="px-3 py-2 text-gray-500">{e.createdBy?.name || '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 dark:bg-gray-700/50 font-semibold text-sm">
                    <td colSpan={5} className="px-3 py-3 text-right">Total</td>
                    <td className="px-3 py-3 text-right">{totalPcs}</td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-right">₹{totalAmount.toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
