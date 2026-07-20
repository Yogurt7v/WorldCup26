import { useState, useEffect } from 'react'
import matchesData from '../data/matches.json'
import predictionsData from '../data/predictions.json'
import usersData from '../data/users.json'
import leaderboardData from '../data/leaderboard.json'

export function useMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      setMatches(matchesData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { matches, loading, error }
}

export function useMatch(matchId) {
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchId) return
    setMatch(matchesData.find((m) => m.id === Number(matchId)) || null)
    setLoading(false)
  }, [matchId])

  return { match, loading }
}

export function usePredictions(matchId) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!matchId) return

    try {
      const filtered = predictionsData
        .filter((p) => p.match_id === Number(matchId))
        .map((p) => {
          const user = usersData.find((u) => u.id === p.user_id)
          return { ...p, username: user ? user.username : 'Unknown' }
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setPredictions(filtered)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [matchId])

  return { predictions, loading, error }
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      setLeaderboard(leaderboardData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { leaderboard, loading, error }
}
