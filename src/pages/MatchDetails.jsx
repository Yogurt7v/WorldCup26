import { useState, useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useMatch } from '../hooks/useMatches'
import { useAuth } from '../hooks/useAuth'
import { translateTeamName } from '../lib/teamNames'
import { getFlagForTeam } from '../lib/flags'
import { formatDateLong, formatTime, formatLocalTime } from '../lib/formatters'
import PredictionForm from '../components/PredictionForm'
import PredictionsList from '../components/PredictionsList'

export default function MatchDetails() {
  const { id } = useParams()
  const matchId = parseInt(id, 10)

  if (isNaN(matchId)) return <Navigate to="/" replace />
  const { match, loading: matchLoading } = useMatch(matchId)
  const { user } = useAuth()
  const [myPrediction, setMyPrediction] = useState(null)

  useEffect(() => {
    if (!user || !matchId) return
    supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('match_id', matchId)
      .maybeSingle()
      .then(({ data }) => setMyPrediction(data))
  }, [user, matchId])

  const handleSaved = () => {
    supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('match_id', matchId)
      .maybeSingle()
      .then(({ data }) => setMyPrediction(data))
  }

  if (matchLoading) {
    return <div className="spinner">Загрузка матча...</div>
  }

  if (!match) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
        Матч не найден
      </div>
    )
  }

  return (
    <div className="match-details">
      <Link to="/" className="back-link">← Назад к матчам</Link>

      <div className="match-hero card">
        <div className="match-header" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>
          <span>{formatDateLong(match.match_date)}, {formatTime(match.match_date)}</span>
          {match.city && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
              · {match.city}, {formatLocalTime(match.match_date, match.timezone)}
              {match.stadium_name && ` · ${match.stadium_name}`}
            </span>
          )}
        </div>
        <div className="teams">
          <div className="team-name home">{getFlagForTeam(match.home_team)} {translateTeamName(match.home_team)}</div>
          <div className="score-display">
            {match.status === 'SCHEDULED' ? (
              <span style={{ color: 'var(--text-secondary)', fontSize: '1.5rem' }}>- : -</span>
            ) : (
              <>
                <span>{match.home_score}</span>
                <span className="score-dash">:</span>
                <span>{match.away_score}</span>
              </>
            )}
          </div>
          <div className="team-name away">{getFlagForTeam(match.away_team)} {translateTeamName(match.away_team)}</div>
        </div>
      </div>

      <PredictionForm
        match={match}
        existingPrediction={myPrediction}
        onSaved={handleSaved}
        key={`${match.id}-${myPrediction?.id || 'new'}`}
      />

      <PredictionsList matchId={match.id} matchStatus={match.status} />
    </div>
  )
}
