// src/lib/api.js
import { supabase } from './supabase.js'

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const auth = {
  signUpVendor: async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({ email, password,
      options: { data: { full_name: fullName, role: 'vendor' } }
    })
    if (error) throw error
    if (data.user) {
      const { error: pe } = await supabase.from('vendors').insert({
        id: data.user.id, full_name: fullName, email, phone,
      })
      if (pe) throw pe
    }
    return data
  },

  signUpGuest: async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({ email, password,
      options: { data: { full_name: fullName, role: 'guest' } }
    })
    if (error) throw error
    if (data.user) {
      const { error: pe } = await supabase.from('guests').insert({
        id: data.user.id, full_name: fullName, email, phone,
      })
      if (pe) throw pe
    }
    return data
  },

  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  getSession: () => supabase.auth.getSession(),
  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb),
}

// ── VENDOR ────────────────────────────────────────────────────────────────────
export const vendors = {
  getProfile: async (id) => {
    const { data, error } = await supabase.from('vendors').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  updateProfile: async (id, updates) => {
    const { data, error } = await supabase.from('vendors').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ── PROPERTIES ────────────────────────────────────────────────────────────────
export const properties = {
  // Guest: get all approved listings
  getApproved: async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*, vendors(full_name, avatar_url, created_at)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  // Vendor: get own listings
  getByVendor: async (vendorId) => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('properties')
      .select('*, vendors(id, full_name, avatar_url, created_at), reviews(rating, comment, created_at, guests(full_name, avatar_url))')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  create: async (property) => {
    const { data, error } = await supabase.from('properties').insert(property).select().single()
    if (error) throw error
    return data
  },

  update: async (id, updates) => {
    const { data, error } = await supabase.from('properties').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (error) throw error
  },
}

// ── AVAILABILITY ──────────────────────────────────────────────────────────────
export const availability = {
  getBlocked: async (propertyId) => {
    const { data, error } = await supabase
      .from('availability')
      .select('blocked_date')
      .eq('property_id', propertyId)
    if (error) throw error
    return data.map(d => d.blocked_date)
  },

  setBlocked: async (propertyId, dates) => {
    // Delete existing, re-insert
    await supabase.from('availability').delete().eq('property_id', propertyId)
    if (dates.length === 0) return
    const { error } = await supabase.from('availability').insert(
      dates.map(d => ({ property_id: propertyId, blocked_date: d }))
    )
    if (error) throw error
  },
}

// ── BOOKINGS ──────────────────────────────────────────────────────────────────
export const bookings = {
  create: async (booking) => {
    const { data, error } = await supabase.from('bookings').insert(booking).select().single()
    if (error) throw error
    return data
  },

  getByGuest: async (guestId) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, properties(title, area, photos, type)')
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getByVendor: async (vendorId) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, properties(title, area, photos), guests(full_name, email, phone, avatar_url)')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  updateStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('bookings').update({ status }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────
export const messages = {
  getConversations: async (userId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(full_name:raw_user_meta_data->full_name), properties(title)')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getThread: async (propertyId, userId, otherUserId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('property_id', propertyId)
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),` +
        `and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
      )
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  send: async (msg) => {
    const { data, error } = await supabase.from('messages').insert(msg).select().single()
    if (error) throw error
    return data
  },

  markRead: async (messageIds) => {
    const { error } = await supabase
      .from('messages').update({ is_read: true }).in('id', messageIds)
    if (error) throw error
  },

  subscribe: (userId, callback) => {
    return supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `recipient_id=eq.${userId}`,
      }, callback)
      .subscribe()
  },
}

// ── PAYOUTS ───────────────────────────────────────────────────────────────────
export const payouts = {
  getByVendor: async (vendorId) => {
    const { data, error } = await supabase
      .from('payouts')
      .select('*, bookings(reference, checkin_date, checkout_date, guests(full_name))')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
}

// ── SAVED LISTINGS ────────────────────────────────────────────────────────────
export const saved = {
  get: async (guestId) => {
    const { data, error } = await supabase
      .from('saved_listings')
      .select('property_id')
      .eq('guest_id', guestId)
    if (error) throw error
    return data.map(d => d.property_id)
  },

  toggle: async (guestId, propertyId) => {
    const { data: existing } = await supabase
      .from('saved_listings')
      .select('id')
      .eq('guest_id', guestId)
      .eq('property_id', propertyId)
      .single()

    if (existing) {
      await supabase.from('saved_listings').delete().eq('id', existing.id)
      return false
    } else {
      await supabase.from('saved_listings').insert({ guest_id: guestId, property_id: propertyId })
      return true
    }
  },
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────
export const reviews = {
  create: async (review) => {
    const { data, error } = await supabase.from('reviews').insert(review).select().single()
    if (error) throw error
    return data
  },

  getByProperty: async (propertyId) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, guests(full_name, avatar_url)')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
export const fmt = (n) => '₦' + Number(n).toLocaleString('en-NG')

export const calcNights = (checkin, checkout) =>
  Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / 86400000))

export const genRef = () =>
  'PH-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)
