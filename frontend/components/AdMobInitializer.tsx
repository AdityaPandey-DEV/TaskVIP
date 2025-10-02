'use client'

import { useEffect } from 'react'
import { initializeAdMob } from '@/lib/admob'

/**
 * AdMobInitializer Component
 * 
 * This component initializes AdMob once when the app loads.
 * It's placed in the root layout to ensure AdMob is initialized
 * before any components try to show ads.
 */
export function AdMobInitializer() {
  useEffect(() => {
    // Initialize AdMob when the app loads
    initializeAdMob()
  }, []) // Empty dependency array means this runs once on mount

  // This component doesn't render anything visible
  return null
}
