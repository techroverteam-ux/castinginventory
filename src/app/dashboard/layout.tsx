'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, Users, Settings, LogOut,
  Menu, X, Moon, Sun, ChevronRight, Building2,
  BookOpen, UserCheck, ShoppingBag, PanelLeftClose, PanelLeft, MessageSquare, CreditCard,
} from 'lucide-react'
import { useCurrentUser, CurrentUserProvider } from '@/components/CurrentUserProvider'
import { useTheme } from '@/components/ThemeProvider'
import { UserRole } from '@/types'

interface NavItem {
  name: string
  href: string
  icon: any
  roles: UserRole[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'manager', 'viewer'] },
  { name: 'Daily Entry', href: '/dashboard/entries', icon: BookOpen, roles: ['superadmin', 'admin', 'manager'] },
  { name: 'Products', href: '/dashboard/products', icon: ShoppingBag, roles: ['superadmin', 'admin', 'manager'] },
  { name: 'Parties', href: '/dashboard/parties', icon: UserCheck, roles: ['superadmin', 'admin', 'manager', 'viewer'] },
  { name: 'Payment Modes', href: '/dashboard/payment-modes', icon: CreditCard, roles: ['superadmin', 'admin'] },
  { name: 'Clients', href: '/dashboard/clients', icon: Building2, roles: ['superadmin'] },
  { name: 'WhatsApp Config', href: '/dashboard/settings', icon: MessageSquare, roles: ['superadmin'] },
  { name: 'User Management', href: '/dashboard/admin', icon: Users, roles: ['superadmin', 'admin'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['superadmin', 'admin'] },
]

const mobileNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'manager', 'viewer'] },
  { name: 'Entry', href: '/dashboard/entries', icon: BookOpen, roles: ['superadmin', 'admin', 'manager'] },
  { name: 'Parties', href: '/dashboard/parties', icon: UserCheck, roles: ['superadmin', 'admin', 'manager', 'viewer'] },
  { name: 'Products', href: '/dashboard/products', icon: ShoppingBag, roles: ['superadmin', 'admin', 'manager'] },
  { name: 'More', href: '/dashboard/settings', icon: Settings, roles: ['superadmin', 'admin', 'manager', 'viewer'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrentUserProvider>
      <DashboardShell>{children}</DashboardShell>
    </CurrentUserProvider>
  )
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { user } = useCurrentUser()

  const userRole: UserRole = user?.role || 'viewer'
  const userName = user?.name || ''

  useEffect(() => {
    if (user?.mustChangePassword && pathname !== '/dashboard/change-password') {
      router.replace('/dashboard/change-password')
    }
  }, [user, pathname, router])

  // Restore collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const filteredNav = navigation.filter(item => item.roles.includes(userRole))
  const filteredMobileNav = mobileNav.filter(item => item.roles.includes(userRole))

  const currentPage = navigation.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))
  const pageTitle = currentPage?.name || 'Casting Inventory'

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } finally {
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      router.push('/auth/signin')
    }
  }

  const NavLink = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const Icon = item.icon
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    return (
      <Link href={item.href} onClick={onClick} className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`} title={collapsed ? item.name : undefined}>
        <Icon className={`${collapsed ? '' : 'mr-3'} h-[18px] w-[18px] flex-shrink-0 ${isActive ? 'text-primary' : 'opacity-60'}`} />
        {!collapsed && <span className="truncate">{item.name}</span>}
        {!collapsed && isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/60 flex-shrink-0" />}
      </Link>
    )
  }

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-5'} pt-6 pb-5 flex-shrink-0`}>
        {user?.clientLogo ? (
          <img src={user.clientLogo} alt="Logo" className={`${collapsed ? 'h-8 w-8 rounded-lg object-cover' : 'h-10 w-auto max-w-[180px] object-contain'}`} />
        ) : (
          <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
            <div className="w-9 h-9 bg-brand-gradient rounded-xl flex items-center justify-center shadow-brand flex-shrink-0">
              <Package className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-none">Casting Inventory</h1>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Management System</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User pill */}
      {user && !collapsed && (
        <div className="mx-3 mb-4 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            userRole === 'superadmin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
            : userRole === 'admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
          }`}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-none">{userName}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize mt-0.5">{userRole}</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} space-y-0.5 overflow-y-auto`}>
        {filteredNav.map((item) => (
          <NavLink key={item.href + item.name} item={item} onClick={onNavClick} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-white/[0.06] p-3 space-y-1">
        {/* Collapse toggle - desktop only */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex w-full items-center px-3 py-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-[18px] w-[18px] mx-auto" /> : <><PanelLeftClose className="mr-3 h-[18px] w-[18px]" /><span>Collapse</span></>}
        </button>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-150`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className={`${collapsed ? '' : 'mr-3'} h-[18px] w-[18px] opacity-70`} />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col max-w-[280px] w-full h-full bg-white dark:bg-gray-800 shadow-2xl border-r border-gray-200 dark:border-gray-700/60">
            <button className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 z-10" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavClick={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className={`flex flex-col ${collapsed ? 'w-[68px]' : 'w-[260px]'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700/60 transition-all duration-200`}>
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <header className="sticky top-0 z-10 h-14 sm:h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700/60 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button className="md:hidden -ml-1 h-9 w-9 inline-flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">{pageTitle}</h2>
              <p className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 truncate capitalize">
                {user?.clientName ? `${user.clientName} · ` : ''}{userRole === 'superadmin' ? 'Super Administrator' : userRole}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="h-4 w-4 text-gray-600" /> : <Sun className="h-4 w-4 text-gray-300" />}
            </button>
          </div>
        </header>

        <main className="flex-1 relative overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-4 sm:p-5 md:p-6 pb-20 md:pb-6 min-h-full">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700/60 flex items-center justify-around px-2 py-1">
        {filteredMobileNav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href + item.name} href={item.href} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0 ${isActive ? 'text-primary' : 'text-gray-400'}`}>
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-medium truncate max-w-[52px]">{item.name}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
