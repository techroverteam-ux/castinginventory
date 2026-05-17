'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { UserRole } from '@/types'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface UserInfo {
  id: string
  name: string
  email: string
  role: UserRole
  clientId?: string
  clientName?: string
  clientLogo?: string
  mustChangePassword?: boolean
}

interface CurrentUserContextValue {
  user: UserInfo | null
  loading: boolean
  refetch: () => void
}

const CurrentUserContext = createContext<CurrentUserContextValue>({ user: null, loading: true, refetch: () => {} })

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = () => {
    fetchWithAuth('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUser(data.user)
          // Store role for fetchWithAuth to check
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('ci-user-role', data.user.role)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUser() }, [])

  return (
    <CurrentUserContext.Provider value={{ user, loading, refetch: fetchUser }}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser() {
  return useContext(CurrentUserContext)
}
