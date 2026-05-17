export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
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
