const SKIP_CLIENT_URLS = ['/api/clients', '/api/auth/', '/api/upload', '/api/whatsapp-config/all', '/api/admin/users']

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let finalUrl = url

  if (typeof window !== 'undefined') {
    // Only append clientId if user is superadmin (check stored role)
    const userRole = sessionStorage.getItem('ci-user-role')
    const savedClient = localStorage.getItem('sa-selected-client')

    if (userRole === 'superadmin' && savedClient && savedClient !== 'all' && !url.includes('clientId=')) {
      const shouldSkip = SKIP_CLIENT_URLS.some(skip => url.startsWith(skip))
      if (!shouldSkip) {
        const separator = url.includes('?') ? '&' : '?'
        finalUrl = `${url}${separator}clientId=${savedClient}`
      }
    }
  }

  const headers: Record<string, string> = {}
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(finalUrl, {
    ...options,
    credentials: 'include',
    headers: { ...headers, ...options.headers as Record<string, string> },
  })

  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/auth/signin'
    throw new Error('Unauthorized')
  }
  return res
}
