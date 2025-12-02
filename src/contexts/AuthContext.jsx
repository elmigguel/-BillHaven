import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // Timeout wrapper to prevent infinite loading state
    const AUTH_TIMEOUT = 10000 // 10 seconds
    let timeoutId = null
    let isMounted = true

    const getSessionWithTimeout = async () => {
      return Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout - check your connection')), AUTH_TIMEOUT)
        )
      ])
    }

    // Check active session with timeout protection
    getSessionWithTimeout()
      .then(({ data: { session } }) => {
        if (!isMounted) return
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      })
      .catch((error) => {
        if (!isMounted) return
        console.error('Auth check failed:', error)
        setAuthError(error.message)
        setLoading(false) // CRITICAL: Always set loading to false on error
      })

    // Safety timeout - if loading is still true after 15 seconds, force it to false
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout - forcing app to continue')
        setLoading(false)
      }
    }, 15000)

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const updateProfile = async (updates) => {
    // FIX: Guard against null user
    if (!user?.id) {
      return { data: null, error: new Error('User not authenticated') }
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Client-side admin check (for UI display only - NOT for security)
  // IMPORTANT: All actual security checks happen via RLS policies on the server
  const isAdmin = () => {
    return profile?.role === 'admin'
  }

  // Server-side admin verification (use this for sensitive operations)
  const verifyAdminServer = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin')
      if (error) throw error
      return data === true
    } catch (error) {
      console.error('Admin verification failed:', error)
      return false
    }
  }

  const value = {
    user,
    profile,
    loading,
    authError,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    isAdmin,
    verifyAdminServer
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
