'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useCurrentUser } from '@/components/CurrentUserProvider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface ClientOption { _id: string; name: string }

interface ClientContextValue {
  selectedClientId: string
  setSelectedClientId: (id: string) => void
  clients: ClientOption[]
  isSuperadmin: boolean
}

const ClientContext = createContext<ClientContextValue>({
  selectedClientId: '',
  setSelectedClientId: () => {},
  clients: [],
  isSuperadmin: false,
})

export function ClientSelectorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser()
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')

  const isSuperadmin = user?.role === 'superadmin'

  useEffect(() => {
    if (!isSuperadmin) return
    // Fetch all clients for superadmin
    fetchWithAuth('/api/clients?limit=100')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.clients) {
          setClients(d.clients)
          // Restore saved selection
          const saved = localStorage.getItem('sa-selected-client')
          if (saved && d.clients.find((c: any) => c._id === saved)) {
            setSelectedClientId(saved)
          } else if (d.clients.length > 0) {
            setSelectedClientId(d.clients[0]._id)
          }
        }
      })
      .catch(() => {})
  }, [isSuperadmin])

  const handleSelect = (id: string) => {
    setSelectedClientId(id)
    localStorage.setItem('sa-selected-client', id)
  }

  return (
    <ClientContext.Provider value={{ selectedClientId, setSelectedClientId: handleSelect, clients, isSuperadmin }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClientSelector() {
  return useContext(ClientContext)
}
