import { supabase } from './supabase'
import { User, UserRole } from './types'

export const auth = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signUp(email: string, password: string, metadata?: { first_name?: string; last_name?: string; role?: UserRole }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser(): Promise<{ user: User | null; error: any }> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authData.user) {
      return { user: null, error: authError }
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    return { user: userData, error: userError }
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  },

  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    return { data, error }
  },
}

export const checkUserRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole)
}

export const isStaff = (role: UserRole): boolean => {
  return ['owner', 'manager', 'instructor'].includes(role)
}

export const isParent = (role: UserRole): boolean => {
  return role === 'parent'
}