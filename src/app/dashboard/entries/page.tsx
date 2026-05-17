'use client'
import { useEffect, useState, useCallback } from 'react'
import { BookOpen, Loader2, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface PartyItem { _id: string; code: string; name: string }
interface ProductItem { _id: string; code: number; name: string; rateSlabs: { minQty: number; rate: number }[] }
interface ModeItem { _id: string; code: number; name: string }
interface EntryItem { _id: string; recNo: number; date: string; partyId?: { name: string; code: string }; productId?: { name: string; code: number }; paymentModeId?: { name: string }; pcs: number; rate: number; amount: number; cashAmount: number; upiAmount: number; creditAmount: number; remarks?: string; createdBy?: { name: string } }

export default function EntriesPage() {
  const [entries, setEntries] = useState<EntryItem[]>([])
  const [parties, setParties] = useState<PartyItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [modes, setModes] = useState<ModeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useCurrentUser()

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    date: today, paymentModeId: '', partyCode: '', partyId: '', partyName: '',
    productCode: '', productId: '', productName: '',
    pcs: '', rate: '', amount: '',
    cashAmount: '', upiAmount: '', creditAmount: '',
    jobworkerCode: '', remarks: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Filters
  const [filterFrom, setFilterFrom] = useState(today)
  const [filterTo, setFilterTo] = useState(today)

  const fetchMasters = async () => {
    const [pRes, prRes, mRes] = await Promise.all([
      fetchWithAuth('/api/parties'), fetchWithAuth('/api/products'), fetchWithAuth('/api/payment-modes'),
    ])
    if (pRes.ok) { const d = await pRes.json(); setParties(d.parties) }
    if (prRes.ok) { const d = await prRes.json(); setProducts(d.products) }
    if (mRes.ok) { const d = await mRes.json(); setModes(d.modes) }
  }

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ from: filterFrom, to: filterTo, limit: '50' })
      const res = await fetchWithAuth(`/api/entries?${params}`)
      if (res.ok) { const d = await res.json(); setEntries(d.entries) }
    } catch {} finally { setLoading(false) }
  }, [filterFrom, filterTo])

  useEffect(() => { fetchMasters() }, [])
  useEffect(() => { fetchEntries() }, [fetchEntries])

  // Code-based lookups
  const handlePartyCode = (code: string) => {
    setForm(prev => ({ ...prev, partyCode: code }))
    const party = parties.find(p => p.code === code)
    if (party) setForm(prev => ({ ...prev, partyId: party._id, partyName: party.name }))
    else setForm(prev => ({ ...prev, partyId: '', partyName: '' }))
  }

  const handleProductCode = (code: string) => {
    setForm(prev => ({ ...prev, productCode: code }))
    const product = products.find(p => String(p.code) === code)
    if (product) {
      setForm(prev => ({ ...prev, productId: product._id, productName: product.name }))
      // Auto-fill rate from slab
      if (form.pcs && product.rateSlabs?.length) {
        const qty = Number(form.pcs)
        const sorted = [...product.rateSlabs].sort((a, b) => b.minQty - a.minQty)
        const slab = sorted.find(s => qty >= s.minQty)
        if (slab) setForm(prev => ({ ...prev, rate: String(slab.rate), amount: String(qty * slab.rate) }))
      }
    } else setForm(prev => ({ ...prev, productId: '', productName: '' }))
  }

  const handlePcsChange = (pcs: string) => {
    setForm(prev => ({ ...prev, pcs }))
    const qty = Number(pcs)
    const rate = Number(form.rate)
    if (qty > 0 && rate > 0) setForm(prev => ({ ...prev, amount: String(qty * rate) }))
    // Auto rate from product
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
    if (!form.paymentModeId) e.paymentModeId = 'Required'
    if (!form.partyId) e.partyId = 'Invalid party code'
    if (!form.productId) e.productId = 'Invalid product code'
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
          date: form.date,
          paymentModeId: form.paymentModeId,
          partyId: form.partyId,
          productId: form.productId,
          pcs: Number(form.pcs),
          rate: Number(form.rate),
          cashAmount: Number(form.cashAmount) || 0,
          upiAmount: Number(form.upiAmount) || 0,
          creditAmount: Number(form.creditAmount) || 0,
          jobworkerCode: form.jobworkerCode,
          remarks: form.remarks,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Entry #${data.entry.recNo} saved | Balance: ${data.netBalance} ${data.netBalanceType}`)
        // Reset form but keep date and mode
        setForm(prev => ({ ...prev, partyCode: '', partyId: '', partyName: '', productCode: '', productId: '', productName: '', pcs: '', rate: '', amount: '', cashAmount: '', upiAmount: '', creditAmount: '', jobworkerCode: '', remarks: '' }))
        setFormErrors({})
        fetchEntries()
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const handleReset = () => {
    setForm({ date: today, paymentModeId: '', partyCode: '', partyId: '', partyName: '', productCode: '', productId: '', productName: '', pcs: '', rate: '', amount: '', cashAmount: '', upiAmount: '', creditAmount: '', jobworkerCode: '', remarks: '' })
    setFormErrors({})
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Daily Entry Book</h1>
      </div>

      {/* Entry Form */}
      <div className="ci-card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-input text-xs" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Payment Mode *</label>
            <select className="form-select text-xs" value={form.paymentModeId} onChange={e => setForm({ ...form, paymentModeId: e.target.value })}>
              <option value="">Select</option>
              {modes.map(m => <option key={m._id} value={m._id}>{m.code} - {m.name}</option>)}
            </select>
            {formErrors.paymentModeId && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.paymentModeId}</p>}
          </div>
          <div>
            <label className="form-label">Party Code *</label>
            <div className="flex gap-1">
              <input className="form-input text-xs w-16" value={form.partyCode} onChange={e => handlePartyCode(e.target.value)} placeholder="Code" />
              <input className="form-input text-xs flex-1 bg-gray-100 dark:bg-gray-700" value={form.partyName} disabled placeholder="Party name" />
            </div>
            {formErrors.partyId && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.partyId}</p>}
          </div>
          <div>
            <label className="form-label">Product Code *</label>
            <div className="flex gap-1">
              <input className="form-input text-xs w-16" value={form.productCode} onChange={e => handleProductCode(e.target.value)} placeholder="Code" />
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
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-3">
          <div>
            <label className="form-label">Amount</label>
            <input className="form-input text-xs bg-gray-100 dark:bg-gray-700 font-semibold" value={form.amount} disabled />
          </div>
          <div>
            <label className="form-label">Cash ₹</label>
            <input type="number" className="form-input text-xs" value={form.cashAmount} onChange={e => setForm({ ...form, cashAmount: e.target.value })} min={0} />
          </div>
          <div>
            <label className="form-label">UPI ₹</label>
            <input type="number" className="form-input text-xs" value={form.upiAmount} onChange={e => setForm({ ...form, upiAmount: e.target.value })} min={0} />
          </div>
          <div>
            <label className="form-label">Credit ₹</label>
            <input type="number" className="form-input text-xs" value={form.creditAmount} onChange={e => setForm({ ...form, creditAmount: e.target.value })} min={0} placeholder="Auto" />
          </div>
          <div>
            <label className="form-label">Jobworker</label>
            <input className="form-input text-xs" value={form.jobworkerCode} onChange={e => setForm({ ...form, jobworkerCode: e.target.value })} placeholder="Code" />
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
      </div>

      {/* Filter & Entry Table */}
      <div className="ci-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 uppercase">Filter:</span>
          <input type="date" className="form-input text-xs py-1.5 w-36" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" className="form-input text-xs py-1.5 w-36" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
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
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Cash</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">UPI</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Credit</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row animate-pulse">
                    {Array.from({ length: 11 }).map((_, j) => <td key={j} className="px-3 py-2.5"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" /></td>)}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">
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
                    <td className="px-3 py-2.5 text-right text-green-600">{e.cashAmount > 0 ? `₹${e.cashAmount.toFixed(2)}` : ''}</td>
                    <td className="px-3 py-2.5 text-right text-blue-600">{e.upiAmount > 0 ? `₹${e.upiAmount.toFixed(2)}` : ''}</td>
                    <td className="px-3 py-2.5 text-right text-red-600">{e.creditAmount > 0 ? `₹${e.creditAmount.toFixed(2)}` : ''}</td>
                    <td className="px-3 py-2.5 text-gray-500">{formatDate(e.date)}</td>
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
