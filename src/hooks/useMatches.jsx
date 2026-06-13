import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { syncMatchesFromOpenLigaDB } from '../lib/openligadb'

let isSyncing = false

function getNextInterval(matches) {
  const now = Date.now()

  if (matches.some((m) => m.status === 'LIVE')) return 30000

  const scheduled = matches
    .filter((m) => m.status === 'SCHEDULED')
    .map((m) => new Date(m.match_date).getTime())
    .filter((t) => t > now)

  if (scheduled.length === 0) return 1800000

  const next = Math.min(...scheduled)
  const diff = next - now

  if (diff < 7200000) return 60000
  return 1800000
}

export function useMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncError, setSyncError] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const subRef = useRef(null)
  const matchesRef = useRef([])

  const doSync = useCallback(async () => {
    if (isSyncing) return
    isSyncing = true
    setSyncing(true)
    try {
      const transformed = await syncMatchesFromOpenLigaDB()

      for (const match of transformed) {
        await supabase.from('matches').upsert(match, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
      }

      setSyncError(null)
    } catch (err) {
      const msg = err.name === 'TimeoutError' || err.name === 'AbortError' ? 'Таймаут соединения с сервером' : err.message
      setSyncError(msg)
      console.error('Sync error:', msg)
    } finally {
      isSyncing = false
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let syncTimeoutId

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: true })

        if (fetchError) throw fetchError

        if (!cancelled) {
          if (!data || data.length === 0) {
            await doSync()
            const { data: refetched } = await supabase
              .from('matches')
              .select('*')
              .order('match_date', { ascending: true })
            if (!cancelled) {
              setMatches(refetched || [])
              setLoading(false)
            }
          } else {
            setMatches(data)
            setLoading(false)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.name === 'TimeoutError' || err.name === 'AbortError' ? 'Таймаут соединения с сервером. Проверьте подключение к Supabase.' : err.message)
          setLoading(false)
        }
      }
    }

    load()

    function scheduleSync() {
      const interval = getNextInterval(matchesRef.current)
      syncTimeoutId = setTimeout(async () => {
        await doSync()
        if (!cancelled) scheduleSync()
      }, interval)
    }

    // Wait for initial load to finish before first scheduled sync
    const initialDelay = setTimeout(() => {
      if (!cancelled) scheduleSync()
    }, 1000)

    const sub = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          setMatches((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((m) => m.id !== payload.old.id)
            }
            if (payload.eventType === 'INSERT') {
              return [...prev, payload.new].sort(
                (a, b) => new Date(a.match_date) - new Date(b.match_date)
              )
            }
            if (payload.eventType === 'UPDATE') {
              return prev
                .map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
                .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
            }
            return prev
          })
        }
      )
      .subscribe()

    subRef.current = sub

    return () => {
      cancelled = true
      clearTimeout(initialDelay)
      clearTimeout(syncTimeoutId)
      if (subRef.current) {
        supabase.removeChannel(subRef.current)
      }
    }
  }, [doSync])

  // Keep matchesRef in sync with latest matches
  useEffect(() => {
    matchesRef.current = matches
  }, [matches])

  const refresh = useCallback(async () => {
    setError(null)
    setSyncError(null)
    await doSync()
    const { data } = await supabase.from('matches').select('*').order('match_date', { ascending: true })
    if (data) setMatches(data)
  }, [doSync])

  return { matches, loading, error, syncError, syncing, refresh }
}

export function useMatch(matchId) {
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchId) return

    setLoading(true)

    supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load match:', error)
        }
        setMatch(data)
        setLoading(false)
      })

    const sub = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          setMatch(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [matchId])

  return { match, loading }
}

export function usePredictions(matchId) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!matchId) return

    setLoading(true)
    setError(null)

    supabase
      .from('predictions')
      .select('id, user_id, match_id, predicted_home_score, predicted_away_score, outcome, goals_team, goals_threshold, points_earned, created_at, users (username)')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setPredictions(data)
        }
        setLoading(false)
      })

    const sub = supabase
      .channel(`predictions-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'predictions',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          supabase
            .from('predictions')
            .select('id, user_id, match_id, predicted_home_score, predicted_away_score, outcome, goals_team, goals_threshold, points_earned, created_at, users (username)')
            .eq('match_id', matchId)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) setPredictions(data)
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [matchId])

  return { predictions, loading, error }
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    supabase
      .from('leaderboard')
      .select('*')
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message)
        } else if (data) {
          setLeaderboard(data)
        }
        setLoading(false)
      })

    const sub = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'predictions' },
        () => {
          supabase
            .from('leaderboard')
            .select('*')
            .then(({ data }) => {
              if (data) setLeaderboard(data)
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [])

  return { leaderboard, loading, error }
}
