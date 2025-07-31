import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PMMA Attendance Tracker',
  description: 'Professional martial arts attendance tracking system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-primary">
        {children}
      </body>
    </html>
  )
}