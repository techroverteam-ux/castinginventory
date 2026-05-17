export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // For superadmin, auto-append clientId from localStorage selection
  let finalUrl = url
  const savedClient = localStorage.getItem('sa-selected-client')
  if (savedClient) {
    const separator = url.includes('?') ? '&' : '?'
    // Only append if not already present
    if (!url.includes('clientId=')) {
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
