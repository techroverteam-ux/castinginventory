'use client'
import { useEffect, useState } from 'react'
import { BookOpen, UserCheck, ShoppingBag, CreditCard, TrendingUp, RefreshCw, ArrowRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

type Period = 'today' | 'week' | 'month' | 'custom'

interface Stats {
  todayEntries: number
  todayAmount: number
  totalParties: number
  totalProducts: number
  periodEntries: number
  periodAmount: number
  paymentWise: { mode: string; amount: number; count: number }[]
  recentEntries: { _id: string; recNo: number; partyId?: { name: string }; productId?: { name: string }; paymentModeId?: { name: string }; amount: number; date: string }[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const { user } = useCurrentUser()

  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period })
      if (period === 'custom' && customFrom && customTo) {
        params.set('from', customFrom)
        params.set('to', customTo)
      }
      const res = await fetchWithAuth(`/api/dashboard/stats?${params}`)
      if (res.ok) setStats(await res.json())
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [period, customFrom, customTo])

  const periodLabel = period === 'today' ? "Today" : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'Custom Range'

  const kpis = stats ? [
    { label: `Entries · ${periodLabel}`, value: stats.periodEntries, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', href: '/dashboard/entries' },
    { label: `Revenue · ${periodLabel}`, value: `₹${stats.periodAmount.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', href: '/dashboard/entries' },
    { label: 'Total Parties', value: stats.totalParties, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', href: '/dashboard/parties' },
    { label: 'Products', value: stats.totalProducts, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', href: '/dashboard/products' },
  ] : []

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

  return (
    <div className="space-y-6">
      {/* Header + Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {user?.clientName ? `${user.clientName} · ` : ''}Welcome, {user?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
            {(['today', 'week', 'month', 'custom'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${period === p ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                {p === 'today' ? 'Today' : p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Custom'}
              </button>
            ))}
          </div>
          <button onClick={fetchStats} disabled={loading} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      {period === 'custom' && (
        <div className="ci-card p-4 flex flex-wrap items-center gap-3">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input type="date" className="form-input text-xs py-1.5 w-36" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" className="form-input text-xs py-1.5 w-36" value={customTo} onChange={e => setCustomTo(e.target.value)} />
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ci-card p-4 animate-pulse">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1" />
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            </div>
          ))
        ) : (
          kpis.map(kpi => {
            const Icon = kpi.icon
            return (
              <Link key={kpi.label} href={kpi.href} className="ci-card p-4 hover:shadow-lg transition-all">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-[10px] text-gray-500 uppercase font-medium tracking-wide">{kpi.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 truncate">{kpi.value}</p>
              </Link>
            )
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Payment-wise Revenue */}
        <div className="ci-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Payment Mode Breakdown</h3>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />)}</div>
          ) : stats?.paymentWise?.length ? (
            <div className="space-y-3">
              {stats.paymentWise.map((pw, i) => {
                const maxAmount = Math.max(...stats.paymentWise.map(p => p.amount))
                const pct = maxAmount > 0 ? (pw.amount / maxAmount) * 100 : 0
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{pw.mode}</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">₹{pw.amount.toLocaleString('en-IN')} <span className="text-gray-400 font-normal">({pw.count})</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">No data for this period</p>
          )}
        </div>

        {/* Recent Entries */}
        <div className="ci-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Entries</h3>
            <Link href="/dashboard/entries" className="text-xs text-primary hover:text-indigo-700 font-medium flex items-center gap-1">View All <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex justify-between animate-pulse"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" /><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></div>)}</div>
          ) : stats?.recentEntries?.length ? (
            <div className="space-y-2">
              {stats.recentEntries.map(e => (
                <div key={e._id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">#{e.recNo} · {e.partyId?.name || '—'}</p>
                    <p className="text-xs text-gray-500">{e.productId?.name || ''} · {e.paymentModeId?.name || ''} · {formatDate(e.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600 ml-3">₹{e.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8"><BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" /><p className="text-xs text-gray-400">No entries yet</p></div>
          )}
        </div>
      </div>
    </div>
  )
}
