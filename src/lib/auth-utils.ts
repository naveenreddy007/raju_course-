import { supabase } from '@/lib/supabase'

// Get the current session and access token
export async function getAuthHeaders(): Promise<{ Authorization?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` }
    }
    return {}
  } catch (error) {
    console.error('Error getting auth headers:', error)
    return {}
  }
}

// Make authenticated API requests
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders()
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  })
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session?.user
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

// Get current user from session
export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}