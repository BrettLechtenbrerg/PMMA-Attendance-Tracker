'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, hasRole } from '@/lib/auth'
import type { User, UserRole } from '@/types'

interface AuthGuardProps {
  children: React.ReactNode
  roles?: UserRole[]
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, roles, fallback }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        
        if (!currentUser) {
          router.push('/login')
          return
        }
        
        if (roles && !hasRole(currentUser, roles)) {
          router.push('/unauthorized')
          return
        }
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          router.push('/login')
        } else if (event === 'SIGNED_IN') {
          getUser()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, roles])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return fallback || null
  }

  if (roles && !hasRole(user, roles)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-accent mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}