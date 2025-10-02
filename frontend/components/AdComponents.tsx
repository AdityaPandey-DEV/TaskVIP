'use client'

import { useEffect } from 'react'

// Banner Ad Component - High visibility
export function BannerAd({ zone = "175243", className = "" }: { zone?: string, className?: string }) {
  useEffect(() => {
    // Reload ads when component mounts
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
      } catch (e) {
        console.log('Ad loading...')
      }
    }
  }, [])

  return (
    <div className={`ad-banner ${className}`}>
      <div 
        id={`ad-zone-${zone}`}
        className="ad-container"
        style={{ minHeight: '90px', textAlign: 'center' }}
      >
        {/* Ad will be injected here by the script */}
      </div>
    </div>
  )
}

// Sidebar Ad Component - Persistent visibility
export function SidebarAd({ zone = "175243", className = "" }: { zone?: string, className?: string }) {
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

// Inline Ad Component - Between content
export function InlineAd({ zone = "175243", className = "" }: { zone?: string, className?: string }) {
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

// Video Ad Component - High value
export function VideoAd({ zone = "175243", className = "" }: { zone?: string, className?: string }) {
  return (
    <div className={`ad-video ${className}`}>
      <div className="text-center text-gray-500 text-sm mb-2">Watch Video Ad to Earn Credits</div>
      <div 
        id={`ad-video-${zone}`}
        className="ad-container"
        style={{ minHeight: '200px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}
      >
        {/* Video ad will be injected here */}
      </div>
    </div>
  )
}

// Native Ad Component - Blends with content
export function NativeAd({ zone = "175243", className = "" }: { zone?: string, className?: string }) {
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
