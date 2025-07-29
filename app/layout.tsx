import type { Metadata } from 'next'
import './globals.css'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import OfflineStatus from '@/components/OfflineStatus'

export const metadata: Metadata = {
  title: 'PMMA Attendance Tracker',
  description: 'Professional martial arts attendance tracking system',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PMMA Tracker',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>
        {children}
        <PWAInstallPrompt />
        <OfflineStatus />
      </body>
    </html>
  )
}