// src/screens/GuestScreens.jsx
import { useState, useEffect } from 'react'
import { bookings as bookingsApi, saved as savedApi, fmt, calcNights } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { useProperties } from '../lib/PropertiesContext.jsx'
import { Spinner, GoldBtn, EmptyState, StatusBadge, useToast, Toast } from '../components/UI.jsx'

const AREAS_STATIC = ['All Areas','New GRA','Old GRA','Trans-Amadi','Rumuibekwe','Rukpokwu','Woji','Eliozu']

// ── Listing card ───────────────────────────────────────────────────────────────
function ListingCard({ p, onClick, saved, onToggleSave, compact }) {
  const mainPhoto = p.photos?.[0]
  return (
    <div onClick={onClick} style={{ borderRadius: compact ? 14 : 18, overflow: 'hidden', cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)', flexShrink: 0, width: compact ? '100%' : 200, boxShadow: '0 4px 24px rgba(0,0,0,0.3)', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)' }}
    >
      <div style={{ height: compact ? 110 : 130, background: '#1a1a2e', position: 'relative', overflow: 'hidden' }}>
        {mainPhoto
          ? <img src={mainPhoto} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🏠</div>
        }
        <div style={{ position: 'absolute', top: 8, left: 8, background: '#C9A84C', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#fff' }}>{p.type}</div>
        <button onClick={e => { e.stopPropagation(); onToggleSave(p.id) }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: saved ? '#ef4444' : 'rgba(255,255,255,0.8)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >{saved ? '♥' : '♡'}</button>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7 }}>📍 {p.area}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><span style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C' }}>{fmt(p.price_per_night)}</span><span style={{ fontSize: 10, color: 'var(--text-faint)' }}>/night</span></div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>★ {p.rating > 0 ? Number(p.rating).toFixed(1) : 'New'}</div>
        </div>
      </div>
    </div>
  )
}

// ── Bottom Nav ─────────────────────────────────────────────────────────────────
function BottomNav({ screen, setScreen }) {
  const items = [
    { id: 'home',     icon: '⌂', label: 'Home'     },
    { id: 'explore',  icon: '⊞', label: 'Explore'  },
    { id: 'bookings', icon: '◫', label: 'Bookings' },
    { id: 'profile',  icon: '◉', label: 'Profile'  },
  ]
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(8,8,20,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', zIndex: 100 }}>
      {items.map(it => (
        <button key={it.id} onClick={() => setScreen(it.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 13px', background: 'none', border: 'none', cursor: 'pointer', gap: 3 }}>
          <span style={{ fontSize: 20, color: screen === it.id ? '#C9A84C' : 'rgba(255,255,255,0.3)', transform: screen === it.id ? 'translateY(-2px)' : 'none', transition: 'all 0.2s', display: 'block' }}>{it.icon}</span>
          <span style={{ fontSize: 9, letterSpacing: 0.8, fontWeight: 600, textTransform: 'uppercase', color: screen === it.id ? '#C9A84C' : 'rgba(255,255,255,0.3)' }}>{it.label}</span>
        </button>
      ))}
    </nav>
  )
}

// ── HOME ───────────────────────────────────────────────────────────────────────
export function HomeScreen({ setScreen, setDetailId, savedIds, onToggleSave }) {
  // ✅ Reads from shared PropertiesContext — no local fetch
  const { listings, loading, error, total, refresh } = useProperties()
  const [chip, setChip] = useState('All')
  const TYPES = ['All', 'Studio', '1 Bedroom', '2 Bedrooms', '3+ Bedrooms']

  const filtered = chip === 'All' ? listings : listings.filter(p => p.type === chip)
  const featured = filtered.slice(0, 6)

  const SERVICES = [
    { icon: '✈️', title: 'Airport Pickup',  price: 'From ₦15,000',   color: '#1a1a2e' },
    { icon: '🚗', title: 'Local Transport', price: 'From ₦8,000/day', color: '#0f2b1a' },
    { icon: '🧹', title: 'Housekeeping',    price: 'From ₦5,000',    color: '#0d2137' },
  ]

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg,#080814 0%,#0d1a35 60%,#1a0d2e 100%)', padding: '32px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Port Harcourt, Nigeria</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#fff', fontWeight: 700, lineHeight: 1.2, marginBottom: 18 }}>Find Your<br /><span style={{ color: '#C9A84C' }}>Perfect Stay</span></div>
        <div onClick={() => setScreen('explore')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '13px 16px', cursor: 'pointer', marginBottom: 20 }}>
          <span style={{ opacity: 0.4, fontSize: 15 }}>🔍</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>Search GRA, Trans-Amadi, Rukpokwu…</span>
        </div>
        <div style={{ display: 'flex' }}>
          {[[`${total}+`, 'Listings'], ['4.8★', 'Avg Rating'], ['500+', 'Guests']].map(([n, l], i) => (
            <div key={l} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#C9A84C' }}>{n}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Type chips */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 20px', overflowX: 'auto' }}>
        {TYPES.map(t => (
          <button key={t} onClick={() => setChip(t)} style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, border: chip === t ? 'none' : '1px solid rgba(255,255,255,0.1)', background: chip === t ? '#C9A84C' : 'rgba(255,255,255,0.04)', color: chip === t ? '#000' : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: chip === t ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>{t}</button>
        ))}
      </div>

      {/* Featured */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#fff' }}>Featured Stays</div>
        <button onClick={() => setScreen('explore')} style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>View all →</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Spinner /></div>
      ) : error ? (
        <div style={{ margin: '0 20px', padding: 14, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⚠️</span>
          <div style={{ flex: 1, fontSize: 13, color: '#ef4444' }}>Could not load listings</div>
          <button onClick={refresh} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        </div>
      ) : featured.length ? (
        <div style={{ display: 'flex', gap: 14, padding: '0 20px 4px', overflowX: 'auto' }}>
          {featured.map(p => (
            <ListingCard key={p.id} p={p}
              onClick={() => { setDetailId(p.id); setScreen('detail') }}
              saved={savedIds.includes(p.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏗️</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>No listings yet — hosts are getting ready.<br />Check back soon!</div>
        </div>
      )}

      {/* Concierge */}
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Concierge Services</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {SERVICES.map(s => (
            <div key={s.title} style={{ padding: 14, borderRadius: 14, background: s.color, border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{s.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust */}
      <div style={{ margin: '20px 20px 0', padding: '16px 18px', borderRadius: 16, background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#C9A84C', marginBottom: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Why ShortLet PH</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {['✓ Verified Listings', '✓ Instant Booking', '✓ 24/7 Support', '✓ Secure Payments'].map(b => (
            <div key={b} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{b}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── EXPLORE ────────────────────────────────────────────────────────────────────
export function ExploreScreen({ setScreen, setDetailId, savedIds, onToggleSave }) {
  // ✅ Reads from shared PropertiesContext — filtering is client-side on cached data
  const { listings, loading, error, refresh, areas } = useProperties()
  const [search, setSearch] = useState('')
  const [area,   setArea]   = useState('All Areas')
  const [sort,   setSort]   = useState('rating')

  const areaList = ['All Areas', ...new Set([...AREAS_STATIC.slice(1), ...areas])]

  const filtered = listings
    .filter(p => area === 'All Areas' || p.area === area)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.area.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === 'price_asc'  ? a.price_per_night - b.price_per_night :
      sort === 'price_desc' ? b.price_per_night - a.price_per_night :
      b.rating - a.rating
    )

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: '16px 16px 0', position: 'sticky', top: 56, background: 'var(--bg)', zIndex: 40, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#fff' }}>Explore Apartments</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {loading ? 'Loading…' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''} in Port Harcourt`}
            </div>
          </div>
          <button onClick={refresh} title="Refresh listings" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↻</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
          <span style={{ opacity: 0.4, fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, area, or type…" style={{ background: 'none', border: 'none', outline: 'none', flex: 1, color: '#fff', fontSize: 14, fontFamily: 'var(--font-body)' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>✕</button>}
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {areaList.map(a => (
            <button key={a} onClick={() => setArea(a)} style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 20, border: area === a ? 'none' : '1px solid rgba(255,255,255,0.1)', background: area === a ? '#C9A84C' : 'rgba(255,255,255,0.04)', color: area === a ? '#000' : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: area === a ? 700 : 400, cursor: 'pointer' }}>{a}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[['rating', 'Top Rated'], ['price_asc', 'Price ↑'], ['price_desc', 'Price ↓']].map(([v, l]) => (
            <button key={v} onClick={() => setSort(v)} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: sort === v ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.1)', background: sort === v ? 'rgba(201,168,76,0.1)' : 'transparent', color: sort === v ? '#C9A84C' : 'rgba(255,255,255,0.5)' }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
      ) : error ? (
        <div style={{ margin: '20px 16px', padding: 16, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 10 }}>{error}</div>
          <button onClick={refresh} style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '14px 12px' }}>
          {filtered.map(p => (
            <ListingCard key={p.id} p={p} compact
              onClick={() => { setDetailId(p.id); setScreen('detail') }}
              saved={savedIds.includes(p.id)}
              onToggleSave={onToggleSave}
            />
          ))}
          {!filtered.length && (
            <div style={{ gridColumn: '1/-1', padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6 }}>No results found</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Try a different area or search term.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── DETAIL ─────────────────────────────────────────────────────────────────────
export function DetailScreen({ propertyId, prevScreen, setScreen, savedIds, onToggleSave, onBook }) {
  const { getById } = useProperties()           // ✅ check cache first
  const { user, isLoggedIn } = useAuth()
  const cached = getById(propertyId)

  const [p,          setP]          = useState(cached)
  const [loading,    setLoading]    = useState(!cached)
  const [showModal,  setShowModal]  = useState(false)

  useEffect(() => {
    if (cached) { setP(cached); setLoading(false); return }
    // Not in cache — fetch directly (handles bookmarks or non-approved view)
    supabase
      .from('properties')
      .select('*, vendors(id, full_name, avatar_url, created_at)')
      .eq('id', propertyId)
      .single()
      .then(({ data, error }) => { if (!error && data) setP(data); setLoading(false) })
  }, [propertyId, cached])

  // Keep in sync if vendor edits and context refreshes
  useEffect(() => { if (cached) setP(cached) }, [cached])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner /></div>
  if (!p) return <EmptyState icon="⚠️" title="Property not found" sub="This listing may no longer be available." action={() => setScreen(prevScreen)} actionLabel="Go back" />

  const isSaved = savedIds.includes(p.id)
  const photos  = p.photos || []

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* Photos */}
      <div style={{ position: 'relative' }}>
        {photos.length > 0 ? (
          <div style={{ height: 280, display: 'grid', gridTemplateColumns: photos.length > 1 ? '1fr 1fr' : '1fr', gap: 2 }}>
            <img src={photos[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {photos.length > 1 && (
              <div style={{ display: 'grid', gridTemplateRows: 'repeat(2,1fr)', gap: 2 }}>
                {photos.slice(1, 3).map((ph, i) => <img key={i} src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />)}
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: 280, background: 'linear-gradient(135deg,#1a1a2e,#0d2137)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>🏠</div>
        )}
        <button onClick={() => setScreen(prevScreen)} style={{ position: 'absolute', top: 16, left: 16, width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 20, cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <button onClick={() => onToggleSave(p.id)} style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.1)', color: isSaved ? '#ef4444' : '#fff', fontSize: 17, cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}>{isSaved ? '♥' : '♡'}</button>
        {photos.length > 3 && <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 10px', fontSize: 11, color: '#fff', fontWeight: 600 }}>+{photos.length - 3} photos</div>}
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>{p.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>📍 {p.area}, Port Harcourt</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
          <div><span style={{ fontSize: 26, fontWeight: 700, color: '#C9A84C' }}>{fmt(p.price_per_night)}</span><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/night</span></div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>★ {p.rating > 0 ? Number(p.rating).toFixed(1) : 'New'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.total_reviews} review{p.total_reviews !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {[['🛏️', `${p.beds} Bed${p.beds > 1 ? 's' : ''}`], ['🚿', `${p.baths} Bath`], ['👥', `${p.max_guests} Guests`]].map(([ic, lb]) => (
            <div key={lb} style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>{ic}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{lb}</div>
            </div>
          ))}
        </div>

        {p.amenities?.length > 0 && (
          <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Amenities</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {p.amenities.map(a => <div key={a} style={{ padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>✓ {a}</div>)}
            </div>
          </div>
        )}

        {p.description && (
          <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 }}>About this place</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75, fontWeight: 300 }}>{p.description}</div>
          </div>
        )}

        {p.vendors && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
              {p.vendors.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.vendors.full_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Superhost · Joined {new Date(p.vendors.created_at).getFullYear()}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(8,8,20,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px 20px', display: 'flex', gap: 10, backdropFilter: 'blur(20px)' }}>
        <GoldBtn onClick={() => isLoggedIn ? setShowModal(true) : setScreen('login')} style={{ flex: 1, padding: 14 }}>
          {isLoggedIn ? 'Reserve Now' : 'Sign In to Book'}
        </GoldBtn>
      </div>

      {showModal && <BookingModal property={p} onClose={() => setShowModal(false)} onConfirm={b => { setShowModal(false); onBook(b) }} />}
    </div>
  )
}

// ── BOOKING MODAL ──────────────────────────────────────────────────────────────
function BookingModal({ property: p, onClose, onConfirm }) {
  const { user } = useAuth()
  const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }
  const dayAfter = () => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0] }
  const [checkin,  setCheckin]  = useState(tomorrow())
  const [checkout, setCheckout] = useState(dayAfter())
  const [guests,   setGuests]   = useState(2)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(null)
  const [error,    setError]    = useState('')

  const nights = calcNights(checkin, checkout)
  const sub    = p.price_per_night * nights
  const fee    = Math.round(sub * 0.05)
  const total  = sub + fee

  const confirm = async () => {
    setLoading(true); setError('')
    try {
      const booking = await bookingsApi.create({
        property_id: p.id, guest_id: user.id, vendor_id: p.vendor_id,
        checkin_date: checkin, checkout_date: checkout, nights, guests_count: guests,
        price_per_night: p.price_per_night, subtotal: sub, service_fee: fee, total,
        status: 'upcoming', payment_status: 'pending',
        reference: 'PH-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      })
      setDone(booking); onConfirm(booking)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(6px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="animate-slide-up" style={{ background: '#0f0f1e', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: 430, border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        {!done ? <>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Reserve Your Stay</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>{p.title} · {p.area}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['CHECK-IN', checkin, setCheckin], ['CHECK-OUT', checkout, setCheckout]].map(([lb, val, set]) => (
              <div key={lb}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 600, letterSpacing: 0.8 }}>{lb}</div>
                <input type="date" value={val} onChange={e => set(e.target.value)} style={{ width: '100%', padding: '11px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
            <div><div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>Guests</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max {p.max_guests}</div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setGuests(g => Math.max(1, g - 1))} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', minWidth: 20, textAlign: 'center' }}>{guests}</span>
              <button onClick={() => setGuests(g => Math.min(p.max_guests, g + 1))} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16 }}>
            {[[`${fmt(p.price_per_night)} × ${nights} night${nights > 1 ? 's' : ''}`, fmt(sub)], ['Service fee (5%)', fmt(fee)]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}><span>{l}</span><span>{v}</span></div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#fff', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 4 }}>
              <span>Total</span><span style={{ color: '#C9A84C' }}>{fmt(total)}</span>
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', marginBottom: 12 }}>{error}</div>}
          <GoldBtn onClick={confirm} loading={loading}>Confirm Booking</GoldBtn>
        </> : (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>✅</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Booking Confirmed!</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>Your stay at <strong style={{ color: '#fff' }}>{p.title}</strong> is reserved.</div>
            <div style={{ padding: 16, borderRadius: 14, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.22)', marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 1.5, textTransform: 'uppercase' }}>Booking Reference</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C', letterSpacing: 3 }}>{done.reference}</div>
            </div>
            <GoldBtn onClick={onClose}>Done</GoldBtn>
          </div>
        )}
      </div>
    </div>
  )
}

// ── BOOKINGS ───────────────────────────────────────────────────────────────────
export function GuestBookingsScreen({ setScreen, setDetailId }) {
  const { user } = useAuth()
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    bookingsApi.getByGuest(user.id).then(data => { setList(data || []); setLoading(false) }).catch(() => setLoading(false))
  }, [user])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner /></div>
  if (!list.length) return <EmptyState icon="📋" title="No Bookings Yet" sub="Your upcoming and past stays will appear here." action={() => setScreen('explore')} actionLabel="Explore Stays" />

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: '18px 20px 14px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>My Bookings</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{list.length} reservation{list.length !== 1 ? 's' : ''}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
        {list.map(b => (
          <div key={b.id} onClick={() => { setDetailId(b.property_id); setScreen('detail') }} style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ height: 90, background: '#1a1a2e', position: 'relative', overflow: 'hidden' }}>
              {b.properties?.photos?.[0] ? <img src={b.properties.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🏠</div>}
              <div style={{ position: 'absolute', top: 8, right: 8 }}><StatusBadge status={b.status} /></div>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{b.properties?.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>📍 {b.properties?.area} · {b.checkin_date} → {b.checkout_date}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 10, color: '#C9A84C', letterSpacing: 1, fontWeight: 600 }}>{b.reference}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C' }}>{fmt(b.total)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PROFILE ────────────────────────────────────────────────────────────────────
export function GuestProfileScreen({ setScreen, onSignOut, onSwitchToVendor }) {
  const { user } = useAuth()
  const name     = user?.user_metadata?.full_name || 'Guest'
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const menuItems = [
    { icon: '📋', label: 'My Bookings',      action: () => setScreen('bookings') },
    { icon: '❤️', label: 'Saved Apartments', action: () => {} },
    { icon: '💳', label: 'Payment Methods',  action: () => {} },
    { icon: '🔔', label: 'Notifications',    action: () => {} },
    { icon: '💬', label: 'Help & Support',   action: () => {} },
    { icon: '🏠', label: 'Become a Host',    action: onSwitchToVendor },
    { icon: '🚪', label: 'Sign Out',         action: onSignOut, danger: true },
  ]
  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ background: 'linear-gradient(160deg,#080814,#1a0d2e)', padding: '40px 20px 28px', textAlign: 'center' }}>
        <div style={{ width: 78, height: 78, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#000', margin: '0 auto 12px', boxShadow: '0 8px 32px rgba(201,168,76,0.3)', fontFamily: 'var(--font-display)' }}>{initials}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', fontWeight: 700, marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{user?.email}</div>
      </div>
      <div style={{ padding: '8px 16px' }}>
        {menuItems.map((m, i) => (
          <div key={m.label} onClick={m.action} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 4px', borderBottom: i < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{m.icon}</span>
            <span style={{ flex: 1, fontSize: 14, color: m.danger ? '#ef4444' : '#fff', fontWeight: 500 }}>{m.label}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── GUEST APP SHELL ────────────────────────────────────────────────────────────
export function GuestApp({ onSwitchToVendor, onSignOut }) {
  const { user }               = useAuth()
  const [screen, setScreenRaw] = useState('home')
  const [prev,   setPrev]      = useState('home')
  const [detailId, setDetailId] = useState(null)
  const [savedIds, setSavedIds] = useState([])
  const { toast, toastState }  = useToast()

  useEffect(() => {
    if (user) savedApi.get(user.id).then(ids => setSavedIds(ids || [])).catch(() => {})
  }, [user])

  const setScreen = (s) => {
    if (s !== 'detail') setPrev(screen)
    setScreenRaw(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSave = async (propertyId) => {
    if (!user) { toast('Sign in to save listings', 'info'); return }
    const nowSaved = await savedApi.toggle(user.id, propertyId)
    setSavedIds(ids => nowSaved ? [...ids, propertyId] : ids.filter(id => id !== propertyId))
    toast(nowSaved ? 'Saved! ❤️' : 'Removed from saved', nowSaved ? 'success' : 'info')
  }

  const isDetail = screen === 'detail'
  const shared   = { savedIds, onToggleSave: toggleSave }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', width: '100%', maxWidth: 430, position: 'relative', overflowX: 'hidden' }}>
      {!isDetail && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', background: 'rgba(8,8,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
            <span style={{ color: '#fff' }}>Short</span><span style={{ color: '#C9A84C' }}>Let</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 400, marginLeft: 4 }}>PH</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['🔔', '💬'].map((ic, i) => <button key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</button>)}
          </div>
        </div>
      )}

      {screen === 'home'     && <HomeScreen     {...shared} setScreen={setScreen} setDetailId={setDetailId} />}
      {screen === 'explore'  && <ExploreScreen  {...shared} setScreen={setScreen} setDetailId={setDetailId} />}
      {screen === 'detail'   && <DetailScreen   {...shared} propertyId={detailId} prevScreen={prev} setScreen={setScreen} onBook={() => toast('Booking confirmed! 🎉', 'success')} />}
      {screen === 'bookings' && <GuestBookingsScreen setScreen={setScreen} setDetailId={setDetailId} />}
      {screen === 'profile'  && <GuestProfileScreen setScreen={setScreen} onSignOut={onSignOut} onSwitchToVendor={onSwitchToVendor} />}

      {!isDetail && <BottomNav screen={screen} setScreen={setScreen} />}
      <Toast {...toastState} />
    </div>
  )
}
