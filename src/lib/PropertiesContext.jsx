// src/lib/PropertiesContext.jsx
// Single source of truth for all approved properties in the guest app.
// Fetches once on mount, exposes a refresh() function, and subscribes to
// real-time Supabase changes so new vendor listings appear automatically.

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase.js'

const PropertiesContext = createContext(null)

export function PropertiesProvider({ children }) {
  const [listings,  setListings]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [lastFetch, setLastFetch] = useState(null)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          vendor_id,
          title,
          description,
          area,
          address,
          type,
          beds,
          baths,
          max_guests,
          price_per_night,
          photos,
          amenities,
          status,
          rating,
          total_reviews,
          created_at,
          vendors (
            id,
            full_name,
            avatar_url,
            created_at
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error
      setListings(data || [])
      setLastFetch(new Date())
    } catch (e) {
      console.error('Failed to fetch properties:', e.message)
      setError(e.message)
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  // Real-time subscription — when a vendor's listing is approved/updated,
  // the guest app reflects it immediately without a manual refresh.
  useEffect(() => {
    const channel = supabase
      .channel('approved-properties')
      .on(
        'postgres_changes',
        {
          event: '*',           // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'properties',
        },
        (payload) => {
          const updated = payload.new
          const old     = payload.old

          if (payload.eventType === 'INSERT' && updated?.status === 'approved') {
            // New approved listing — add to top of list
            fetchListings()   // refetch to get vendor join
          } else if (payload.eventType === 'UPDATE') {
            if (updated?.status === 'approved') {
              // Status changed to approved, or approved listing was edited
              fetchListings()
            } else if (old?.status === 'approved' && updated?.status !== 'approved') {
              // Listing was suspended/rejected — remove from guest view
              setListings(prev => prev.filter(p => p.id !== old.id))
            }
          } else if (payload.eventType === 'DELETE') {
            setListings(prev => prev.filter(p => p.id !== old.id))
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchListings])

  // ── Derived helpers ───────────────────────────────────────────────────────
  const getById = useCallback(
    (id) => listings.find(p => p.id === id) || null,
    [listings]
  )

  const getByArea = useCallback(
    (area) => area === 'All Areas'
      ? listings
      : listings.filter(p => p.area === area),
    [listings]
  )

  const search = useCallback(
    (query) => {
      const q = query.toLowerCase().trim()
      if (!q) return listings
      return listings.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q)  ||
        p.type.toLowerCase().includes(q)  ||
        p.description?.toLowerCase().includes(q)
      )
    },
    [listings]
  )

  const areas = [...new Set(listings.map(p => p.area))].sort()

  return (
    <PropertiesContext.Provider value={{
      listings,
      loading,
      error,
      lastFetch,
      refresh: fetchListings,
      getById,
      getByArea,
      search,
      areas,
      total: listings.length,
    }}>
      {children}
    </PropertiesContext.Provider>
  )
}

export const useProperties = () => {
  const ctx = useContext(PropertiesContext)
  if (!ctx) throw new Error('useProperties must be used inside PropertiesProvider')
  return ctx
}
