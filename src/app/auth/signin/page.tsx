'use client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useTheme } from '@/components/ThemeProvider'
import { Moon, Sun, Eye, EyeOff, ArrowRight, Package, Loader2 } from 'lucide-react'

export default function SignIn() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const { theme, toggleTheme } = useTheme()

  const validate = () => {
    const e: typeof errors = {}
    if (!formData.email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email format'
    if (!formData.password) e.password = 'Password is required'
    else if (formData.password.length < 6) e.password = 'Password must be at least 6 characters'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Signed in successfully!')
        window.location.href = '/dashboard'
      } else {
        toast.error(data.message || 'Sign in failed')
      }
    } catch {
      toast.error(navigator.onLine ? 'Connection failed. Please try again.' : 'No internet connection')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = (field: string) =>
    `relative rounded-xl border-2 transition-all duration-200 ${
      errors[field as keyof typeof errors]
        ? 'border-danger bg-red-50/50 dark:bg-red-900/10'
        : focusedField === field
        ? 'border-primary shadow-[0_0_0_3px_rgba(79,70,229,0.12)]'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
    }`

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Theme toggle - top right */}
      <div className="fixed top-4 right-4 z-10">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[420px] mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-elegant border border-gray-200/80 dark:border-gray-700/60 p-6 sm:p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center shadow-brand">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Casting Inventory</span>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Sign in to your account
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Enter your credentials to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email address
              </label>
              <div className={fieldClass('email')}>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-sm rounded-xl"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })) }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              {errors.email && <p className="text-danger text-xs mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className={fieldClass('password')}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-11 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-sm rounded-xl"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })) }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1.5">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gradient text-white font-semibold py-3.5 px-6 rounded-xl shadow-brand hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          &copy; 2026 Casting Inventory. All rights reserved.
        </p>
      </div>
    </div>
  )
}
