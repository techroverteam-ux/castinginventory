'use client'
import { Settings } from 'lucide-react'
import { RoleGuard } from '@/components/RoleGuard'

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={['superadmin', 'admin']}>
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
        </div>
        <div className="ci-card p-12 text-center">
          <Settings className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">Settings panel coming soon</p>
        </div>
      </div>
    </RoleGuard>
  )
}
