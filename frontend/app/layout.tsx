import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TaskVIP - Earn Credits by Completing Tasks',
  description: 'Join TaskVIP and earn credits by completing daily tasks, watching ads, and referring friends. Upgrade to VIP for higher rewards!',
  keywords: 'earn money, tasks, ads, referrals, VIP, credits, rewards',
  authors: [{ name: 'TaskVIP Team' }],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'TaskVIP - Earn Credits by Completing Tasks',
    description: 'Join TaskVIP and earn credits by completing daily tasks, watching ads, and referring friends.',
    type: 'website',
    locale: 'en_US',
    images: ['/favicon.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskVIP - Earn Credits by Completing Tasks',
    description: 'Join TaskVIP and earn credits by completing daily tasks, watching ads, and referring friends.',
    images: ['/favicon.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  other: {
    'monetag': '6bdb669bae18ef01035af9e5c0cb6fe1',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
