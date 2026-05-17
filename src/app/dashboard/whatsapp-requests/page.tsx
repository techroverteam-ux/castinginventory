'use client'
import { useEffect, useState } from 'react'
import { MessageSquare, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { RoleGuard } from '@/components/RoleGuard'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface WhatsappRequest {
  _id: string
  clientId: { _id: string; name: string; contactEmail: string; contactPhone?: string; logo?: string }
  businessName: string
  businessPhone: string
  businessEmail: string
  gstNumber: string
  businessAddress: string
  businessCategory: string
  businessWebsite: string
  enabled: boolean
  wabaId: string
  phoneNumberId: string
  accessToken: string
  templateName: string
  createdAt: string
  updatedAt: string
}

export default function WhatsappRequestsPage() {
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <WhatsappRequestsContent />
    </RoleGuard>
  )
}

function WhatsappRequestsContent() {
  const [requests, setRequests] = useState<WhatsappRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = () => {
    setLoading(true)
    fetchWithAuth('/api/whatsapp-config/all')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.configs) setRequests(d.configs) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRequests() }, [])

  const handleFieldUpdate = async (configId: string, field: string, value: string) => {
    try {
      const res = await fetchWithAuth(`/api/whatsapp-config/${configId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value }),
      })
      if (res.ok) toast.success(`${field} updated`)
      else toast.error('Update failed')
    } catch { toast.error('Failed') }
  }

  const handleToggleEnabled = async (configId: string, currentEnabled: boolean) => {
    try {
      const res = await fetchWithAuth(`/api/whatsapp-config/${configId}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !currentEnabled }),
      })
      if (res.ok) {
        toast.success(currentEnabled ? 'Disabled' : 'Enabled')
        fetchRequests()
      } else toast.error('Failed')
    } catch { toast.error('Failed') }
  }

  const getStatus = (r: WhatsappRequest) => {
    if (r.enabled && r.wabaId && r.phoneNumberId && r.accessToken) return 'active'
    if (r.businessName && r.businessPhone) return 'pending'
    return 'not_submitted'
  }

  const statusBadge = (status: string) => {
    if (status === 'active') return <span className="badge badge-green flex items-center gap-1"><CheckCircle className="h-3 w-3" />Active</span>
    if (status === 'pending') return <span className="badge badge-yellow flex items-center gap-1"><Clock className="h-3 w-3" />Pending Setup</span>
    return <span className="badge badge-red flex items-center gap-1"><XCircle className="h-3 w-3" />Not Submitted</span>
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">WhatsApp Integration Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">All clients&apos; WhatsApp business details for Meta verification</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ci-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-medium">Active</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{requests.filter(r => getStatus(r) === 'active').length}</p>
          </div>
        </div>
        <div className="ci-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-medium">Pending Setup</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{requests.filter(r => getStatus(r) === 'pending').length}</p>
          </div>
        </div>
        <div className="ci-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-medium">Not Submitted</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{requests.filter(r => getStatus(r) === 'not_submitted').length}</p>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ci-card p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" /><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-60" /></div>
              </div>
            </div>
          ))
        ) : requests.length === 0 ? (
          <div className="ci-card p-12 text-center">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No WhatsApp integration requests yet</p>
            <p className="text-xs text-gray-400 mt-1">Clients will submit their business details from Settings page</p>
          </div>
        ) : (
          requests.map(r => {
            const status = getStatus(r)
            return (
              <div key={r._id} className="ci-card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {r.clientId?.logo ? (
                      <img src={r.clientId.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.clientId?.name || 'Unknown Client'}</p>
                      <p className="text-xs text-gray-500">{r.clientId?.contactEmail}</p>
                    </div>
                  </div>
                  {statusBadge(status)}
                </div>

                {/* Business Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Business Name</p>
                    <p className="text-gray-900 dark:text-white font-medium mt-0.5">{r.businessName || <span className="text-gray-400 italic">Not provided</span>}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">WhatsApp Number</p>
                    <p className="text-gray-900 dark:text-white font-medium mt-0.5">{r.businessPhone ? `+91 ${r.businessPhone}` : <span className="text-gray-400 italic">Not provided</span>}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Email</p>
                    <p className="text-gray-900 dark:text-white font-medium mt-0.5">{r.businessEmail || <span className="text-gray-400 italic">Not provided</span>}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">GST Number</p>
                    <p className="text-gray-900 dark:text-white font-mono mt-0.5">{r.gstNumber || <span className="text-gray-400 italic">Not provided</span>}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Category</p>
                    <p className="text-gray-900 dark:text-white capitalize mt-0.5">{r.businessCategory || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Website</p>
                    <p className="text-gray-900 dark:text-white mt-0.5">{r.businessWebsite ? <a href={r.businessWebsite} target="_blank" className="text-primary hover:underline flex items-center gap-1">{r.businessWebsite} <ExternalLink className="h-3 w-3" /></a> : <span className="text-gray-400 italic">Not provided</span>}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Business Address</p>
                    <p className="text-gray-900 dark:text-white mt-0.5">{r.businessAddress || <span className="text-gray-400 italic">Not provided</span>}</p>
                  </div>
                </div>

                {/* Technical Config - Editable by Superadmin */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider mb-3">WhatsApp API Configuration</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">WABA ID</label>
                      <input className="form-input text-xs mt-0.5" defaultValue={r.wabaId || ''} placeholder="Enter WABA ID" data-id={r._id} data-field="wabaId" onBlur={e => handleFieldUpdate(r._id, 'wabaId', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Phone Number ID</label>
                      <input className="form-input text-xs mt-0.5" defaultValue={r.phoneNumberId || ''} placeholder="Enter Phone Number ID" onBlur={e => handleFieldUpdate(r._id, 'phoneNumberId', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Access Token</label>
                      <input type="password" className="form-input text-xs mt-0.5" defaultValue={r.accessToken || ''} placeholder="Enter Access Token" onBlur={e => handleFieldUpdate(r._id, 'accessToken', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Template Name</label>
                      <input className="form-input text-xs mt-0.5" defaultValue={r.templateName || ''} placeholder="e.g. entry_notification" onBlur={e => handleFieldUpdate(r._id, 'templateName', e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-gray-500 font-medium">Enabled:</label>
                      <button onClick={() => handleToggleEnabled(r._id, r.enabled)} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${r.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {r.enabled ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400">Updated: {formatDate(r.updatedAt || r.createdAt)}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
