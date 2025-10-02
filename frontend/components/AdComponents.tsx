'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Banner Ad Component - High visibility with viewing time tracking (Authenticated users only)
export function BannerAd({ zone = "175243", className = "", minViewTime = 3000, reward = 2 }: { 
  zone?: string, 
  className?: string,
  minViewTime?: number,
  reward?: number 
}) {
  const { user, loading } = useAuth()

  useEffect(() => {
    // Only load ads for authenticated users
    if (!user || loading) return

    // Ad script is loaded conditionally by AuthenticatedAdScript component
    // No need to manually load ads here - they will load automatically when script is present

    // Track viewing time for optimal earnings
    const adElement = document.getElementById(`ad-zone-${zone}`)
    if (adElement) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Start timer when ad is 50% visible (IAB standard)
            setTimeout(() => {
              console.log(`Ad viewed for optimal time: ${minViewTime}ms - Earning maximized!`)
              // Here you could track this for user rewards
            }, minViewTime)
          }
        })
      }, { threshold: 0.5 }) // 50% visibility threshold
      
      observer.observe(adElement)
      
      return () => observer.disconnect()
    }
  }, [zone, minViewTime, user, loading])

  // Don't show ads for non-authenticated users
  if (!user || loading) {
    return (
      <div className={`ad-placeholder ${className}`}>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg text-center">
          <h3 className="font-semibold mb-2">🎯 Unlock Premium Ads!</h3>
          <p className="text-sm">Sign in to view ads and start earning credits!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`ad-banner ${className}`}>
      <div className="text-xs text-gray-500 mb-1 text-center">
        💰 View for {minViewTime/1000}+ seconds to maximize earnings
      </div>
      <div 
        id={`ad-zone-${zone}`}
        className="ad-container"
        style={{ minHeight: '90px', textAlign: 'center' }}
        data-reward={reward}
        data-min-time={minViewTime}
      >
        {/* Ad will be injected here by the script */}
      </div>
    </div>
  )
}

// Sidebar Ad Component - Persistent visibility (Authenticated users only)
export function SidebarAd({ zone = "175243", className = "" }: { zone?: string, className?: string }) {
  const { user, loading } = useAuth()

  // Don't show ads for non-authenticated users
  if (!user || loading) {
    return (
      <div className={`ad-sidebar ${className}`}>
        <div className="bg-gradient-to-b from-green-500 to-blue-600 text-white p-4 rounded-lg text-center sticky top-4">
          <h3 className="font-semibold mb-2">💎 VIP Ads</h3>
          <p className="text-sm mb-3">Premium ad content available after sign in</p>
          <div className="text-xs opacity-80">Sign in to unlock earning opportunities!</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`ad-sidebar ${className}`}>
      <div 
        className="ad-container sticky top-4"
        style={{ minHeight: '250px', width: '300px' }}
      >
        <div className="text-center text-gray-500 text-sm mb-2">Advertisement</div>
        <div id={`ad-sidebar-${zone}`} className="ad-content">
          {/* Sidebar ad content */}
        </div>
      </div>
    </div>
  )
}

// Inline Ad Component - Between content (Authenticated users only)
export function InlineAd({ zone = "175243", className = "" }: { zone?: string, className?: string }) {
  const { user, loading } = useAuth()

  // Don't show ads for non-authenticated users
  if (!user || loading) {
    return (
      <div className={`ad-inline my-4 ${className}`}>
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-lg text-center">
          <h4 className="font-semibold mb-1">🚀 Earning Zone</h4>
          <p className="text-sm">Sign in to view ads and earn credits!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`ad-inline my-4 ${className}`}>
      <div className="text-center text-gray-400 text-xs mb-1">Advertisement</div>
      <div 
        id={`ad-inline-${zone}`}
        className="ad-container"
        style={{ minHeight: '100px', textAlign: 'center' }}
      >
        {/* Inline ad content */}
      </div>
    </div>
  )
}

// Popup/Interstitial Ad Component - High engagement
export function PopupAd({ zone = "175243", delay = 30000 }: { zone?: string, delay?: number }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trigger popup ad after delay
      if (typeof window !== 'undefined') {
        // This will be handled by the main ad script
        console.log('Popup ad triggered')
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return null // Popup ads are handled by the main script
}

// Video Ad Component - High value with optimal viewing tracking (Authenticated users only)
export function VideoAd({ zone = "175243", className = "", minViewTime = 5000, reward = 5 }: { 
  zone?: string, 
  className?: string,
  minViewTime?: number,
  reward?: number 
}) {
  const { user, loading } = useAuth()

  useEffect(() => {
    // Only track for authenticated users
    if (!user || loading) return

    // Track video ad viewing for maximum earnings
    const videoAdElement = document.getElementById(`ad-video-${zone}`)
    if (videoAdElement) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Video ads need longer viewing time for optimal CPM
            setTimeout(() => {
              console.log(`Video ad viewed optimally: ${minViewTime}ms - Premium earnings!`)
              // Track for higher rewards
            }, minViewTime)
          }
        })
      }, { threshold: 0.5 })
      
      observer.observe(videoAdElement)
      return () => observer.disconnect()
    }
  }, [zone, minViewTime, user, loading])

  // Don't show ads for non-authenticated users
  if (!user || loading) {
    return (
      <div className={`ad-video ${className}`}>
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-lg text-center">
          <h3 className="font-semibold mb-2">🎬 Premium Video Ads</h3>
          <p className="text-sm mb-2">High-value video ads = {reward} Credits each</p>
          <p className="text-xs opacity-90">Sign in to unlock video earning opportunities!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`ad-video ${className}`}>
      <div className="text-center text-gray-500 text-sm mb-2">
        🎬 Watch Video Ad for {minViewTime/1000}+ seconds = {reward} Credits
      </div>
      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs p-2 rounded-t-lg text-center">
        💰 High Value Ad - Maximum Earnings!
      </div>
      <div 
        id={`ad-video-${zone}`}
        className="ad-container"
        style={{ minHeight: '200px', backgroundColor: '#f3f4f6', borderRadius: '0 0 8px 8px' }}
        data-reward={reward}
        data-min-time={minViewTime}
      >
        {/* Video ad will be injected here */}
      </div>
    </div>
  )
}

// Native Ad Component - Blends with content (Authenticated users only)
export function NativeAd({ zone = "175243", className = "" }: { zone?: string, className?: string }) {
  const { user, loading } = useAuth()

  // Don't show ads for non-authenticated users
  if (!user || loading) {
    return (
      <div className={`ad-native ${className}`}>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 border border-gray-200 rounded-lg">
          <div className="text-xs opacity-80 mb-2">Premium Content</div>
          <h4 className="font-semibold mb-2">🌟 Native Ads Available</h4>
          <p className="text-sm">Sign in to view native ads and earn credits seamlessly!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`ad-native ${className}`}>
      <div 
        id={`ad-native-${zone}`}
        className="ad-container p-4 border border-gray-200 rounded-lg"
        style={{ minHeight: '120px' }}
      >
        <div className="text-xs text-gray-400 mb-2">Sponsored</div>
        {/* Native ad content */}
      </div>
    </div>
  )
}
