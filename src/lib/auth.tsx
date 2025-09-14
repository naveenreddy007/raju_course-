'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { 
  AuthContextType, 
  User, 
  LoginCredentials, 
  RegisterData, 
  KYCData,
  PackageType,
  UserRole 
} from '@/types'
import { generateReferralCode, validatePAN } from '@/lib/utils'

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
          await loadUser(session.user.id)
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
        await loadUser(session.user.id)
      }
    } catch (error) {
      console.error('Error getting session:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUser = async (supabaseId: string) => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseId })
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const signIn = async (credentials: LoginCredentials) => {
    try {
      const { error } = await supabase.auth.signInWithPassword(credentials)
      if (error) return { error: error.message }
      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (data: RegisterData) => {
    try {
      console.log('Starting signup process...', { email: data.email, name: data.name })
      
      // Sign up with Supabase Auth first
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

      console.log('Supabase auth result:', { authData: !!authData.user, authError })
      
      if (authError) {
        console.error('Supabase auth error:', authError)
        return { error: authError.message }
      }
      
      if (!authData.user) {
        console.error('No user returned from Supabase')
        return { error: 'Failed to create user account' }
      }

      console.log('Creating user profile via API...')
      
      // Create user profile via API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseId: authData.user.id,
          email: data.email,
          name: data.name,
          phone: data.phone,
          referralCode: data.referralCode
        })
      })

      console.log('API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }

        return { error: errorData.error || 'Failed to create user profile' }
      }
      
      const result = await response.json()
      console.log('User created successfully:', result)
      
      return { success: true, data: result }
    } catch (error) {
      console.error('Unexpected error during signup:', error)
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

  const updateKYC = async (data: KYCData) => {
    try {
      if (!validatePAN(data.panCard)) {
        return { error: 'Invalid PAN card format' }
      }

      const response = await fetch('/api/auth/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { error: errorData.error || 'Failed to update KYC' }
      }

      await refreshUser()
      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const refreshUser = async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    if (supabaseUser) {
      await loadUser(supabaseUser.id)
    }
  }

  const isAdmin = () => {
    return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN
  }

  const isSuperAdmin = () => {
    return user?.role === UserRole.SUPER_ADMIN
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateKYC,
    refreshUser,
    isAdmin,
    isSuperAdmin
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
