'use client'
import { useEffect, useState } from 'react'
import { BookOpen, UserCheck, ShoppingBag, CreditCard, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface Stats {
  todayEntries: number
  todayAmount: number
  totalParties: number
  totalProducts: number
  totalEntries: number
  totalAmount: number
  recentEntries: { _id: string; recNo: number; partyId?: { name: string }; productId?: { name: string }; amount: number; date: string }[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useCurrentUser()

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/dashboard/stats')
      if (res.ok) setStats(await res.json())
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  const kpis = stats ? [
    { label: "Today's Entries", value: stats.todayEntries, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', href: '/dashboard/entries' },
    { label: "Today's Amount", value: `₹${stats.todayAmount.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', href: '/dashboard/entries' },
    { label: 'Total Parties', value: stats.totalParties, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', href: '/dashboard/parties' },
    { label: 'Products', value: stats.totalProducts, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', href: '/dashboard/products' },
    { label: 'All Time Entries', value: stats.totalEntries, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', href: '/dashboard/entries' },
    { label: 'All Time Amount', value: `₹${stats.totalAmount.toLocaleString('en-IN')}`, icon: CreditCard, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', href: '/dashboard/entries' },
  ] : []

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {user?.clientName ? `${user.clientName} · ` : ''}Welcome back, {user?.name}
          </p>
        </div>
        <button onClick={fetchStats} disabled={loading} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
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
              <Link key={kpi.label} href={kpi.href} className="ci-card p-4 hover:shadow-lg transition-all group">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide">{kpi.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 truncate">{kpi.value}</p>
              </Link>
            )
          })
        )}
      </div>

      {/* Recent Entries + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Entries */}
        <div className="ci-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Entries</h3>
            <Link href="/dashboard/entries" className="text-xs text-primary hover:text-indigo-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                </div>
              ))}
            </div>
          ) : stats?.recentEntries?.length ? (
            <div className="space-y-2">
              {stats.recentEntries.map(e => (
                <div key={e._id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      #{e.recNo} · {e.partyId?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">{e.productId?.name || ''} · {formatDate(e.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600 ml-3">₹{e.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-400">No entries yet. Start adding daily entries.</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="ci-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/dashboard/entries" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">New Entry</p>
                <p className="text-xs text-gray-500">Add daily soldering entry</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
            </Link>
            <Link href="/dashboard/parties" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Add Party</p>
                <p className="text-xs text-gray-500">Register new customer</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
            </Link>
            <Link href="/dashboard/products" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Add Product</p>
                <p className="text-xs text-gray-500">Gold, Silver, etc.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
