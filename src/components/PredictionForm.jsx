import { getPredictionTypeIcon, getPredictionSummary } from '../lib/scoring'

export default function PredictionForm({ match, existingPrediction }) {
  return (
    <div className="prediction-form">
      <div className="finished-message">
        <p>Чемпионат завершён. Приём прогнозов закрыт.</p>
        {existingPrediction && (
          <div className="existing-prediction-summary">
            <p className="existing-prediction-label">Ваш прогноз:</p>
            <p className="existing-prediction-value">
              {getPredictionTypeIcon(existingPrediction)} {getPredictionSummary(existingPrediction)}
            </p>
            {existingPrediction.points_earned > 0 && (
              <p className="existing-prediction-points">
                +{existingPrediction.points_earned} очков
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
