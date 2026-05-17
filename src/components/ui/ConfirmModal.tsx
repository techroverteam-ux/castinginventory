'use client'
import { Loader2, X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', loading = false, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null

  const btnClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : variant === 'warning'
    ? 'bg-amber-500 hover:bg-amber-600 text-white'
    : 'bg-primary hover:bg-indigo-600 text-white'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'transparent' }}>
      <div className="fixed inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 shadow-modal rounded-2xl p-5 animate-in" style={{ animation: 'slideUp 0.15s ease-out' }}>
        <button onClick={onCancel} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white pr-6">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{message}</p>
        <div className="flex justify-end gap-2.5 mt-5">
          <button onClick={onCancel} disabled={loading} className="btn-secondary text-sm px-4 py-2">
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 ${btnClass}`}>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
