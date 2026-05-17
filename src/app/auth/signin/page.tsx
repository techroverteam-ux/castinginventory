'use client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Package, Loader2 } from 'lucide-react'

export default function SignIn() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!formData.email) e.email = 'Please enter your email address'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Please enter a valid email'
    if (!formData.password) e.password = 'Please enter your password'
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
        toast.success('Welcome back!')
        window.location.href = '/dashboard'
      } else {
        toast.error(data.message || 'Sign in failed')
      }
    } catch {
      toast.error(navigator.onLine ? 'Connection failed.' : 'No internet connection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#fff' }}>
      {/* Logo */}
      <div className="w-[50px] h-[50px] bg-[#4F46E5] rounded-[14px] flex items-center justify-center mb-6">
        <Package className="h-6 w-6 text-white" />
      </div>

      {/* Heading */}
      <h1 className="text-[32px] font-semibold text-[#0d0d0d] mb-2 text-center leading-tight">
        Welcome back
      </h1>
      <p className="text-[15px] text-[#6e6e80] mb-8 text-center">
        Log in to Casting Inventory
      </p>

      {/* Form - direct fields, no card */}
      <form onSubmit={handleSubmit} className="w-full max-w-[340px] space-y-3" noValidate>
        {/* Email */}
        <div>
          <label className="block text-[13px] font-medium text-[#0d0d0d] mb-1.5">
            Email address *
          </label>
          <input
            type="email"
            className={`w-full h-[52px] px-4 text-[15px] text-[#0d0d0d] bg-white border rounded-md placeholder-[#8e8ea0] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all ${
              errors.email ? 'border-red-500' : 'border-[#c5c5d2]'
            }`}
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })) }}
          />
          {errors.email && <p className="text-[#ef4444] text-[12px] mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-[13px] font-medium text-[#0d0d0d] mb-1.5">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`w-full h-[52px] px-4 pr-12 text-[15px] text-[#0d0d0d] bg-white border rounded-md placeholder-[#8e8ea0] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all ${
                errors.password ? 'border-red-500' : 'border-[#c5c5d2]'
              }`}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })) }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e8ea0] hover:text-[#0d0d0d] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
          {errors.password && <p className="text-[#ef4444] text-[12px] mt-1">{errors.password}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px] mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
              Signing in...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="w-full max-w-[340px] flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[#e5e5e5]" />
        <span className="text-[12px] text-[#8e8ea0]">OR</span>
        <div className="flex-1 h-px bg-[#e5e5e5]" />
      </div>

      {/* Google button placeholder */}
      <button
        type="button"
        disabled
        className="w-full max-w-[340px] h-[52px] flex items-center justify-center gap-3 border border-[#c5c5d2] rounded-md text-[15px] text-[#0d0d0d] font-medium hover:bg-[#f7f7f8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-[12px] text-[#8e8ea0]">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}
