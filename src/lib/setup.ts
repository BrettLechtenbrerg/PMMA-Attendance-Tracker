import { supabase } from './supabase'

export async function isSetupRequired(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Error checking setup status:', error)
      return false
    }

    return !data || data.length === 0
  } catch (error) {
    console.error('Error checking setup status:', error)
    return false
  }
}

export async function getUserCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact' })

    if (error) {
      console.error('Error getting user count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error getting user count:', error)
    return 0
  }
}