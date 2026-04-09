// src/components/UI.jsx
// Shared primitive components used across both guest app and vendor portal

// ── Toast ──────────────────────────────────────────────────────────────────
export function Toast({ msg, show, type = 'info' }) {
  const bg = type === 'error' ? '#ef4444' : type === 'success' ? '#1D9E75' : 'rgba(15,15,30,0.97)'
  return (
    <div style={{
      position: 'fixed', top: 24, left: '50%',
      transform: `translateX(-50%) translateY(${show ? 0 : -80}px)`,
      background: bg, color: '#fff', padding: '10px 22px',
      borderRadius: 40, fontSize: 13, fontWeight: 500, zIndex: 9999,
      transition: 'all 0.35s cubic-bezier(.34,1.56,.64,1)',
      opacity: show ? 1 : 0, pointerEvents: 'none',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      whiteSpace: 'nowrap', backdropFilter: 'blur(16px)',
    }}>{msg}</div>
  )
}

// ── useToast hook ───────────────────────────────────────────────────────────
import { useState, useRef, useCallback } from 'react'
export function useToast() {
  const [state, setState] = useState({ msg: '', show: false, type: 'info' })
  const timer = useRef(null)
  const toast = useCallback((msg, type = 'info') => {
    setState({ msg, show: true, type })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState(s => ({ ...s, show: false })), 2800)
  }, [])
  return { toast, toastState: state }
}

// ── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = '#C9A84C' }) {
  return (
    <div className="spin" style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(255,255,255,0.1)`,
      borderTopColor: color, flexShrink: 0,
    }} />
  )
}

// ── Gold Button ─────────────────────────────────────────────────────────────
export function GoldBtn({ children, onClick, loading, disabled, style = {}, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{
      padding: '14px 24px', borderRadius: 12,
      background: disabled ? 'rgba(201,168,76,0.3)' : 'linear-gradient(135deg, #C9A84C, #8B6914)',
      color: '#000', fontSize: 15, fontWeight: 700, border: 'none',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'opacity 0.2s', letterSpacing: 0.3, width: '100%',
      ...style,
    }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.opacity = '0.88' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      {loading && <Spinner size={16} color="#000" />}
      {children}
    </button>
  )
}

// ── Ghost Button ────────────────────────────────────────────────────────────
export function GhostBtn({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      padding: '13px 24px', borderRadius: 12,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#fff', fontSize: 14, fontWeight: 500,
      cursor: 'pointer', width: '100%', transition: 'background 0.2s',
      ...style,
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    >{children}</button>
  )
}

// ── Text Input (dark) ────────────────────────────────────────────────────────
export function Input({ label, error, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</label>}
      <input style={{
        padding: '12px 14px', borderRadius: 10,
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
        color: '#fff', fontSize: 14, outline: 'none',
        transition: 'border-color 0.2s', width: '100%',
        ...style,
      }}
        onFocus={e => { if (!error) e.target.style.borderColor = '#C9A84C' }}
        onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>}
    </div>
  )
}

// ── Text Input (light — for vendor portal) ──────────────────────────────────
export function LightInput({ label, error, hint, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: '#6b5c45', letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</label>}
      <input style={{
        padding: '11px 14px', borderRadius: 10,
        border: `1px solid ${error ? '#ef4444' : '#e8ddd0'}`,
        background: '#faf8f5', fontSize: 14, outline: 'none',
        color: '#1a1209', transition: 'border-color 0.2s', width: '100%',
        ...style,
      }}
        onFocus={e => { if (!error) e.target.style.borderColor = '#C9A84C' }}
        onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : '#e8ddd0' }}
        {...props}
      />
      {hint && !error && <span style={{ fontSize: 11, color: '#b0a090' }}>{hint}</span>}
      {error && <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, color = '#C9A84C', bg }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20, fontSize: 10,
      fontWeight: 700, letterSpacing: 0.5,
      color, background: bg || color + '18',
      border: `1px solid ${color}30`,
    }}>{label}</div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    live:       { label: '● LIVE',          color: '#1D9E75' },
    approved:   { label: '● LIVE',          color: '#1D9E75' },
    pending:    { label: '⏳ PENDING',       color: '#C9A84C' },
    rejected:   { label: '✕ REJECTED',      color: '#ef4444' },
    suspended:  { label: '⏸ SUSPENDED',     color: '#D85A30' },
    upcoming:   { label: '⏳ UPCOMING',      color: '#C9A84C' },
    active:     { label: '● ACTIVE',        color: '#1D9E75' },
    completed:  { label: '✓ COMPLETED',     color: '#6b7280' },
    cancelled:  { label: '✕ CANCELLED',     color: '#ef4444' },
    paid:       { label: '✓ PAID',          color: '#1D9E75' },
    processing: { label: '⏳ PROCESSING',    color: '#C9A84C' },
  }
  const s = map[status] || { label: status, color: '#9c8f7e' }
  return <Badge label={s.label} color={s.color} />
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action, actionLabel }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 48 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#fff' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 260 }}>{sub}</div>
      {action && (
        <button onClick={action} style={{
          marginTop: 8, padding: '11px 24px', borderRadius: 12,
          background: 'linear-gradient(135deg, #C9A84C, #8B6914)',
          color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
        }}>{actionLabel}</button>
      )}
    </div>
  )
}

// ── Photo Grid ────────────────────────────────────────────────────────────────
export function PhotoGrid({ photos = [], title }) {
  if (!photos.length) return (
    <div style={{ height: 280, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🏠</div>
  )
  const [main, ...rest] = photos
  return (
    <div style={{ height: 280, display: 'grid', gridTemplateColumns: rest.length ? '1fr 1fr' : '1fr', gap: 2 }}>
      <img src={main} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {rest.length > 0 && (
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: 2 }}>
          {rest.slice(0, 2).map((p, i) => (
            <img key={i} src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ))}
        </div>
      )}
    </div>
  )
}
