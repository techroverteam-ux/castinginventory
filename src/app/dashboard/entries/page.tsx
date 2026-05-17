'use client'
import { useEffect, useState, useCallback } from 'react'
import { BookOpen, Loader2, FileDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { exportToExcel, exportToPDF } from '@/lib/export'

interface PartyItem { _id: string; code: string; name: string }
interface ProductItem { _id: string; code: number; name: string; rateSlabs: { minQty: number; rate: number }[] }
interface ModeItem { _id: string; code: number; name: string }
interface WorkerItem { _id: string; name: string; email: string }
interface EntryItem { _id: string; recNo: number; date: string; partyId?: { name: string; code: string }; productId?: { name: string; code: number }; paymentModeId?: { name: string }; pcs: number; rate: number; amount: number; jobworkerCode?: string; remarks?: string; createdBy?: { name: string }; createdAt: string }

export default function EntriesPage() {
  const [entries, setEntries] = useState<EntryItem[]>([])
  const [parties, setParties] = useState<PartyItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [modes, setModes] = useState<ModeItem[]>([])
  const [workers, setWorkers] = useState<WorkerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useCurrentUser()

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    date: today, paymentModeId: '', paymentCode: '',
    partyCode: '', partyId: '', partyName: '',
    productCode: '', productId: '', productName: '',
    pcs: '', rate: '', amount: '',
    jobworkerCode: '', jobworkerName: '',
    remarks: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [filterFrom, setFilterFrom] = useState(today)
  const [filterTo, setFilterTo] = useState(today)
  const [filterParty, setFilterParty] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterMode, setFilterMode] = useState('')

  const fetchMasters = async () => {
    const [pRes, prRes, mRes, wRes] = await Promise.all([
      fetchWithAuth('/api/parties'),
      fetchWithAuth('/api/products'),
      fetchWithAuth('/api/payment-modes'),
      fetchWithAuth('/api/admin/users?limit=100'),
    ])
    if (pRes.ok) { const d = await pRes.json(); setParties(d.parties) }
    if (prRes.ok) { const d = await prRes.json(); setProducts(d.products) }
    if (mRes.ok) { const d = await mRes.json(); setModes(d.modes) }
    if (wRes.ok) { const d = await wRes.json(); setWorkers(d.users || []) }
  }

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ from: filterFrom, to: filterTo, limit: '50' })
      if (filterParty) params.set('partyId', filterParty)
      if (filterProduct) params.set('productId', filterProduct)
      if (filterMode) params.set('paymentModeId', filterMode)
      const res = await fetchWithAuth(`/api/entries?${params}`)
      if (res.ok) { const d = await res.json(); setEntries(d.entries) }
    } catch {} finally { setLoading(false) }
  }, [filterFrom, filterTo, filterParty, filterProduct, filterMode])

  useEffect(() => { fetchMasters() }, [])
  useEffect(() => { fetchEntries() }, [fetchEntries])

  // Code-based auto-fill
  const handlePaymentCode = (code: string) => {
    setForm(prev => ({ ...prev, paymentCode: code, paymentModeId: '' }))
    const mode = modes.find(m => String(m.code) === code)
    if (mode) setForm(prev => ({ ...prev, paymentModeId: mode._id }))
  }

  const handlePartyCode = (code: string) => {
    setForm(prev => ({ ...prev, partyCode: code, partyId: '', partyName: '' }))
    const party = parties.find(p => p.code === code)
    if (party) setForm(prev => ({ ...prev, partyId: party._id, partyName: party.name }))
  }

  const handleProductCode = (code: string) => {
    setForm(prev => ({ ...prev, productCode: code, productId: '', productName: '' }))
    const product = products.find(p => String(p.code) === code)
    if (product) {
      const qty = Number(form.pcs) || 1
      let autoRate = 0
      if (product.rateSlabs?.length) {
        const sorted = [...product.rateSlabs].sort((a, b) => b.minQty - a.minQty)
        const slab = sorted.find(s => qty >= s.minQty)
        autoRate = slab?.rate || product.rateSlabs[0].rate
      }
      setForm(prev => ({ ...prev, productId: product._id, productName: product.name, rate: String(autoRate), amount: String(qty * autoRate) }))
    }
  }

  const handleJobworkerCode = (code: string) => {
    setForm(prev => ({ ...prev, jobworkerCode: code, jobworkerName: '' }))
    // Find worker by index (code 1 = first worker, 2 = second, etc.)
    const idx = Number(code) - 1
    if (idx >= 0 && idx < workers.length) {
      setForm(prev => ({ ...prev, jobworkerName: workers[idx].name }))
    }
  }

  const handlePcsChange = (pcs: string) => {
    setForm(prev => ({ ...prev, pcs }))
    const qty = Number(pcs)
    const rate = Number(form.rate)
    if (qty > 0 && rate > 0) setForm(prev => ({ ...prev, amount: String(qty * rate) }))
    // Auto rate from product slab
    if (qty > 0 && form.productId) {
      const product = products.find(p => p._id === form.productId)
      if (product?.rateSlabs?.length) {
        const sorted = [...product.rateSlabs].sort((a, b) => b.minQty - a.minQty)
        const slab = sorted.find(s => qty >= s.minQty)
        if (slab) setForm(prev => ({ ...prev, rate: String(slab.rate), amount: String(qty * slab.rate) }))
      }
    }
  }

  const handleRateChange = (rate: string) => {
    setForm(prev => ({ ...prev, rate }))
    const qty = Number(form.pcs)
    if (qty > 0 && Number(rate) > 0) setForm(prev => ({ ...prev, amount: String(qty * Number(rate)) }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.paymentModeId) e.paymentModeId = 'Enter valid code'
    if (!form.partyId) e.partyId = 'Enter valid code'
    if (!form.productId) e.productId = 'Enter valid code'
    if (!form.pcs || Number(form.pcs) < 1) e.pcs = 'Required'
    if (!form.rate || Number(form.rate) <= 0) e.rate = 'Required'
    setFormErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/entries', {
        method: 'POST',
        body: JSON.stringify({
          date: form.date, paymentModeId: form.paymentModeId,
          partyId: form.partyId, productId: form.productId,
          pcs: Number(form.pcs), rate: Number(form.rate),
          jobworkerCode: form.jobworkerCode, remarks: form.remarks,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Entry #${data.entry.recNo} saved | Balance: ₹${data.netBalance} ${data.netBalanceType}`)
        setForm(prev => ({ ...prev, partyCode: '', partyId: '', partyName: '', productCode: '', productId: '', productName: '', pcs: '', rate: '', amount: '', jobworkerCode: '', jobworkerName: '', remarks: '' }))
        setFormErrors({})
        fetchEntries()
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const handleReset = () => {
    setForm({ date: today, paymentModeId: '', paymentCode: '', partyCode: '', partyId: '', partyName: '', productCode: '', productId: '', productName: '', pcs: '', rate: '', amount: '', jobworkerCode: '', jobworkerName: '', remarks: '' })
    setFormErrors({})
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const formatDateTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const exportCols = [
    { header: 'Rec#', key: 'recNo', width: 8 }, { header: 'Mode', key: 'mode', width: 10 },
    { header: 'Party', key: 'party', width: 20 }, { header: 'Product', key: 'product', width: 12 },
    { header: 'Qty', key: 'pcs', width: 6 }, { header: 'Rate', key: 'rate', width: 8 },
    { header: 'Amount', key: 'amount', width: 10 }, { header: 'Date', key: 'date', width: 10 },
    { header: 'Created By', key: 'createdBy', width: 15 },
  ]
  const exportRows = entries.map(e => ({ recNo: e.recNo, mode: e.paymentModeId?.name || '', party: e.partyId?.name || '', product: e.productId?.name || '', pcs: e.pcs, rate: `₹${e.rate}`, amount: `₹${e.amount}`, date: formatDate(e.date), createdBy: e.createdBy?.name || '' }))

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Daily Entry Book</h1>
      </div>

      {/* Entry Form */}
      <div className="ci-card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-input text-xs" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Payment Code *</label>
            <div className="flex gap-1">
              <input className="form-input text-xs w-12" value={form.paymentCode} onChange={e => handlePaymentCode(e.target.value)} placeholder="#" inputMode="numeric" />
              <input className="form-input text-xs flex-1 bg-gray-100 dark:bg-gray-700" value={modes.find(m => m._id === form.paymentModeId)?.name || ''} disabled placeholder="Mode" />
            </div>
            {formErrors.paymentModeId && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.paymentModeId}</p>}
          </div>
          <div>
            <label className="form-label">Party Code *</label>
            <div className="flex gap-1">
              <input className="form-input text-xs w-12" value={form.partyCode} onChange={e => handlePartyCode(e.target.value)} placeholder="#" />
              <input className="form-input text-xs flex-1 bg-gray-100 dark:bg-gray-700" value={form.partyName} disabled placeholder="Party" />
            </div>
            {formErrors.partyId && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.partyId}</p>}
          </div>
          <div>
            <label className="form-label">Product Code *</label>
            <div className="flex gap-1">
              <input className="form-input text-xs w-12" value={form.productCode} onChange={e => handleProductCode(e.target.value)} placeholder="#" inputMode="numeric" />
              <input className="form-input text-xs flex-1 bg-gray-100 dark:bg-gray-700" value={form.productName} disabled placeholder="Product" />
            </div>
            {formErrors.productId && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.productId}</p>}
          </div>
          <div>
            <label className="form-label">PCS *</label>
            <input type="number" className="form-input text-xs" value={form.pcs} onChange={e => handlePcsChange(e.target.value)} min={1} />
            {formErrors.pcs && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.pcs}</p>}
          </div>
          <div>
            <label className="form-label">Rate *</label>
            <input type="number" className="form-input text-xs" value={form.rate} onChange={e => handleRateChange(e.target.value)} min={0} step="0.01" />
            {formErrors.rate && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.rate}</p>}
          </div>
          <div>
            <label className="form-label">Amount</label>
            <input className="form-input text-xs bg-gray-100 dark:bg-gray-700 font-semibold" value={form.amount ? `₹${form.amount}` : ''} disabled />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="form-label">Jobworker Code</label>
            <div className="flex gap-1">
              <input className="form-input text-xs w-12" value={form.jobworkerCode} onChange={e => handleJobworkerCode(e.target.value)} placeholder="#" inputMode="numeric" />
              <input className="form-input text-xs flex-1 bg-gray-100 dark:bg-gray-700" value={form.jobworkerName} disabled placeholder="Worker name" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Remarks</label>
            <input className="form-input text-xs" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={handleSave} disabled={saving} className="ci-button text-xs flex items-center gap-2">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
          </button>
          <button onClick={handleReset} className="btn-secondary text-xs">Reset</button>
        </div>

        {/* Workers reference */}
        {workers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
            <p className="text-[10px] text-gray-400 mb-1">Jobworker Codes:</p>
            <div className="flex flex-wrap gap-2">
              {workers.map((w, i) => (
                <span key={w._id} className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{i + 1} = {w.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter & Entry Table */}
      <div className="ci-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 flex flex-wrap items-center gap-2">
          <input type="date" className="form-input text-xs py-1.5 w-32" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" className="form-input text-xs py-1.5 w-32" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
          <select className="form-select text-xs py-1.5 w-28" value={filterMode} onChange={e => setFilterMode(e.target.value)}>
            <option value="">All Modes</option>
            {modes.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
          <select className="form-select text-xs py-1.5 w-36" value={filterParty} onChange={e => setFilterParty(e.target.value)}>
            <option value="">All Parties</option>
            {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select className="form-select text-xs py-1.5 w-28" value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
            <option value="">All Products</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <div className="ml-auto flex gap-1.5">
            <button onClick={() => exportToExcel({ title: 'Daily Entry Report', clientName: user?.clientName, columns: exportCols, data: exportRows, fileName: `entries-${filterFrom}` })} className="btn-secondary text-[10px] px-2.5 py-1.5 flex items-center gap-1"><FileDown className="h-3 w-3" />Excel</button>
            <button onClick={() => exportToPDF({ title: 'Daily Entry Report', clientName: user?.clientName, clientLogo: user?.clientLogo, columns: exportCols, data: exportRows, fileName: `entries-${filterFrom}` })} className="btn-secondary text-[10px] px-2.5 py-1.5 flex items-center gap-1"><FileDown className="h-3 w-3" />PDF</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Rec#</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Mode</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Party</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Product</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Qty</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Rate</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Amount</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Jobworker</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Created By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => <td key={j} className="px-3 py-2.5"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" /></td>)}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-xs">No entries for this date range</p>
                </td></tr>
              ) : (
                entries.map(e => (
                  <tr key={e._id} className="table-row text-xs">
                    <td className="px-3 py-2.5 font-mono font-semibold">{e.recNo}</td>
                    <td className="px-3 py-2.5">{e.paymentModeId?.name || '—'}</td>
                    <td className="px-3 py-2.5 font-medium">{e.partyId?.name || '—'}</td>
                    <td className="px-3 py-2.5">{e.productId?.name || '—'}</td>
                    <td className="px-3 py-2.5 text-right">{e.pcs}</td>
                    <td className="px-3 py-2.5 text-right">₹{e.rate.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">₹{e.amount.toFixed(2)}</td>
                    <td className="px-3 py-2.5">{e.jobworkerCode ? (workers.find((_, i) => String(i + 1) === e.jobworkerCode)?.name || e.jobworkerCode) : '—'}</td>
                    <td className="px-3 py-2.5 text-gray-500">{formatDate(e.date)}</td>
                    <td className="px-3 py-2.5 text-gray-500">{e.createdBy?.name || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
