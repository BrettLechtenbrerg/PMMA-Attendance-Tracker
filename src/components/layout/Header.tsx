'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, X } from 'lucide-react'
import { signOut, getCurrentUser } from '@/lib/auth'
import type { User } from '@/types'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  async function handleSignOut() {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', roles: ['owner', 'manager', 'instructor'] },
    { name: 'Scanner', href: '/scanner', roles: ['owner', 'manager', 'instructor'] },
    { name: 'Students', href: '/students', roles: ['owner', 'manager', 'instructor'] },
    { name: 'Families', href: '/families', roles: ['owner', 'manager'] },
    { name: 'Classes', href: '/classes', roles: ['owner', 'manager', 'instructor'] },
    { name: 'Attendance', href: '/attendance', roles: ['owner', 'manager', 'instructor'] },
    { name: 'Portal', href: '/portal', roles: ['parent'] },
    { name: 'Settings', href: '/settings', roles: ['owner', 'manager'] },
  ]

  const userNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  )

  return (
    <header className="bg-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <img
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/Uj6CJxWXVU8HyNgI39xb/media/88575c62-51f8-4837-875d-808d452bbc6b.png"
                alt="PMMA"
                className="h-8 w-auto"
              />
              <span className="ml-2 text-secondary font-bold text-lg">
                PMMA Tracker
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {userNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white hover:text-secondary px-3 py-2 rounded-md text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-white text-sm">
                {user.first_name} {user.last_name}
              </span>
            )}
            
            <button
              onClick={handleSignOut}
              className="text-white hover:text-secondary p-2"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white hover:text-secondary p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
            {userNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white hover:text-secondary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}