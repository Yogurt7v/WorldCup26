import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMatches } from '../hooks/useMatches'
import predictionsData from '../data/predictions.json'
import leaderboardData from '../data/leaderboard.json'
import MatchList from '../components/MatchList'

export default function Home() {
  const { user } = useAuth()
  const { matches, loading, error } = useMatches()

  const predictions = useMemo(() => {
    if (!user) return []
    return predictionsData.filter((p) => p.user_id === user.id)
  }, [user])

  const champData = useMemo(() => {
    if (!user) return null
    const rank = leaderboardData.findIndex(u => u.id === user.id) + 1
    return { rank, totalPlayers: leaderboardData.length }
  }, [user])

  return (
    <>
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
      <MatchList
        matches={matches}
        predictions={predictions}
        loading={loading}
        error={error}
      />
    </>
  )
}
