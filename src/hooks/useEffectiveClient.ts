import { useCurrentUser } from '@/components/CurrentUserProvider'
import { useClientSelector } from '@/components/ClientSelectorProvider'

export function useEffectiveClient() {
  const { user } = useCurrentUser()
  const { selectedClientId, isSuperadmin } = useClientSelector()

  // Superadmin uses selected client, others use their own
  const effectiveClientId = isSuperadmin ? selectedClientId : user?.clientId || ''

  return { effectiveClientId, isSuperadmin }
}
