import { useMatchesContext } from "../lib/MatchesContext"
import { useScrollToUpcomingMatch } from "../hooks/useScrollToUpcomingMatch"
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
        matches.map((match) => (
          <div key={match.id} id={`match-${match.id}`}>
            <MatchCard match={match} userPrediction={predictionMap[match.id]} />
          </div>
        ))
      )}
    </div>
  )
}
