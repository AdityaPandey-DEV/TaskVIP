'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

export function AuthenticatedAdScript() {
  const { user, loading } = useAuth()

  useEffect(() => {
    // Debug logging
    console.log('AuthenticatedAdScript: user =', !!user, 'loading =', loading)
    
    // Only load ad script for authenticated users
    if (!user || loading) {
      console.log('AuthenticatedAdScript: Not loading ads - user not authenticated')
      return
    }

    console.log('AuthenticatedAdScript: User authenticated, loading ad script')

    // Check if script is already loaded
    if (document.querySelector('script[src="https://fpyf8.com/88/tag.min.js"]')) {
      console.log('AuthenticatedAdScript: Ad script already loaded')
      return
    }

    // Create and load the ad script
    const script = document.createElement('script')
    script.src = 'https://fpyf8.com/88/tag.min.js'
    script.setAttribute('data-zone', '175243')
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    
    script.onload = () => {
      console.log('AuthenticatedAdScript: Ad script loaded successfully')
    }
    
    script.onerror = () => {
      console.error('AuthenticatedAdScript: Failed to load ad script')
    }
    
    document.head.appendChild(script)
    console.log('AuthenticatedAdScript: Ad script added to head')

    // Cleanup function
    return () => {
      const existingScript = document.querySelector('script[src="https://fpyf8.com/88/tag.min.js"]')
      if (existingScript) {
        console.log('AuthenticatedAdScript: Removing ad script')
        existingScript.remove()
      }
    }
  }, [user, loading])

  // Don't render anything - this is just for script loading
  return null
}
