import { usePredictions } from '../hooks/useMatches'
import { getPredictionTypeIcon, getPredictionSummary } from '../lib/scoring'

export default function PredictionsList({ matchId, matchStatus }) {
  const { predictions, loading, error } = usePredictions(matchId)
  const isFinished = matchStatus === 'FINISHED'

  return (
    <div>
      <div className="section-title">Прогнозы других игроков</div>
      <div className="predictions-list">
        {loading ? (
          <div className="spinner">Загрузка...</div>
        ) : error ? (
          <div className="empty" style={{ color: 'var(--danger)' }}>
            Ошибка: {error}
          </div>
        ) : predictions.length === 0 ? (
          <div className="empty">Пока никто не сделал прогноз</div>
        ) : (
          predictions.map((p) => (
            <div key={p.id} className="prediction-item">
              <span className="prediction-user">
                {p.username || 'Неизвестный'}
              </span>
              <span className="prediction-score">
                {getPredictionTypeIcon(p)} {getPredictionSummary(p)}
              </span>
              {isFinished && (
                <span className="prediction-points">
                  {p.points_earned > 0 ? `+${p.points_earned}` : '0'}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
