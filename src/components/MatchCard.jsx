import { useNavigate } from 'react-router-dom'
import { translateTeamName } from '../lib/teamNames'
import { getFlagForTeam } from '../lib/flags'
import { getPredictionTypeIcon, getPredictionSummary } from '../lib/scoring'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function statusLabel(status) {
  switch (status) {
    case 'SCHEDULED': return 'Не начался'
    case 'LIVE': return 'В эфире'
    case 'HALFTIME': return 'Перерыв'
    case 'FINISHED': return 'Завершён'
    default: return status
  }
}

function statusClass(status) {
  return status ? status.toLowerCase() : ''
}

export default function MatchCard({ match, userPrediction }) {
  const navigate = useNavigate()

  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE' || match.status === 'HALFTIME'
  const canPredict = !isFinished && !isLive

  const scoreDisplay = isFinished || isLive
    ? `${match.home_score} : ${match.away_score}`
    : '- : -'

  return (
    <div className="match-card card" onClick={() => navigate(`/match/${match.id}`)}>
      <div className="match-header">
        <div className="match-header-left">
          <span className="match-date">{formatDate(match.match_date)} {formatTime(match.match_date)}</span>
          {userPrediction ? (
            <>
              <span className="prediction-indicator">
                {getPredictionTypeIcon(userPrediction)} {getPredictionSummary(userPrediction)}
              </span>
              {isFinished && (
                <span className={`points-earned points-${userPrediction.points_earned === 5 ? '5' : userPrediction.points_earned >= 3 ? '3-4' : '0'}`}>
                  {userPrediction.points_earned > 0 ? `+${userPrediction.points_earned}` : '0'}
                </span>
              )}
            </>
          ) : (
            canPredict && <span className="prediction-indicator">Сделать прогноз</span>
          )}
          {!canPredict && !userPrediction && isLive && (
            <span className="prediction-indicator" style={{ background: '#fefce8', color: '#a16207' }}>
              Идёт матч
            </span>
          )}
        </div>
        <div className="match-header-right">
          <span className={`status ${statusClass(match.status)}`}>
            {statusLabel(match.status)}
          </span>
        </div>
      </div>
      <div className="match-body">
        <div className="team home">{getFlagForTeam(match.home_team)} {translateTeamName(match.home_team)}</div>
        <div className="score">
          {scoreDisplay === '- : -' ? (
            <span className="score-none">- : -</span>
          ) : (
            <>
              <span>{match.home_score}</span>
              <span className="score-dash">:</span>
              <span>{match.away_score}</span>
            </>
          )}
        </div>
        <div className="team away">{getFlagForTeam(match.away_team)} {translateTeamName(match.away_team)}</div>
      </div>
    </div>
  )
}
