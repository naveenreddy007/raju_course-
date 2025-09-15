import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create Supabase client with service role for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  isActive: boolean
  supabaseId: string
}

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  message?: string
}

// Verify JWT token and get user
export async function requireAuth(token: string): Promise<User | null> {
  try {
    if (!token) {
      return null
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '')
    
    // Verify Supabase JWT token
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(cleanToken)
    
    if (authError || !authUser) {
      console.error('Auth verification error:', authError)
      return null
    }

    // Get user from our users table using supabaseId
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, isActive, supabaseId')
      .eq('supabaseId', authUser.id)
      .single()

    if (userError || !user || !user.isActive) {
      console.error('User lookup error:', userError)
      return null
    }

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return { success: false, message: 'Invalid credentials' }
    }

    // Get user from our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, isActive, supabaseId')
      .eq('supabaseId', authData.user.id)
      .single()

    if (userError || !user) {
      return { success: false, message: 'User not found' }
    }

    if (!user.isActive) {
      return { success: false, message: 'Account is inactive' }
    }

    // Update last login
    await supabase
      .from('users')
      .update({ lastLoginAt: new Date().toISOString() })
      .eq('id', user.id)

    return {
      success: true,
      user,
      token: authData.session?.access_token
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, message: 'Login failed' }
  }
}

// Register user
export async function registerUser(email: string, password: string, name: string): Promise<AuthResult> {
  try {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError || !authData.user) {
      return { success: false, message: authError?.message || 'Registration failed' }
    }

    // Create user in our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        name,
        role: 'USER',
        supabaseId: authData.user.id,
        emailVerified: authData.user.email_confirmed_at ? true : false
      })
      .select('id, email, name, role, isActive, supabaseId')
      .single()

    if (userError) {
      console.error('User creation error:', userError)
      return { success: false, message: 'Failed to create user profile' }
    }

    return {
      success: true,
      user,
      token: authData.session?.access_token
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, message: 'Registration failed' }
  }
}