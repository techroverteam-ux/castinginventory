// URLs that should NOT have clientId appended (they're not tenant-scoped)
const SKIP_CLIENT_URLS = ['/api/clients', '/api/auth/', '/api/upload', '/api/whatsapp-config/all', '/api/admin/users']

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let finalUrl = url

  // For superadmin, append selected clientId only for tenant-scoped APIs
  const savedClient = localStorage.getItem('sa-selected-client')
  if (savedClient && savedClient !== 'all' && !url.includes('clientId=')) {
    const shouldSkip = SKIP_CLIENT_URLS.some(skip => url.startsWith(skip))
    if (!shouldSkip) {
      const separator = url.includes('?') ? '&' : '?'
      finalUrl = `${url}${separator}clientId=${savedClient}`
    }
  }

  const res = await fetch(finalUrl, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (res.status === 401) {
    window.location.href = '/auth/signin'
    throw new Error('Unauthorized')
  }
  return res
}
