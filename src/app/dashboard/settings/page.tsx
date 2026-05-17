'use client'
import { useEffect, useState } from 'react'
import { MessageSquare, Loader2, Save, Building2, Phone, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { RoleGuard } from '@/components/RoleGuard'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={['superadmin', 'admin']}>
      <SettingsContent />
    </RoleGuard>
  )
}

function SettingsContent() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useCurrentUser()
  const isSuperadmin = user?.role === 'superadmin'

  const [config, setConfig] = useState({
    // Business details (client fills)
    businessName: '',
    businessPhone: '',
    businessEmail: '',
    gstNumber: '',
    businessAddress: '',
    businessCategory: 'jewellery',
    businessWebsite: '',
    // WhatsApp technical (superadmin fills)
    enabled: false,
    wabaId: '',
    phoneNumberId: '',
    accessToken: '',
    graphVersion: 'v25.0',
    templateName: '',
    templateLanguage: 'en',
  })

  useEffect(() => {
    fetchWithAuth('/api/whatsapp-config')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.config) setConfig(prev => ({ ...prev, ...data.config })) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/whatsapp-config', { method: 'POST', body: JSON.stringify(config) })
      const data = await res.json()
      if (res.ok) toast.success('Settings saved successfully')
      else toast.error(data.message || 'Failed')
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Business Profile - Client fills this */}
      <div className="ci-card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Business Profile</h3>
            <p className="text-xs text-gray-500">Required for WhatsApp Business verification</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Business / Brand Name *</label>
            <input className="form-input" value={config.businessName} onChange={e => setConfig({ ...config, businessName: e.target.value })} placeholder="e.g. Shree Braj Laser Soldering" />
          </div>
          <div>
            <label className="form-label">Business Phone (WhatsApp Number) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+91</span>
              <input className="form-input pl-12" value={config.businessPhone} onChange={e => setConfig({ ...config, businessPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9876543210" inputMode="numeric" maxLength={10} />
            </div>
          </div>
          <div>
            <label className="form-label">Business Email</label>
            <input type="email" className="form-input" value={config.businessEmail} onChange={e => setConfig({ ...config, businessEmail: e.target.value })} placeholder="business@example.com" />
          </div>
          <div>
            <label className="form-label">GST Number</label>
            <input className="form-input uppercase" value={config.gstNumber} onChange={e => setConfig({ ...config, gstNumber: e.target.value.toUpperCase().slice(0, 15) })} placeholder="22AAAAA0000A1Z5" maxLength={15} />
          </div>
          <div>
            <label className="form-label">Business Category</label>
            <select className="form-select" value={config.businessCategory} onChange={e => setConfig({ ...config, businessCategory: e.target.value })}>
              <option value="jewellery">Jewellery & Gold</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="trading">Trading</option>
              <option value="services">Services</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Website (optional)</label>
            <input className="form-input" value={config.businessWebsite} onChange={e => setConfig({ ...config, businessWebsite: e.target.value })} placeholder="https://..." />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Business Address *</label>
            <textarea className="form-input min-h-[70px]" value={config.businessAddress} onChange={e => setConfig({ ...config, businessAddress: e.target.value })} placeholder="Full registered business address" />
          </div>
        </div>
      </div>

      {/* WhatsApp Integration - Technical Config */}
      <div className="ci-card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">WhatsApp Notifications</h3>
            <p className="text-xs text-gray-500">
              {isSuperadmin ? 'Configure Meta WhatsApp API credentials' : 'Enable to send entry notifications to parties'}
            </p>
          </div>
          <div className="ml-auto">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        </div>

        {config.enabled && isSuperadmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <div>
              <label className="form-label">WABA ID</label>
              <input className="form-input" value={config.wabaId} onChange={e => setConfig({ ...config, wabaId: e.target.value })} placeholder="WhatsApp Business Account ID" />
            </div>
            <div>
              <label className="form-label">Phone Number ID</label>
              <input className="form-input" value={config.phoneNumberId} onChange={e => setConfig({ ...config, phoneNumberId: e.target.value })} placeholder="From Meta Developer Console" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Access Token</label>
              <input type="password" className="form-input" value={config.accessToken} onChange={e => setConfig({ ...config, accessToken: e.target.value })} placeholder="Permanent access token from Meta" />
            </div>
            <div>
              <label className="form-label">Graph API Version</label>
              <input className="form-input" value={config.graphVersion} onChange={e => setConfig({ ...config, graphVersion: e.target.value })} placeholder="v25.0" />
            </div>
            <div>
              <label className="form-label">Template Name</label>
              <input className="form-input" value={config.templateName} onChange={e => setConfig({ ...config, templateName: e.target.value })} placeholder="new_entry_notification" />
            </div>
            <div>
              <label className="form-label">Template Language</label>
              <select className="form-select" value={config.templateLanguage} onChange={e => setConfig({ ...config, templateLanguage: e.target.value })}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="en_US">English (US)</option>
              </select>
            </div>
          </div>
        )}

        {config.enabled && !isSuperadmin && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4">
              <p className="text-sm text-green-800 dark:text-green-300 font-medium">✓ WhatsApp notifications enabled</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Parties will receive entry notifications on their registered WhatsApp number. Contact admin for technical configuration.</p>
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="ci-button flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
