'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User, AuthContextType, LoginCredentials, RegisterData, KYCData, UserRole } from '@/types'

const supabase = createClient()

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile()
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const getSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Fetch complete user profile from database
        await fetchUserProfile()
      }
    } catch (error) {
      console.error('Error getting session:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setUser(null)
        return
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const { data } = await response.json()
        setUser(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        
        // If it's an authentication error, use fallback data
        if (response.status === 401 || errorData.code === 'UNAUTHENTICATED') {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
              phone: session.user.user_metadata?.phone,
              created_at: session.user.created_at
            })
          }
        } else {
          console.error('Profile fetch failed:', response.status, errorData)
          setUser(null)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const signIn = async (credentials: LoginCredentials): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (data: RegisterData): Promise<{ error?: string; success?: boolean }> => {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone
          }
        }
      })

      if (authError) {
        return { error: authError.message }
      }

      if (!authData.user) {
        return { error: 'Failed to create user account' }
      }

      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { error: 'An unexpected error occurred during registration' }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserProfile()
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const updateKYC = async (data: KYCData): Promise<{ error?: string }> => {
    // TODO: Implement KYC update functionality
    return { error: 'KYC update not implemented yet' }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateKYC,
    refreshUser,
    isAdmin: () => user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN,
    isSuperAdmin: () => user?.role === UserRole.SUPER_ADMIN
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
