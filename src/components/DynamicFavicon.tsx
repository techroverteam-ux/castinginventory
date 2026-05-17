'use client'
import { useEffect } from 'react'
import { useCurrentUser } from '@/components/CurrentUserProvider'

export function DynamicFavicon() {
  const { user } = useCurrentUser()

  useEffect(() => {
    if (!user) return

    // Get client's favicon from user context (populated from Client model)
    const faviconUrl = (user as any).clientFavicon
    if (!faviconUrl) return

    // Update the favicon link tag
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = faviconUrl
    link.type = faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png'

    // Also update page title with client name
    if (user.clientName) {
      document.title = `${user.clientName} - Casting Inventory`
    }
  }, [user])

  return null
}
