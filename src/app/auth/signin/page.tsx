'use client'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Package, Loader2, ArrowLeft } from 'lucide-react'

type Step = 'credentials' | 'otp'

export default function SignIn() {
  const [step, setStep] = useState<Step>('credentials')
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [otpError, setOtpError] = useState('')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }
  }, [step])

  const validate = () => {
    const e: typeof errors = {}
    if (!formData.email) e.email = 'Please enter your email address'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Please enter a valid email'
    if (!formData.password) e.password = 'Please enter your password'
    else if (formData.password.length < 6) e.password = 'Password must be at least 6 characters'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
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
      if (data.requireOtp) {
        toast.success('OTP sent to your email')
        setStep('otp')
      } else if (res.ok) {
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

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setOtpError('')

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP')
      return
    }
    setLoading(true)
    setOtpError('')
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, otp: otpValue }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Welcome back!')
        window.location.href = '/dashboard'
      } else {
        setOtpError(data.message || 'Invalid OTP')
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })
      toast.success('OTP resent!')
    } catch {
      toast.error('Failed to resend OTP')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#fff' }}>
      {/* Logo */}
      <div className="w-[50px] h-[50px] bg-[#4F46E5] rounded-[14px] flex items-center justify-center mb-6">
        <Package className="h-6 w-6 text-white" />
      </div>

      {step === 'credentials' ? (
        <>
          <h1 className="text-[32px] font-semibold text-[#0d0d0d] mb-2 text-center leading-tight">
            Welcome back
          </h1>
          <p className="text-[15px] text-[#6e6e80] mb-8 text-center">
            Log in to Casting Inventory
          </p>

          <form onSubmit={handleCredentialsSubmit} className="w-full max-w-[340px] space-y-3" noValidate>
            <div>
              <label className="block text-[13px] font-medium text-[#0d0d0d] mb-1.5">Email address *</label>
              <input
                type="email"
                className={`w-full h-[52px] px-4 text-[15px] text-[#0d0d0d] bg-white border rounded-md placeholder-[#8e8ea0] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all ${errors.email ? 'border-red-500' : 'border-[#c5c5d2]'}`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })) }}
              />
              {errors.email && <p className="text-[#ef4444] text-[12px] mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#0d0d0d] mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full h-[52px] px-4 pr-12 text-[15px] text-[#0d0d0d] bg-white border rounded-md placeholder-[#8e8ea0] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all ${errors.password ? 'border-red-500' : 'border-[#c5c5d2]'}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })) }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e8ea0] hover:text-[#0d0d0d] transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {errors.password && <p className="text-[#ef4444] text-[12px] mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px] mt-4"
            >
              {loading ? (<><Loader2 className="h-[18px] w-[18px] animate-spin" /> Verifying...</>) : 'Continue'}
            </button>
          </form>
        </>
      ) : (
        <>
          {/* OTP Step */}
          <h1 className="text-[28px] font-semibold text-[#0d0d0d] mb-2 text-center leading-tight">
            Enter verification code
          </h1>
          <p className="text-[14px] text-[#6e6e80] mb-8 text-center max-w-[320px]">
            We&apos;ve sent a 6-digit code to <span className="font-medium text-[#0d0d0d]">{formData.email}</span>
          </p>

          <form onSubmit={handleOtpSubmit} className="w-full max-w-[340px]" noValidate>
            {/* OTP Inputs */}
            <div className="flex justify-center gap-2.5 mb-4" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`w-[48px] h-[56px] text-center text-[22px] font-semibold text-[#0d0d0d] bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all ${
                    otpError ? 'border-red-500' : 'border-[#c5c5d2]'
                  }`}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>

            {otpError && <p className="text-[#ef4444] text-[13px] text-center mb-4">{otpError}</p>}

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full h-[52px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
            >
              {loading ? (<><Loader2 className="h-[18px] w-[18px] animate-spin" /> Verifying...</>) : 'Verify & Sign In'}
            </button>

            <div className="flex items-center justify-between mt-5">
              <button
                type="button"
                onClick={() => { setStep('credentials'); setOtp(['', '', '', '', '', '']); setOtpError('') }}
                className="flex items-center gap-1.5 text-[13px] text-[#6e6e80] hover:text-[#0d0d0d] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={resendOtp}
                className="text-[13px] text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors"
              >
                Resend code
              </button>
            </div>
          </form>
        </>
      )}

      <div className="mt-10 text-center">
        <p className="text-[12px] text-[#8e8ea0]">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}
