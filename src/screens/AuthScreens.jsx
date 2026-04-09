// src/screens/AuthScreens.jsx
import { useState } from 'react'
import { auth as authApi } from '../lib/api.js'
import { GoldBtn, Input, Spinner } from '../components/UI.jsx'

function AuthWrap({ children, title, sub }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg,#080814 0%,#0d1a35 60%,#1a0d2e 100%)',
      padding: '24px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
            <span style={{ color: '#fff' }}>Short</span><span style={{ color: '#C9A84C' }}>Let</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: 400, marginLeft: 4 }}>PH</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{sub}</div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)', padding: '28px 24px',
          backdropFilter: 'blur(16px)',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── GUEST REGISTER ────────────────────────────────────────────────────────────
export function GuestRegister({ onSuccess, onLogin }) {
  const [form, setForm]   = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone]   = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!form.email.includes('@')) e.email = 'Valid email required'
    if (form.password.length < 8) e.password = 'Min 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await authApi.signUpGuest({ email: form.email, password: form.password, fullName: form.fullName, phone: form.phone })
      setDone(true)
    } catch (err) {
      setErrors({ submit: err.message })
    } finally { setLoading(false) }
  }

  if (done) return (
    <AuthWrap title="Check Your Email" sub="We sent a confirmation link to your inbox.">
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 24 }}>
          Click the link in your email to activate your account, then come back to log in.
        </div>
        <GoldBtn onClick={onLogin}>Go to Login</GoldBtn>
      </div>
    </AuthWrap>
  )

  return (
    <AuthWrap title="Create Guest Account" sub="Book premium apartments in Port Harcourt">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Full Name" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g. Chidi Okeke" error={errors.fullName} />
        <Input label="Email Address" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" error={errors.email} />
        <Input label="Phone Number" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+234 803 000 0000" />
        <Input label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" error={errors.password} />
        <Input label="Confirm Password" type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Re-enter password" error={errors.confirm} />
        {errors.submit && <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center' }}>{errors.submit}</div>}
        <GoldBtn type="submit" loading={loading} style={{ marginTop: 4 }}>Create Account</GoldBtn>
      </form>
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
        Already have an account?{' '}
        <span onClick={onLogin} style={{ color: '#C9A84C', cursor: 'pointer', fontWeight: 600 }}>Sign in</span>
      </div>
    </AuthWrap>
  )
}

// ── GUEST LOGIN ───────────────────────────────────────────────────────────────
export function GuestLogin({ onSuccess, onRegister, onForgot, onVendorLogin }) {
  const [email, setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.signIn({ email, password })
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <AuthWrap title="Welcome Back" sub="Sign in to your guest account">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" />
        {error && <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center' }}>{error}</div>}
        <span onClick={onForgot} style={{ fontSize: 12, color: '#C9A84C', cursor: 'pointer', textAlign: 'right', marginTop: -6 }}>Forgot password?</span>
        <GoldBtn type="submit" loading={loading}>Sign In</GoldBtn>
      </form>
      <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
        New here?{' '}<span onClick={onRegister} style={{ color: '#C9A84C', cursor: 'pointer', fontWeight: 600 }}>Create account</span>
      </div>
      <div style={{ textAlign: 'center', marginTop: 10, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
        Are you a host?{' '}<span onClick={onVendorLogin} style={{ color: '#C9A84C', cursor: 'pointer', fontWeight: 600 }}>Vendor login →</span>
      </div>
    </AuthWrap>
  )
}

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
export function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('')
  const [sent, setSent]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword(email)
      setSent(true)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <AuthWrap title="Reset Password" sub="We'll email you a reset link">
      {sent ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Check your inbox for the reset link.</div>
          <GoldBtn onClick={onBack}>Back to Login</GoldBtn>
        </div>
      ) : (
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
          {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}
          <GoldBtn type="submit" loading={loading}>Send Reset Link</GoldBtn>
          <span onClick={onBack} style={{ textAlign: 'center', fontSize: 13, color: '#C9A84C', cursor: 'pointer' }}>← Back to login</span>
        </form>
      )}
    </AuthWrap>
  )
}

// ── VENDOR REGISTER ───────────────────────────────────────────────────────────
export function VendorRegister({ onSuccess, onLogin }) {
  const [step, setStep]     = useState(1)
  const [form, setForm]     = useState({ fullName: '', email: '', phone: '', password: '', confirm: '', bankName: '', accountNumber: '', accountName: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validateStep1 = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!form.email.includes('@')) e.email = 'Valid email required'
    if (!form.phone) e.phone = 'Required'
    if (form.password.length < 8) e.password = 'Min 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await authApi.signUpVendor({
        email: form.email, password: form.password,
        fullName: form.fullName, phone: form.phone,
      })
      // Save bank info to vendor profile
      if (user) {
        const { supabase } = await import('../lib/supabase.js')
        await supabase.from('vendors').update({
          bank_name: form.bankName,
          bank_account: form.accountNumber,
          account_name: form.accountName,
        }).eq('id', user.id)
      }
      setDone(true)
    } catch (err) {
      setErrors({ submit: err.message })
    } finally { setLoading(false) }
  }

  if (done) return (
    <AuthWrap title="Application Submitted!" sub="">
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 6 }}>
          Welcome to ShortLet PH! Please confirm your email, then our team will review and activate your account within 24 hours.
        </div>
        <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', margin: '16px 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          ℹ️ Your listings will go live only after admin approval.
        </div>
        <GoldBtn onClick={onLogin}>Go to Login</GoldBtn>
      </div>
    </AuthWrap>
  )

  return (
    <AuthWrap title="Become a Host" sub={step === 1 ? 'Step 1 of 2 — Personal Details' : 'Step 2 of 2 — Payment Details'}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? '#C9A84C' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (validateStep1()) setStep(2) } : handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {step === 1 ? <>
          <Input label="Full Name" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g. Amaka Okonkwo" error={errors.fullName} />
          <Input label="Email Address" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" error={errors.email} />
          <Input label="Phone Number" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+234 803 000 0000" error={errors.phone} />
          <Input label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" error={errors.password} />
          <Input label="Confirm Password" type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Re-enter password" error={errors.confirm} />
          <GoldBtn type="submit" style={{ marginTop: 4 }}>Continue →</GoldBtn>
        </> : <>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, padding: '10px 12px', borderRadius: 10, background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.15)' }}>
            💳 Your payout details. Earnings are transferred after each completed booking.
          </div>
          <Input label="Bank Name" value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="e.g. First Bank" />
          <Input label="Account Number" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} placeholder="10-digit account number" />
          <Input label="Account Name" value={form.accountName} onChange={e => set('accountName', e.target.value)} placeholder="As it appears on your account" />
          {errors.submit && <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center' }}>{errors.submit}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <GoldBtn onClick={() => setStep(1)} style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', flex: 1 }}>← Back</GoldBtn>
            <GoldBtn type="submit" loading={loading} style={{ flex: 2 }}>Submit Application</GoldBtn>
          </div>
        </>}
      </form>
      <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
        Already a host?{' '}<span onClick={onLogin} style={{ color: '#C9A84C', cursor: 'pointer', fontWeight: 600 }}>Sign in</span>
      </div>
    </AuthWrap>
  )
}

// ── VENDOR LOGIN ──────────────────────────────────────────────────────────────
export function VendorLogin({ onSuccess, onRegister, onForgot, onGuestLogin }) {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.signIn({ email, password })
      onSuccess()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <AuthWrap title="Host Login" sub="Access your ShortLet PH vendor portal">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="host@email.com" />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" />
        {error && <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center' }}>{error}</div>}
        <span onClick={onForgot} style={{ fontSize: 12, color: '#C9A84C', cursor: 'pointer', textAlign: 'right', marginTop: -6 }}>Forgot password?</span>
        <GoldBtn type="submit" loading={loading}>Sign In to Portal</GoldBtn>
      </form>
      <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
        New host?{' '}<span onClick={onRegister} style={{ color: '#C9A84C', cursor: 'pointer', fontWeight: 600 }}>Apply to list your property</span>
      </div>
      <div style={{ textAlign: 'center', marginTop: 10, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
        Looking to book?{' '}<span onClick={onGuestLogin} style={{ color: '#C9A84C', cursor: 'pointer', fontWeight: 600 }}>Guest login →</span>
      </div>
    </AuthWrap>
  )
}
