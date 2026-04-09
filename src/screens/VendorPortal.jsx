// src/screens/VendorPortal.jsx
import { useState, useEffect, useRef } from 'react'
import { properties as propsApi, bookings as bookingsApi, messages as msgsApi, payouts as payoutsApi, availability as availApi, vendors, fmt } from '../lib/api.js'
import { uploadMultiple } from '../lib/cloudinary.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { Spinner, GoldBtn, LightInput, StatusBadge, useToast, Toast, EmptyState } from '../components/UI.jsx'

const AMENITY_OPTIONS = ['WiFi', '24/7 Power', 'AC', 'Parking', 'Pool', 'Full Kitchen', 'Laundry', 'Security', 'City View', '2 Baths', 'DSTV', 'Gym']
const AREAS = ['New GRA', 'Old GRA', 'Trans-Amadi', 'Rumuibekwe', 'Rukpokwu', 'D-Line', 'Woji', 'Eliozu', 'Peter Odili', 'Stadium Road']
const TYPES = ['Studio', '1 Bedroom', '2 Bedrooms', '3 Bedrooms', '4+ Bedrooms', 'Duplex', 'Penthouse', 'Serviced Flat']

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',   icon: '⊞', label: 'Dashboard'   },
  { id: 'properties',  icon: '🏠', label: 'Properties'  },
  { id: 'bookings',    icon: '📋', label: 'Bookings'    },
  { id: 'earnings',    icon: '💰', label: 'Earnings'    },
  { id: 'messages',    icon: '💬', label: 'Messages'    },
  { id: 'settings',    icon: '⚙️', label: 'Settings'    },
]

// ── PHOTO UPLOADER ────────────────────────────────────────────────────────────
function PhotoUploader({ photos, onPhotosChange }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState('')
  const fileRef = useRef()

  const handleFiles = async (files) => {
    if (!files.length) return
    setUploading(true)
    try {
      const urls = await uploadMultiple(Array.from(files), 'properties', (done, total) => {
        setProgress(`Uploading ${done}/${total}…`)
      })
      onPhotosChange([...photos, ...urls])
    } catch (e) {
      alert('Upload failed: ' + e.message)
    } finally { setUploading(false); setProgress('') }
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b5c45', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        Photos ({photos.length}/10)
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        {photos.map((url, i) => (
          <div key={i} style={{ width: 90, height: 90, borderRadius: 12, position: 'relative', overflow: 'hidden', border: '1px solid #e8ddd0', flexShrink: 0 }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {i === 0 && <div style={{ position: 'absolute', bottom: 4, left: 4, background: '#C9A84C', borderRadius: 4, padding: '1px 5px', fontSize: 8, fontWeight: 700, color: '#fff' }}>COVER</div>}
            <button onClick={() => onPhotosChange(photos.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        ))}
        {photos.length < 10 && (
          <div onClick={() => fileRef.current?.click()} style={{ width: 90, height: 90, borderRadius: 12, border: '2px dashed #d4c5b0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', color: '#b0a090', fontSize: 11, fontWeight: 600, gap: 4, background: 'rgba(201,168,76,0.03)' }}>
            {uploading ? <Spinner size={20} color="#C9A84C" /> : <><span style={{ fontSize: 22 }}>+</span><span>{progress || 'Add Photos'}</span></>}
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      <div style={{ fontSize: 11, color: '#b0a090' }}>Upload real photos from your device. First photo becomes the cover image. Supports JPG, PNG, WEBP.</div>
    </div>
  )
}

// ── PROPERTY FORM MODAL ───────────────────────────────────────────────────────
function PropertyModal({ property, vendorId, onClose, onSave }) {
  const isEdit = !!property
  const [form, setForm] = useState(property ? {
    title: property.title, area: property.area, type: property.type,
    beds: property.beds, baths: property.baths, max_guests: property.max_guests,
    price_per_night: property.price_per_night, description: property.description || '',
    amenities: property.amenities || [], photos: property.photos || [],
    address: property.address || '',
  } : {
    title: '', area: '', type: 'Studio', beds: 1, baths: 1, max_guests: 2,
    price_per_night: '', description: '', amenities: [], photos: [], address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleAmenity = (a) => set('amenities', form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a])

  const handleSave = async () => {
    if (!form.title.trim() || !form.area || !form.price_per_night) { setError('Title, area and price are required'); return }
    setLoading(true); setError('')
    try {
      const payload = { ...form, price_per_night: parseInt(form.price_per_night), vendor_id: vendorId }
      let result
      if (isEdit) {
        result = await propsApi.update(property.id, payload)
      } else {
        result = await propsApi.create({ ...payload, status: 'pending' })
      }
      onSave(result)
      onClose()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 660, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', border: '1px solid #f0ede8' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0ede8', position: 'sticky', top: 0, background: '#fff', zIndex: 10, borderRadius: '20px 20px 0 0' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1a1209' }}>{isEdit ? 'Edit Property' : 'List New Property'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9c8f7e' }}>✕</button>
        </div>
        <div style={{ padding: '24px 24px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <PhotoUploader photos={form.photos} onPhotosChange={p => set('photos', p)} />

          <LightInput label="Property Title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Luxury Studio, GRA" />
          <LightInput label="Full Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="e.g. 12 Tombia Street, New GRA" hint="Exact address shown only after booking confirmation" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b5c45', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Area</div>
              <select value={form.area} onChange={e => set('area', e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e8ddd0', background: '#faf8f5', fontSize: 14, outline: 'none', color: '#1a1209' }}>
                <option value="">Select area…</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b5c45', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Property Type</div>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e8ddd0', background: '#faf8f5', fontSize: 14, outline: 'none', color: '#1a1209' }}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['Bedrooms', 'beds'], ['Bathrooms', 'baths'], ['Max Guests', 'max_guests']].map(([lb, k]) => (
              <div key={k}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b5c45', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{lb}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: '1px solid #e8ddd0', background: '#faf8f5' }}>
                  <button onClick={() => set(k, Math.max(1, form[k] - 1))} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9c8f7e', padding: 0 }}>−</button>
                  <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#1a1209' }}>{form[k]}</span>
                  <button onClick={() => set(k, Math.min(20, form[k] + 1))} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9c8f7e', padding: 0 }}>+</button>
                </div>
              </div>
            ))}
          </div>

          <LightInput label="Price Per Night (₦)" type="number" value={form.price_per_night} onChange={e => set('price_per_night', e.target.value)} placeholder="e.g. 110000" hint="Enter amount in Naira, without commas" />

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b5c45', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Description</div>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Describe what makes your property special, nearby landmarks, what's included…" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e8ddd0', background: '#faf8f5', fontSize: 14, outline: 'none', resize: 'vertical', color: '#1a1209', lineHeight: 1.6, fontFamily: 'inherit' }} />
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b5c45', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Amenities</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {AMENITY_OPTIONS.map(a => {
                const on = form.amenities.includes(a)
                return (
                  <button key={a} onClick={() => toggleAmenity(a)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: on ? 'none' : '1px solid #e8ddd0', background: on ? '#C9A84C' : '#faf8f5', color: on ? '#fff' : '#6b5c45', transition: 'all 0.15s', fontFamily: 'inherit' }}>{a}</button>
                )
              })}
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 12, background: '#fffbf0', border: '1px solid #f0d990', display: 'flex', gap: 10 }}>
            <span>ℹ️</span>
            <div style={{ fontSize: 12, color: '#7a6a20', lineHeight: 1.6 }}>
              <strong>Admin review required.</strong> Listings go live within 24–48 hrs after approval. You'll get an email notification.
            </div>
          </div>

          {error && <div style={{ fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 12, background: '#f5f0ea', border: '1px solid #e8ddd0', color: '#6b5c45', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <GoldBtn onClick={handleSave} loading={loading} style={{ flex: 2, color: '#fff', background: 'linear-gradient(135deg,#C9A84C,#8B6914)' }}>
              {isEdit ? 'Save Changes' : 'Submit for Review →'}
            </GoldBtn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AVAILABILITY MODAL ────────────────────────────────────────────────────────
function AvailabilityModal({ property, onClose, toast }) {
  const today = new Date()
  const [year, setYear]     = useState(today.getFullYear())
  const [month, setMonth]   = useState(today.getMonth())
  const [blocked, setBlocked] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    availApi.getBlocked(property.id)
      .then(dates => { setBlocked(new Set(dates)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [property.id])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay    = new Date(year, month, 1).getDay()
  const monthName   = new Date(year, month).toLocaleString('default', { month: 'long' })

  const key = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const toggle = (day) => {
    const k = key(day)
    const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (isPast) return
    setBlocked(b => { const n = new Set(b); n.has(k) ? n.delete(k) : n.add(k); return n })
  }

  const save = async () => {
    setSaving(true)
    try {
      await availApi.setBlocked(property.id, [...blocked])
      toast('Availability saved!', 'success')
      onClose()
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', border: '1px solid #f0ede8', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0ede8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#1a1209' }}>Manage Availability</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9c8f7e' }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color: '#9c8f7e', marginBottom: 16 }}>{property.title} · Tap dates to block/unblock</div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={24} color="#C9A84C" /></div> : <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9c8f7e' }}>‹</button>
              <div style={{ fontWeight: 700, color: '#1a1209', fontSize: 15 }}>{monthName} {year}</div>
              <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9c8f7e' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#b0a090', padding: '4px 0' }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const bl = blocked.has(key(day))
                const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                return (
                  <button key={day} onClick={() => toggle(day)} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: bl ? '#ef4444' : isPast ? '#f9f6f2' : '#faf8f5', color: bl ? '#fff' : isPast ? '#d4c5b0' : '#1a1209', fontSize: 13, fontWeight: bl ? 700 : 400, cursor: isPast ? 'default' : 'pointer', transition: 'all 0.15s' }}>{day}</button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: '#9c8f7e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#faf8f5', border: '1px solid #e8ddd0' }} /> Available</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444' }} /> Blocked</div>
            </div>
            <GoldBtn onClick={save} loading={saving} style={{ marginTop: 20, color: '#fff', background: 'linear-gradient(135deg,#C9A84C,#8B6914)' }}>Save Availability</GoldBtn>
          </>}
        </div>
      </div>
    </div>
  )
}

// ── MESSAGING ─────────────────────────────────────────────────────────────────
function MessagingView({ vendorId, toast }) {
  const [convos, setConvos]   = useState([])
  const [active, setActive]   = useState(null)
  const [thread, setThread]   = useState([])
  const [reply, setReply]     = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    msgsApi.getConversations(vendorId)
      .then(data => { setConvos(data || []); setLoading(false) })
      .catch(() => setLoading(false))

    const sub = msgsApi.subscribe(vendorId, () => {
      msgsApi.getConversations(vendorId).then(data => setConvos(data || []))
    })
    return () => sub?.unsubscribe?.()
  }, [vendorId])

  const loadThread = async (msg) => {
    setActive(msg)
    const t = await msgsApi.getThread(msg.property_id, vendorId, msg.sender_id === vendorId ? msg.recipient_id : msg.sender_id)
    setThread(t || [])
    await msgsApi.markRead(t.filter(m => !m.is_read && m.recipient_id === vendorId).map(m => m.id))
  }

  const send = async () => {
    if (!reply.trim() || !active) return
    setSending(true)
    try {
      const otherId = active.sender_id === vendorId ? active.recipient_id : active.sender_id
      const msg = await msgsApi.send({ property_id: active.property_id, sender_id: vendorId, recipient_id: otherId, body: reply })
      setThread(t => [...t, msg])
      setReply('')
      toast('Message sent', 'success')
    } catch (e) { toast(e.message, 'error') }
    finally { setSending(false) }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 0, background: '#fff', borderRadius: 18, border: '1px solid #f0ede8', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 280, borderRight: '1px solid #f0ede8', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #f0ede8', fontWeight: 700, color: '#1a1209', fontSize: 14 }}>Conversations</div>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={24} color="#C9A84C" /></div>
          : convos.length ? convos.map(c => {
            const isActive = active?.id === c.id
            return (
              <div key={c.id} onClick={() => loadThread(c)} style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #f9f6f2', background: isActive ? '#fdf8f0' : '#fff', borderLeft: `3px solid ${isActive ? '#C9A84C' : 'transparent'}`, transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {c.sender?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1209', marginBottom: 2 }}>{c.sender?.full_name || 'Guest'}</div>
                    <div style={{ fontSize: 11, color: '#9c8f7e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.body}</div>
                  </div>
                  {!c.is_read && c.recipient_id === vendorId && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C9A84C', flexShrink: 0 }} />}
                </div>
              </div>
            )
          }) : <div style={{ padding: 24, textAlign: 'center', color: '#9c8f7e', fontSize: 13 }}>No messages yet</div>
        }
      </div>

      {/* Thread */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {active ? <>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0ede8' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1209' }}>{active.sender?.full_name || 'Guest'}</div>
            <div style={{ fontSize: 12, color: '#9c8f7e' }}>{active.properties?.title}</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {thread.map((m, i) => {
              const isMe = m.sender_id === vendorId
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: 14, background: isMe ? 'linear-gradient(135deg,#C9A84C,#8B6914)' : '#f5f0ea', color: isMe ? '#fff' : '#1a1209', fontSize: 13, lineHeight: 1.55, borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: !isMe ? 4 : 14 }}>
                    {m.body}
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>{new Date(m.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f0ede8', display: 'flex', gap: 10 }}>
            <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Type a reply…" style={{ flex: 1, padding: '10px 14px', borderRadius: 24, border: '1px solid #e8ddd0', background: '#faf8f5', fontSize: 13, outline: 'none', color: '#1a1209', fontFamily: 'inherit' }} />
            <button onClick={send} disabled={sending} style={{ padding: '10px 18px', borderRadius: 24, background: 'linear-gradient(135deg,#C9A84C,#8B6914)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: sending ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </> : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9c8f7e', fontSize: 14 }}>Select a conversation to reply</div>
        )}
      </div>
    </div>
  )
}

// ── VENDOR PORTAL MAIN ────────────────────────────────────────────────────────
export function VendorPortal({ onSignOut }) {
  const { user, vendorProfile, refreshVendorProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [properties, setProperties] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [myPayouts, setMyPayouts]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showPropModal, setShowPM]  = useState(false)
  const [editProp, setEditProp]     = useState(null)
  const [showAvail, setShowAvail]   = useState(null)
  const [mobileNav, setMobileNav]   = useState(false)
  const { toast, toastState }       = useToast()
  const isDesktop = window.innerWidth >= 768

  useEffect(() => {
    if (!user) return
    Promise.all([
      propsApi.getByVendor(user.id),
      bookingsApi.getByVendor(user.id),
      payoutsApi.getByVendor(user.id),
    ]).then(([p, b, py]) => {
      setProperties(p || [])
      setMyBookings(b || [])
      setMyPayouts(py || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const totalEarned  = myPayouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.net_amount, 0)
  const pendingPayout = myPayouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.net_amount, 0)
  const liveProps    = properties.filter(p => p.status === 'approved').length
  const upcomingBook = myBookings.filter(b => b.status === 'upcoming').length

  const saveProperty = (p) => {
    setProperties(ps => {
      const exists = ps.find(x => x.id === p.id)
      return exists ? ps.map(x => x.id === p.id ? p : x) : [p, ...ps]
    })
    toast(editProp ? 'Property updated!' : 'Submitted for review!', 'success')
    setEditProp(null)
  }

  const updateBookingStatus = async (id, status) => {
    try {
      await bookingsApi.updateStatus(id, status)
      setMyBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b))
      toast(`Booking marked as ${status}`, 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  const Sidebar = () => (
    <div style={{ width: 220, background: '#1a1209', minHeight: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
      <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700 }}>
          <span style={{ color: '#fff' }}>Short</span><span style={{ color: '#C9A84C' }}>Let</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 400, marginLeft: 4 }}>PH</span>
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 3, fontWeight: 600 }}>Host Portal</div>
      </div>
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {NAV.map(it => (
          <button key={it.id} onClick={() => setActiveTab(it.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: activeTab === it.id ? 'rgba(201,168,76,0.15)' : 'transparent', color: activeTab === it.id ? '#C9A84C' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: activeTab === it.id ? 700 : 400, cursor: 'pointer', marginBottom: 2, textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            <span style={{ fontSize: 16 }}>{it.icon}</span>
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0 }}>
            {vendorProfile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'V'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vendorProfile?.full_name || 'Vendor'}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Verified Host</div>
          </div>
        </div>
        <button onClick={onSignOut} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sign Out</button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#faf8f5', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <Sidebar />

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 60px', minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1a1209' }}>
              {activeTab === 'dashboard'  && `Welcome back, ${vendorProfile?.full_name?.split(' ')[0] || 'Host'} 👋`}
              {activeTab === 'properties' && 'My Properties'}
              {activeTab === 'bookings'   && 'Bookings'}
              {activeTab === 'earnings'   && 'Earnings & Payouts'}
              {activeTab === 'messages'   && 'Guest Messages'}
              {activeTab === 'settings'   && 'Account Settings'}
            </div>
            <div style={{ fontSize: 12, color: '#9c8f7e', marginTop: 2 }}>{new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          {activeTab === 'properties' && (
            <button onClick={() => { setEditProp(null); setShowPM(true) }} style={{ padding: '11px 20px', borderRadius: 12, background: 'linear-gradient(135deg,#C9A84C,#8B6914)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>+ List New Property</button>
          )}
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} color="#C9A84C" /></div> : <>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                {[
                  { icon: '🏠', label: 'Live Listings',   value: liveProps,              sub: `${properties.length - liveProps} pending review` },
                  { icon: '📋', label: 'Total Bookings',  value: myBookings.length,       sub: `${upcomingBook} upcoming` },
                  { icon: '💰', label: 'Total Earned',    value: fmt(totalEarned),        sub: '90% net after platform fee', accent: '#1D9E75' },
                  { icon: '⏳', label: 'Pending Payout',  value: fmt(pendingPayout),      sub: 'Awaiting processing', accent: '#C9A84C' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 16px', border: '1px solid #f0ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.accent || '#1a1209', fontFamily: "'Playfair Display', serif", marginBottom: 3 }}>{s.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1209', marginBottom: 2 }}>{s.label}</div>
                    {s.sub && <div style={{ fontSize: 11, color: '#9c8f7e' }}>{s.sub}</div>}
                  </div>
                ))}
              </div>

              {/* Upcoming bookings */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0ede8', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0ede8', fontWeight: 700, color: '#1a1209', fontSize: 14 }}>Upcoming Bookings</div>
                {myBookings.filter(b => b.status === 'upcoming').length ? myBookings.filter(b => b.status === 'upcoming').map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #f9f6f2' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: '#f5efe6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {b.properties?.photos?.[0] ? <img src={b.properties.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>🏠</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1209' }}>{b.guests?.full_name}</div>
                      <div style={{ fontSize: 11, color: '#9c8f7e' }}>{b.properties?.title} · {b.checkin_date} → {b.checkout_date} · {b.guests_count} guest{b.guests_count > 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C' }}>{fmt(b.total)}</div>
                    <StatusBadge status={b.status} />
                  </div>
                )) : <div style={{ padding: '24px 20px', textAlign: 'center', color: '#9c8f7e', fontSize: 13 }}>No upcoming bookings</div>}
              </div>

              {/* Quick actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { icon: '➕', label: 'List New Property', action: () => { setShowPM(true); setActiveTab('properties') } },
                  { icon: '📅', label: 'Manage Availability', action: () => properties[0] && setShowAvail(properties[0]) },
                  { icon: '💬', label: 'View Messages', action: () => setActiveTab('messages') },
                ].map(q => (
                  <button key={q.label} onClick={q.action} style={{ padding: '16px', borderRadius: 14, background: '#fff', border: '1px solid #f0ede8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,168,76,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0ede8'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}
                  >
                    <span style={{ fontSize: 20 }}>{q.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1209' }}>{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PROPERTIES ── */}
          {activeTab === 'properties' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {properties.length ? properties.map(p => (
                <div key={p.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0ede8', overflow: 'hidden', display: 'flex', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  {/* Photo strip */}
                  <div style={{ width: 180, flexShrink: 0 }}>
                    <div style={{ height: 130, background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {p.photos?.[0] ? <img src={p.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 40 }}>🏠</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, padding: 6, background: '#faf8f5', flexWrap: 'wrap' }}>
                      {(p.photos || []).slice(1, 5).map((ph, i) => (
                        <div key={i} style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: '#ede8e0' }}>
                          <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                      {(p.photos?.length || 0) > 5 && <div style={{ width: 32, height: 32, borderRadius: 6, background: '#ede8e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9c8f7e', fontWeight: 700 }}>+{p.photos.length - 5}</div>}
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: '#e8e0d8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }} onClick={() => { setEditProp(p); setShowPM(true) }} title="Edit photos">✏️</div>
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1a1209', marginBottom: 3 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: '#9c8f7e' }}>📍 {p.area} · {p.type} · {p.beds}bd · {p.baths}ba · {p.max_guests} guests</div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                      {[[fmt(p.price_per_night) + '/night', 'Price'], [p.total_reviews, 'Reviews'], [p.rating > 0 ? Number(p.rating).toFixed(1) + '★' : 'New', 'Rating']].map(([v, l]) => (
                        <div key={l}><div style={{ fontSize: 13, fontWeight: 700, color: '#1a1209' }}>{v}</div><div style={{ fontSize: 10, color: '#9c8f7e' }}>{l}</div></div>
                      ))}
                    </div>
                    {p.status === 'rejected' && p.admin_notes && <div style={{ fontSize: 12, color: '#ef4444', padding: '6px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fee2e2', marginBottom: 10 }}>Rejection note: {p.admin_notes}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setEditProp(p); setShowPM(true) }} style={{ padding: '6px 14px', borderRadius: 8, background: '#f5f0ea', border: '1px solid #e8ddd0', color: '#6b5c45', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                      <button onClick={() => setShowAvail(p)} style={{ padding: '6px 14px', borderRadius: 8, background: '#f5f0ea', border: '1px solid #e8ddd0', color: '#6b5c45', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📅 Availability</button>
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0ede8', padding: '48px 32px', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#1a1209', marginBottom: 8 }}>No properties yet</div>
                  <div style={{ fontSize: 13, color: '#9c8f7e', marginBottom: 20 }}>List your first property to start earning on ShortLet PH.</div>
                  <button onClick={() => setShowPM(true)} style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#C9A84C,#8B6914)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>+ List First Property</button>
                </div>
              )}
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {activeTab === 'bookings' && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0ede8', overflow: 'hidden' }}>
              {myBookings.length ? myBookings.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: '1px solid #f9f6f2' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: '#f5efe6', overflow: 'hidden', flexShrink: 0 }}>
                    {b.properties?.photos?.[0] ? <img src={b.properties.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏠</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1209', marginBottom: 2 }}>{b.guests?.full_name}</div>
                    <div style={{ fontSize: 11, color: '#9c8f7e', marginBottom: 2 }}>{b.properties?.title} · {b.checkin_date} → {b.checkout_date}</div>
                    <div style={{ fontSize: 10, color: '#C9A84C', fontWeight: 600 }}>{b.reference}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C', marginBottom: 4 }}>{fmt(b.total)}</div>
                    <StatusBadge status={b.status} />
                  </div>
                  {b.status === 'upcoming' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button onClick={() => updateBookingStatus(b.id, 'active')} style={{ padding: '4px 10px', borderRadius: 6, background: '#e8f5ee', border: '1px solid #c8e8d8', color: '#1D9E75', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Check-in</button>
                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} style={{ padding: '4px 10px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                  )}
                  {b.status === 'active' && (
                    <button onClick={() => updateBookingStatus(b.id, 'completed')} style={{ padding: '6px 12px', borderRadius: 8, background: '#1D9E75', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Complete</button>
                  )}
                </div>
              )) : <div style={{ padding: '40px', textAlign: 'center', color: '#9c8f7e', fontSize: 14 }}>No bookings yet. Bookings will appear once guests reserve your properties.</div>}
            </div>
          )}

          {/* ── EARNINGS ── */}
          {activeTab === 'earnings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                {[
                  { icon: '💰', label: 'Total Earned', value: fmt(myPayouts.reduce((s, p) => s + p.net_amount, 0)), accent: '#1D9E75' },
                  { icon: '⏳', label: 'Pending', value: fmt(pendingPayout), accent: '#C9A84C' },
                  { icon: '🏦', label: 'Account', value: vendorProfile?.bank_name || 'Not set', accent: '#1a1209' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '18px', border: '1px solid #f0ede8' }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.accent, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#9c8f7e', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0ede8', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0ede8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#1a1209', fontSize: 14 }}>Payout History</div>
                  <div style={{ fontSize: 12, color: '#9c8f7e' }}>10% platform fee on each booking</div>
                </div>
                {myPayouts.length ? myPayouts.map(py => (
                  <div key={py.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #f9f6f2' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💳</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1209' }}>{py.bookings?.guests?.full_name || 'Guest'}</div>
                      <div style={{ fontSize: 11, color: '#9c8f7e' }}>{py.bookings?.reference} · {new Date(py.created_at).toLocaleDateString('en-NG')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1D9E75' }}>+{fmt(py.net_amount)}</div>
                      <StatusBadge status={py.status} />
                    </div>
                  </div>
                )) : <div style={{ padding: '32px', textAlign: 'center', color: '#9c8f7e', fontSize: 13 }}>Payouts will appear here once bookings are completed.</div>}
              </div>
            </div>
          )}

          {/* ── MESSAGES ── */}
          {activeTab === 'messages' && <MessagingView vendorId={user.id} toast={toast} />}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <SettingsPanel vendor={vendorProfile} userId={user.id} toast={toast} onUpdate={refreshVendorProfile} />
          )}
        </>}
      </div>

      {showPropModal && <PropertyModal property={editProp} vendorId={user?.id} onClose={() => { setShowPM(false); setEditProp(null) }} onSave={saveProperty} />}
      {showAvail && <AvailabilityModal property={showAvail} onClose={() => setShowAvail(null)} toast={toast} />}
      <Toast {...toastState} />
    </div>
  )
}

// ── SETTINGS PANEL ────────────────────────────────────────────────────────────
function SettingsPanel({ vendor, userId, toast, onUpdate }) {
  const [form, setForm] = useState({
    full_name: vendor?.full_name || '',
    phone: vendor?.phone || '',
    bio: vendor?.bio || '',
    bank_name: vendor?.bank_name || '',
    bank_account: vendor?.bank_account || '',
    account_name: vendor?.account_name || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      await vendors.updateProfile(userId, form)
      await onUpdate()
      toast('Profile updated!', 'success')
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0ede8', padding: '24px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1a1209', marginBottom: 18 }}>Personal Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <LightInput label="Full Name" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
          <LightInput label="Phone Number" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+234 803 000 0000" />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b5c45', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Bio</div>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell guests a bit about yourself as a host…" rows={3} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e8ddd0', background: '#faf8f5', fontSize: 14, outline: 'none', resize: 'vertical', color: '#1a1209', lineHeight: 1.6, fontFamily: 'inherit' }} />
          </div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0ede8', padding: '24px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1a1209', marginBottom: 6 }}>Payout Details</div>
        <div style={{ fontSize: 12, color: '#9c8f7e', marginBottom: 16 }}>Earnings are transferred to this account after completed bookings.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <LightInput label="Bank Name" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="e.g. First Bank" />
          <LightInput label="Account Number" value={form.bank_account} onChange={e => set('bank_account', e.target.value)} placeholder="10-digit account number" />
          <LightInput label="Account Name" value={form.account_name} onChange={e => set('account_name', e.target.value)} placeholder="As it appears on your account" />
        </div>
      </div>
      <GoldBtn onClick={save} loading={saving} style={{ color: '#fff', background: 'linear-gradient(135deg,#C9A84C,#8B6914)', maxWidth: 200 }}>Save Changes</GoldBtn>
    </div>
  )
}
