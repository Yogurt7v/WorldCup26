import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { translateTeamName } from '../lib/teamNames'
import { getFlagForTeam } from '../lib/flags'
import { POINTS_EXACT_SCORE, POINTS_OUTCOME, POINTS_GOALS_THRESHOLD, getPredictionTypeIcon, getPredictionSummary } from '../lib/scoring'

export default function PredictionForm({ match, existingPrediction, onSaved }) {
  const { user } = useAuth()
  const [selectedOutcome, setSelectedOutcome] = useState(null)
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [goalsTeam, setGoalsTeam] = useState('')
  const [goalsThreshold, setGoalsThreshold] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const homeName = translateTeamName(match.home_team)
  const awayName = translateTeamName(match.away_team)
  const homeFlag = getFlagForTeam(match.home_team)
  const awayFlag = getFlagForTeam(match.away_team)

  useEffect(() => {
    if (existingPrediction) {
      setHomeScore(existingPrediction.predicted_home_score != null ? String(existingPrediction.predicted_home_score) : '')
      setAwayScore(existingPrediction.predicted_away_score != null ? String(existingPrediction.predicted_away_score) : '')
      setSelectedOutcome(existingPrediction.outcome)
      setGoalsTeam(existingPrediction.goals_team || '')
      setGoalsThreshold(existingPrediction.goals_threshold != null ? String(existingPrediction.goals_threshold) : '')
    }
  }, [existingPrediction])

  const isFinished = match.status === 'FINISHED'

  const matchDate = new Date(match.match_date)
  const now = new Date()
  const diffMin = (now - matchDate) / 60000
  const isLocked = match.status === 'HALFTIME' || match.status === 'FINISHED' || (match.status === 'LIVE' && diffMin >= 45)

  function deriveOutcome(home, away) {
    if (home > away) return '1'
    if (home < away) return '2'
    return 'X'
  }

  function handleHomeScoreChange(val) {
    setHomeScore(val)
    const h = parseInt(val, 10)
    const a = parseInt(awayScore, 10)
    if (!isNaN(h) && !isNaN(a)) {
      setSelectedOutcome(deriveOutcome(h, a))
    }
  }

  function handleAwayScoreChange(val) {
    setAwayScore(val)
    const h = parseInt(homeScore, 10)
    const a = parseInt(val, 10)
    if (!isNaN(h) && !isNaN(a)) {
      setSelectedOutcome(deriveOutcome(h, a))
    }
  }

  function handleOutcomeClick(outcome) {
    setSelectedOutcome(selectedOutcome === outcome ? null : outcome)
  }

  const handleDelete = async () => {
    if (!existingPrediction) return
    setDeleting(true)
    setError('')
    try {
      const { error: delError } = await supabase
        .from('predictions')
        .delete()
        .eq('user_id', user.id)
        .eq('match_id', match.id)

      if (delError) {
        setError(delError.message || 'Ошибка при удалении прогноза')
        return
      }

      setHomeScore('')
      setAwayScore('')
      setSelectedOutcome(null)
      setGoalsTeam('')
      setGoalsThreshold('')

      if (onSaved) onSaved()
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaved(false)

    const hasScore = homeScore !== '' && awayScore !== ''
    const hasOutcome = selectedOutcome !== null
    const hasGoals = goalsTeam !== '' && goalsThreshold !== ''

    if (!hasScore && !hasOutcome && !hasGoals) {
      setError('Заполните хотя бы один тип прогноза')
      return
    }

    if (hasScore) {
      const h = parseInt(homeScore, 10)
      const a = parseInt(awayScore, 10)
      if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
        setError('Введите корректные целые числа (0 и больше)')
        return
      }
    }

    if (hasGoals) {
      const t = parseInt(goalsThreshold, 10)
      if (isNaN(t) || t < 2) {
        setError('Введите корректное число голов (минимум 2)')
        return
      }
    }

    setSaving(true)

    try {
      const finalOutcome = hasScore
        ? deriveOutcome(parseInt(homeScore, 10), parseInt(awayScore, 10))
        : hasOutcome ? selectedOutcome : null

      const { error: upsertError } = await supabase.from('predictions').upsert(
        {
          user_id: user.id,
          match_id: match.id,
          predicted_home_score: hasScore ? parseInt(homeScore, 10) : null,
          predicted_away_score: hasScore ? parseInt(awayScore, 10) : null,
          outcome: finalOutcome,
          goals_team: hasGoals ? goalsTeam : null,
          goals_threshold: hasGoals ? parseInt(goalsThreshold, 10) : null,
        },
        {
          onConflict: 'user_id, match_id',
        }
      )

      if (upsertError) {
        setError(upsertError.message || 'Ошибка при сохранении прогноза')
        return
      }

      setSaved(true)
      if (onSaved) onSaved()
    } finally {
      setSaving(false)
    }
  }

  if (isFinished) {
    return (
      <div className="prediction-form">
        <div className="finished-message">
          <p>Матч завершён. Прогнозы не принимаются.</p>
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

  return (
    <form className="prediction-form" onSubmit={handleSubmit}>
      <div className="prediction-form-title">
        {existingPrediction ? 'Изменить прогноз' : 'Сделать прогноз'}
      </div>

      {/* ИСХОД МАТЧА */}
      <div className="prediction-section">
        <div className="prediction-section-label">Исход матча <span className="points-hint">+{POINTS_OUTCOME}</span></div>
        <div className="outcome-buttons">
          <button
            type="button"
            className={`btn-outcome ${selectedOutcome === '1' ? 'active' : ''}`}
            onClick={() => handleOutcomeClick('1')}
            disabled={isLocked}
          >
            {homeFlag} Победит {homeName}
          </button>
          <button
            type="button"
            className={`btn-outcome ${selectedOutcome === 'X' ? 'active' : ''}`}
            onClick={() => handleOutcomeClick('X')}
            disabled={isLocked}
          >
            Ничья
          </button>
          <button
            type="button"
            className={`btn-outcome ${selectedOutcome === '2' ? 'active' : ''}`}
            onClick={() => handleOutcomeClick('2')}
            disabled={isLocked}
          >
            {awayFlag} Победит {awayName}
          </button>
        </div>
      </div>

      {/* ТОЧНЫЙ СЧЁТ */}
      <div className="prediction-section">
        <div className="prediction-section-label">Точный счёт <span className="points-hint">+{POINTS_EXACT_SCORE}</span></div>
        <div className="score-inputs">
          <div className="team-label">{homeFlag} {homeName}</div>
          <input
            type="number"
            min="0"
            max="99"
            value={homeScore}
            onChange={(e) => handleHomeScoreChange(e.target.value)}
            disabled={isLocked}
            placeholder="0"
          />
          <span className="vs">:</span>
          <input
            type="number"
            min="0"
            max="99"
            value={awayScore}
            onChange={(e) => handleAwayScoreChange(e.target.value)}
            disabled={isLocked}
            placeholder="0"
          />
          <div className="team-label">{awayFlag} {awayName}</div>
        </div>
      </div>

      {/* ГОЛЫ */}
      <div className="prediction-section">
        <div className="prediction-section-label">Голы <span className="points-hint">+{POINTS_GOALS_THRESHOLD}</span></div>
        <div className="goals-inputs">
          <select
            value={goalsTeam}
            onChange={(e) => setGoalsTeam(e.target.value)}
            disabled={isLocked}
            className="goals-select"
          >
            <option value="">Выберите команду</option>
            <option value="home">{homeFlag} {homeName}</option>
            <option value="away">{awayFlag} {awayName}</option>
          </select>
          <span className="goals-label">забьёт не менее</span>
          <input
            type="number"
            min="2"
            max="99"
            value={goalsThreshold}
            onChange={(e) => setGoalsThreshold(e.target.value)}
            disabled={isLocked}
            placeholder="2"
            className="goals-input"
          />
          <span className="goals-label">гол(ов)</span>
        </div>
      </div>

      {isLocked && (
        <div className="locked-message">
          Матч уже начался (перерыв). Изменение прогноза заблокировано.
        </div>
      )}

      {error && <div className="form-error">{error}</div>}
      {saved && <div className="form-success">Прогноз сохранён!</div>}

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLocked || saving}
        >
          {saving ? 'Сохранение...' : existingPrediction ? 'Обновить прогноз' : 'Сохранить прогноз'}
        </button>

        {existingPrediction && !isLocked && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Удаление...' : 'Удалить прогноз'}
          </button>
        )}
      </div>
    </form>
  )
}
