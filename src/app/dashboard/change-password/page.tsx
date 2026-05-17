'use client'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Lock, Loader2, ArrowLeft } from 'lucide-react'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

type Step = 'password' | 'otp'

export default function ChangePasswordPage() {
  const [step, setStep] = useState<Step>('password')
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [otpError, setOtpError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, refetch } = useCurrentUser()
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }
  }, [step])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.newPassword) e.newPassword = 'Required'
    else if (form.newPassword.length < 6) e.newPassword = 'Min 6 characters'
    if (!form.confirmPassword) e.confirmPassword = 'Required'
    else if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      // Send OTP
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      })
      toast.success('OTP sent to your email')
      setStep('otp')
    } catch { toast.error('Failed to send OTP') } finally { setLoading(false) }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setOtpError('')
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
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
      // Verify OTP first
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, otp: otpValue }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        setOtpError(verifyData.message || 'Invalid OTP')
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
        return
      }

      // OTP verified — change password
      const res = await fetchWithAuth('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Password changed successfully!')
        refetch()
        window.location.href = '/dashboard'
      } else {
        toast.error(data.message || 'Failed')
      }
    } catch { toast.error('Something went wrong') } finally { setLoading(false) }
  }

  const resendOtp = async () => {
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      })
      toast.success('OTP resent!')
    } catch { toast.error('Failed to resend') }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-[400px]">
        <div className="ci-card p-6 sm:p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
              <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          {step === 'password' ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
                Change Your Password
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                You must set a new password before continuing
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="form-label">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="form-input pr-10"
                      placeholder="Min 6 characters"
                      value={form.newPassword}
                      onChange={e => setForm({ ...form, newPassword: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
                </div>

                <div>
                  <label className="form-label">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="form-input pr-10"
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <button type="submit" disabled={loading} className="w-full ci-button flex items-center justify-center gap-2 py-3">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Sending OTP...' : 'Continue'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
                Verify OTP
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Enter the 6-digit code sent to <span className="font-medium text-gray-700 dark:text-gray-200">{user?.email}</span>
              </p>

              <form onSubmit={handleOtpSubmit} noValidate>
                <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`w-[44px] h-[52px] text-center text-xl font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all ${
                        otpError ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                      }`}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>

                {otpError && <p className="text-red-500 text-xs text-center mb-4">{otpError}</p>}

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full ci-button flex items-center justify-center gap-2 py-3"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Verifying...' : 'Verify & Change Password'}
                </button>

                <div className="flex items-center justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => { setStep('password'); setOtp(['', '', '', '', '', '']); setOtpError('') }}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={resendOtp}
                    className="text-xs text-primary hover:text-indigo-700 font-medium transition-colors"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
