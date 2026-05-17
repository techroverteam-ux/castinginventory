'use client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { refetch } = useCurrentUser()

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.newPassword) e.newPassword = 'Required'
    else if (form.newPassword.length < 6) e.newPassword = 'Min 6 characters'
    if (!form.confirmPassword) e.confirmPassword = 'Required'
    else if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
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

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-[400px]">
        <div className="ci-card p-6 sm:p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
              <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
            Change Your Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            You must set a new password before continuing
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
