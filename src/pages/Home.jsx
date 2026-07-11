import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  const [predictions, setPredictions] = useState(() => {
    if (!user) return []
    return loadCached(user.id) || []
  })
  const [champData, setChampData] = useState(null)

  useEffect(() => {
    if (!user) return

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

  useEffect(() => {
    if (!matches.length || !user) {
      setChampData(null)
      return
    }

    const allFinished = matches.every(m => m.status === 'FINISHED')
    if (!allFinished) {
      setChampData(null)
      return
    }

    supabase
      .from('leaderboard')
      .select('*')
      .order('total_points', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const rank = data.findIndex(u => u.id === user.id) + 1
          setChampData({ rank, totalPlayers: data.length })
        }
      })
  }, [matches, user])

  return (
    <>
      {champData && (
        <div className="champ-banner">
          <div className="champ-banner-icon">🏆</div>
          <div className="champ-banner-body">
            <div className="champ-banner-title">Чемпионат завершён!</div>
            <div className="champ-banner-subtitle">
              Вы заняли {champData.rank}-е место из {champData.totalPlayers}
            </div>
          </div>
          <Link to="/results" className="btn btn-primary">
            Итоги
          </Link>
        </div>
      )}
      <MatchList
        matches={matches}
        predictions={predictions}
        loading={loading}
        error={error}
        syncError={syncError}
      />
    </>
  )
}
