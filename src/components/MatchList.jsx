import MatchCard from './MatchCard'

export default function MatchList({ matches, predictions, loading, error, syncError, syncing, onRefresh }) {
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
        <div className="sync-info">
          {syncing && <span>Обновление...</span>}
          {!syncing && (
            <button className="btn btn-outline" onClick={onRefresh} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
              Обновить
            </button>
          )}
        </div>
      </div>
      {syncError && (
        <div className="card" style={{ textAlign: 'center', padding: '0.6rem 1rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Не удалось обновить данные: {syncError}
        </div>
      )}
      {loading ? (
        <div className="spinner">Загрузка матчей...</div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
            Ошибка загрузки: {error}
          </p>
          <button className="btn btn-outline" onClick={onRefresh}>
            Повторить
          </button>
        </div>
      ) : matches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
          {syncing ? 'Синхронизация матчей...' : 'Нет доступных матчей. Нажмите "Обновить" для синхронизации.'}
        </div>
      ) : (
        matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            userPrediction={predictionMap[match.id]}
          />
        ))
      )}
    </div>
  )
}
