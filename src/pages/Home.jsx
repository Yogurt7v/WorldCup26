import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useMatches } from '../hooks/useMatches'
import { supabase } from '../lib/supabase'
import MatchList from '../components/MatchList'

export default function Home() {
  const { user } = useAuth()
  const { matches, loading, error, syncError, syncing, refresh } = useMatches()
  const [predictions, setPredictions] = useState([])

  useEffect(() => {
    if (!user) return

    supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setPredictions(data)
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
            if (payload.eventType === 'DELETE') {
              return prev.filter((p) => p.id !== payload.old.id)
            }
            if (payload.eventType === 'INSERT') {
              return [...prev, payload.new]
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
            }
            return prev
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
      syncing={syncing}
      onRefresh={refresh}
    />
  )
}
