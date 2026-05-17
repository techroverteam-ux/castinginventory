export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // For superadmin, append selected clientId if one is chosen (not 'all')
  let finalUrl = url
  const savedClient = localStorage.getItem('sa-selected-client')
  if (savedClient && savedClient !== 'all' && !url.includes('clientId=')) {
    const separator = url.includes('?') ? '&' : '?'
    finalUrl = `${url}${separator}clientId=${savedClient}`
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
