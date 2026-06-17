import { Fragment, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useLeaderboard } from '../hooks/useMatches'
import { getPredictionSummary, getPredictionTypeIcon } from '../lib/scoring'

function rankClass(index) {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return ''
}

export default function Leaderboard() {
  const { leaderboard, loading, error } = useLeaderboard()
  const [expandedUserId, setExpandedUserId] = useState(null)
  const [userPredictions, setUserPredictions] = useState([])
  const [predictionsLoading, setPredictionsLoading] = useState(false)

  useEffect(() => {
    if (!expandedUserId) {
      setUserPredictions([])
      return
    }

    setPredictionsLoading(true)
    supabase
      .from('predictions')
      .select('*, matches!inner(home_team, away_team, home_score, away_score, match_date)')
      .eq('user_id', expandedUserId)
      .gt('points_earned', 0)
      .then(({ data }) => {
        if (data) {
          data.sort(
            (a, b) => new Date(a.matches.match_date) - new Date(b.matches.match_date)
          )
          setUserPredictions(data)
        }
        setPredictionsLoading(false)
      })
  }, [expandedUserId])

  const handleToggle = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId)
  }

  if (loading) {
    return <div className="spinner">Загрузка таблицы...</div>
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--danger)', padding: '2rem' }}>
        Ошибка загрузки: {error}
      </div>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
        Пока нет участников. Сделайте первый прогноз!
      </div>
    )
  }

  return (
    <table className="leaderboard-table card">
      <thead>
        <tr>
          <th className="rank">#</th>
          <th>Игрок</th>
          <th className="points">Очки</th>
        </tr>
      </thead>
      <tbody>
        {leaderboard.map((row, i) => (
          <Fragment key={row.id}>
            <tr>
              <td className={`rank ${rankClass(i)}`}>{i + 1}</td>
              <td className="name" onClick={() => handleToggle(row.id)}>
                {row.username}
              </td>
              <td className="points">{row.total_points}</td>
            </tr>
            {expandedUserId === row.id && (
              <tr className="expanded-row">
                <td colSpan={3}>
                  {predictionsLoading ? (
                    <div className="spinner">Загрузка прогнозов...</div>
                  ) : userPredictions.length === 0 ? (
                    <div className="empty">Нет прогнозов с очками</div>
                  ) : (
                    <div className="user-scored-predictions">
                      {userPredictions.map((p) => (
                        <div key={p.id} className="scored-prediction-item">
                          <span className="sp-match">
                            {p.matches.home_team} {p.matches.home_score}:{p.matches.away_score} {p.matches.away_team}
                          </span>
                          <span className="sp-prediction">
                            {getPredictionTypeIcon(p)} {getPredictionSummary(p)}
                          </span>
                          <span className="sp-points">+{p.points_earned}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}
