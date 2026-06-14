import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useMatchesContext } from '../lib/MatchesContext'
import { supabase } from '../lib/supabase'
import MatchList from '../components/MatchList'

const PRED_CACHE_KEY = 'prediction-cache'

function loadCached(userId) {
  try {
    const raw = localStorage.getItem(`${PRED_CACHE_KEY}-${userId}`)
    return raw ? JSON.parse(raw) : null
  } catch (e) { return null }
}

function saveCache(userId, data) {
  try { localStorage.setItem(`${PRED_CACHE_KEY}-${userId}`, JSON.stringify(data)) } catch (e) { /* ignore */ }
}

export default function Home() {
  const { user } = useAuth()
  const { matches, loading, error, syncError } = useMatchesContext()
  const [predictions, setPredictions] = useState([])

  useEffect(() => {
    if (!user) return

    const cached = loadCached(user.id)
    if (cached) setPredictions(cached)

    supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setPredictions(data)
          saveCache(user.id, data)
        }
      }).catch(console.error)

    const sub = supabase
      .channel('my-predictions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'predictions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setPredictions((prev) => {
            let next
            if (payload.eventType === 'DELETE') {
              next = prev.filter((p) => p.id !== payload.old.id)
            } else if (payload.eventType === 'INSERT') {
              next = [...prev, payload.new]
            } else if (payload.eventType === 'UPDATE') {
              next = prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
            } else {
              return prev
            }
            if (user) saveCache(user.id, next)
            return next
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [user])

  return (
    <MatchList
      matches={matches}
      predictions={predictions}
      loading={loading}
      error={error}
      syncError={syncError}
    />
  )
}
