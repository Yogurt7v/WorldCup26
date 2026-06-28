import { useMatchesContext } from "../lib/MatchesContext"
import { useScrollToUpcomingMatch } from "../hooks/useScrollToUpcomingMatch"
import { STAGE_ORDER, STAGE_LABELS } from "../lib/stages"
import MatchCard from "./MatchCard"

export default function MatchList({
  matches,
  predictions,
  loading,
  error,
  syncError,
}) {
  const { syncing, refresh } = useMatchesContext()

  useScrollToUpcomingMatch(matches, loading)

  const predictionMap = {}
  if (predictions) {
    for (const p of predictions) {
      predictionMap[p.match_id] = p
    }
  }

  const grouped = {}
  for (const m of matches) {
    const key = m.stage || 'group'
    ;(grouped[key] ??= []).push(m)
  }

  return (
    <div className="match-list">
      <div className="match-list-header">
        <h2>Расписание матчей</h2>
      </div>

      {syncError && (
        <div className="card match-list-sync-error">
          Не удалось обновить данные: {syncError}
        </div>
      )}

      {loading ? (
        <div className="spinner">Загрузка матчей...</div>
      ) : error ? (
        <div className="card match-list-error">
          <p className="match-list-error-text">
            Ошибка загрузки: {error}
          </p>
          <button className="btn btn-outline" onClick={refresh}>
            Повторить
          </button>
        </div>
      ) : matches.length === 0 ? (
        <div className="card match-list-empty">
          {syncing
            ? "Синхронизация матчей..."
            : 'Нет доступных матчей. Нажмите "Обновить" для синхронизации.'}
        </div>
      ) : (
        STAGE_ORDER.map((stage) => {
          const stageMatches = grouped[stage]
          if (!stageMatches) return null
          return (
            <div key={stage} className="match-list-section">
              <h3 className="match-list-section-header">{STAGE_LABELS[stage]}</h3>
              {stageMatches.map((match) => (
                <div key={match.id} id={`match-${match.id}`}>
                  <MatchCard match={match} userPrediction={predictionMap[match.id]} />
                </div>
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}
