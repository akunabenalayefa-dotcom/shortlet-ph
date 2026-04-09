// src/App.jsx
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext.jsx'
import { PropertiesProvider } from './lib/PropertiesContext.jsx'
import { GuestApp } from './screens/GuestScreens.jsx'
import { VendorPortal } from './screens/VendorPortal.jsx'
import {
  GuestLogin, GuestRegister,
  VendorLogin, VendorRegister,
  ForgotPassword,
} from './screens/AuthScreens.jsx'
import { Spinner } from './components/UI.jsx'

// ── Auth flow controller ───────────────────────────────────────────────────────
function AppRouter() {
  const { loading, isLoggedIn, isVendor, signOut } = useAuth()
  const [authScreen, setAuthScreen] = useState(null) // null | 'guestLogin' | 'guestRegister' | 'vendorLogin' | 'vendorRegister' | 'forgot'
  const [mode, setMode] = useState('guest') // 'guest' | 'vendor'

  // If loading, show spinner
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080814' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
          <span style={{ color: '#fff' }}>Short</span><span style={{ color: '#C9A84C' }}>Let</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: 400, marginLeft: 4 }}>PH</span>
        </div>
        <Spinner size={28} />
      </div>
    </div>
  )

  // Logged in as vendor → show vendor portal
  if (isLoggedIn && isVendor) {
    return (
      <div style={{ width: '100%' }}>
        <VendorPortal onSignOut={signOut} />
      </div>
    )
  }

  // Logged in as guest → show guest app (wrapped in live data provider)
  if (isLoggedIn && !isVendor) {
    return (
      <PropertiesProvider>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <GuestApp
            onSwitchToVendor={() => setAuthScreen('vendorRegister')}
            onSignOut={signOut}
          />
        </div>
      </PropertiesProvider>
    )
  }

  // Auth screens
  if (authScreen === 'guestLogin')    return <GuestLogin    onSuccess={() => setAuthScreen(null)} onRegister={() => setAuthScreen('guestRegister')} onForgot={() => setAuthScreen('forgot')} onVendorLogin={() => setAuthScreen('vendorLogin')} />
  if (authScreen === 'guestRegister') return <GuestRegister onSuccess={() => setAuthScreen(null)} onLogin={() => setAuthScreen('guestLogin')} />
  if (authScreen === 'vendorLogin')   return <VendorLogin   onSuccess={() => setAuthScreen(null)} onRegister={() => setAuthScreen('vendorRegister')} onForgot={() => setAuthScreen('forgot')} onGuestLogin={() => setAuthScreen('guestLogin')} />
  if (authScreen === 'vendorRegister') return <VendorRegister onSuccess={() => setAuthScreen(null)} onLogin={() => setAuthScreen('vendorLogin')} />
  if (authScreen === 'forgot')        return <ForgotPassword onBack={() => setAuthScreen(authScreen === 'vendorLogin' ? 'vendorLogin' : 'guestLogin')} />

  // Default: Guest app (browse without signing in)
  // Guest app is accessible without auth; booking requires sign-in
  return (
    <PropertiesProvider>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <GuestApp
          onSwitchToVendor={() => setAuthScreen('vendorRegister')}
          onSignOut={() => setAuthScreen('guestLogin')}
          onRequestLogin={() => setAuthScreen('guestLogin')}
        />
      </div>
    </PropertiesProvider>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
