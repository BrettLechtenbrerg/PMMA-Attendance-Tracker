import { supabase } from './supabase'
import type { User, UserRole } from '@/types'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error || !userData) return null
  
  return userData
}

export async function createUser(
  email: string, 
  password: string, 
  userData: {
    first_name: string
    last_name: string
    role: UserRole
  }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  
  if (error) throw error
  
  if (data.user) {
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        ...userData
      })
    
    if (userError) throw userError
  }
  
  return data
}

export function hasRole(user: User | null, roles: UserRole[]): boolean {
  return user ? roles.includes(user.role) : false
}

export function isStaff(user: User | null): boolean {
  return hasRole(user, ['owner', 'manager', 'instructor'])
}

export function isParent(user: User | null): boolean {
  return hasRole(user, ['parent'])
}

export function canManageUsers(user: User | null): boolean {
  return hasRole(user, ['owner', 'manager'])
}