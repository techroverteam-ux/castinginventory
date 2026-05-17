'use client'
import { useEffect, useState } from 'react'
import { Package, Layers, Building2, Users, AlertTriangle, XCircle, CheckCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface Stats {
  totalItems: number
  totalCategories: number
  totalClients: number
  totalUsers: number
  lowStock: number
  outOfStock: number
  inStock: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useCurrentUser()
  const role = user?.role || 'viewer'

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/dashboard/stats')
      if (res.ok) setStats(await res.json())
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  const cards = stats ? [
    { label: 'Total Items', value: stats.totalItems, icon: Package, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', href: '/dashboard/inventory' },
    { label: 'Categories', value: stats.totalCategories, icon: Layers, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20', href: '/dashboard/categories' },
    { label: 'In Stock', value: stats.inStock, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', href: '/dashboard/inventory?status=in_stock' },
    { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', href: '/dashboard/inventory?status=low_stock' },
    { label: 'Out of Stock', value: stats.outOfStock, icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', href: '/dashboard/inventory?status=out_of_stock' },
    ...(role === 'superadmin' ? [
      { label: 'Clients', value: stats.totalClients, icon: Building2, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', href: '/dashboard/clients' },
      { label: 'Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', href: '/dashboard/admin' },
    ] : []),
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            {role === 'superadmin' ? 'Super Admin Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {user?.clientName ? `${user.clientName} · ` : ''}Overview of your inventory
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="ci-card p-3.5 flex items-center gap-3 animate-pulse" style={{ minHeight: 96 }}>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                </div>
              </div>
            ))
          : cards.map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.label} href={card.href} className="ci-card p-3.5 flex items-center gap-3 hover:shadow-lg group" style={{ minHeight: 96 }}>
                  <div className={`p-2.5 rounded-xl ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{card.label}</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
                  </div>
                </Link>
              )
            })
        }
      </div>
    </div>
  )
}
