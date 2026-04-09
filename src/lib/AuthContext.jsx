// src/lib/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { vendors, auth as authApi } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,      setSession]      = useState(null)
  const [user,         setUser]         = useState(null)
  const [vendorProfile, setVendorProfile] = useState(null)
  const [role,         setRole]         = useState(null) // 'guest' | 'vendor'
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadUser(session.user)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) loadUser(session.user)
      else {
        setUser(null); setRole(null); setVendorProfile(null); setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUser = async (u) => {
    setUser(u)
    const userRole = u.user_metadata?.role || 'guest'
    setRole(userRole)

    if (userRole === 'vendor') {
      try {
        const profile = await vendors.getProfile(u.id)
        setVendorProfile(profile)
      } catch (e) {
        console.error('Could not load vendor profile', e)
      }
    }
    setLoading(false)
  }

  const refreshVendorProfile = async () => {
    if (user && role === 'vendor') {
      const profile = await vendors.getProfile(user.id)
      setVendorProfile(profile)
    }
  }

  const signOut = async () => {
    await authApi.signOut()
    setUser(null); setSession(null); setRole(null); setVendorProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      session, user, role, vendorProfile,
      loading, signOut, refreshVendorProfile,
      isVendor: role === 'vendor',
      isGuest: role === 'guest',
      isLoggedIn: !!session,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
