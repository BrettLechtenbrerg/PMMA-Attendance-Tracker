'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, checkUserRole } from '@/lib/auth'
import { User, UserRole } from '@/lib/types'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  allowedRoles = ['owner', 'manager', 'instructor'], 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user, error } = await auth.getCurrentUser()
        
        if (error || !user) {
          router.push(redirectTo)
          return
        }

        if (allowedRoles && !checkUserRole(user.role, allowedRoles)) {
          router.push('/unauthorized')
          return
        }

        setUser(user)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push(redirectTo)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [allowedRoles, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}