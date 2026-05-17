'use client'
import { useEffect, useState } from 'react'
import { MessageSquare, Loader2, Save, CheckCircle } from 'lucide-react'
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

  const [whatsapp, setWhatsapp] = useState({
    enabled: false,
    wabaId: '',
    phoneNumberId: '',
    accessToken: '',
    graphVersion: 'v25.0',
    templateName: '',
    templateLanguage: 'en',
    businessName: '',
  })

  useEffect(() => {
    fetchWithAuth('/api/whatsapp-config')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.config) setWhatsapp(data.config) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/whatsapp-config', {
        method: 'POST',
        body: JSON.stringify(whatsapp),
      })
      const data = await res.json()
      if (res.ok) toast.success('WhatsApp settings saved')
      else toast.error(data.message || 'Failed')
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* WhatsApp Integration */}
      <div className="ci-card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">WhatsApp Integration</h3>
            <p className="text-xs text-gray-500">Send real-time notifications to parties on new entries</p>
          </div>
          <div className="ml-auto">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={whatsapp.enabled} onChange={e => setWhatsapp({ ...whatsapp, enabled: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {whatsapp.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <div>
              <label className="form-label">Business Name</label>
              <input className="form-input" value={whatsapp.businessName} onChange={e => setWhatsapp({ ...whatsapp, businessName: e.target.value })} placeholder="Your Business Name" />
            </div>
            <div>
              <label className="form-label">WABA ID</label>
              <input className="form-input" value={whatsapp.wabaId} onChange={e => setWhatsapp({ ...whatsapp, wabaId: e.target.value })} placeholder="WhatsApp Business Account ID" />
            </div>
            <div>
              <label className="form-label">Phone Number ID</label>
              <input className="form-input" value={whatsapp.phoneNumberId} onChange={e => setWhatsapp({ ...whatsapp, phoneNumberId: e.target.value })} placeholder="Phone Number ID from Meta" />
            </div>
            <div>
              <label className="form-label">Access Token</label>
              <input type="password" className="form-input" value={whatsapp.accessToken} onChange={e => setWhatsapp({ ...whatsapp, accessToken: e.target.value })} placeholder="Permanent access token" />
            </div>
            <div>
              <label className="form-label">Graph API Version</label>
              <input className="form-input" value={whatsapp.graphVersion} onChange={e => setWhatsapp({ ...whatsapp, graphVersion: e.target.value })} placeholder="v25.0" />
            </div>
            <div>
              <label className="form-label">Template Name</label>
              <input className="form-input" value={whatsapp.templateName} onChange={e => setWhatsapp({ ...whatsapp, templateName: e.target.value })} placeholder="new_entry_notification" />
            </div>
            <div>
              <label className="form-label">Template Language</label>
              <select className="form-select" value={whatsapp.templateLanguage} onChange={e => setWhatsapp({ ...whatsapp, templateLanguage: e.target.value })}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="en_US">English (US)</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/50">
          <button onClick={handleSave} disabled={saving} className="ci-button flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="ci-card p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Application Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Version</span><span className="font-medium">1.0.0</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium capitalize">{user?.role}</span></div>
          {user?.clientName && <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="font-medium">{user.clientName}</span></div>}
        </div>
      </div>
    </div>
  )
}
