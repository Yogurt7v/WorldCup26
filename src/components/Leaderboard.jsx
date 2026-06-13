import { useLeaderboard } from '../hooks/useMatches'

function rankClass(index) {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return ''
}

export default function Leaderboard() {
  const { leaderboard, loading, error } = useLeaderboard()

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
          <th className="stat">Прогнозы</th>
          <th className="stat">Точный счёт</th>
          <th className="stat">Исходы</th>
          <th className="stat">С очками</th>
        </tr>
      </thead>
      <tbody>
        {leaderboard.map((row, i) => (
          <tr key={row.id}>
            <td className={`rank ${rankClass(i)}`}>{i + 1}</td>
            <td className="name">{row.username}</td>
            <td className="points">{row.total_points}</td>
            <td className="stat">{row.total_predictions}</td>
            <td className="stat">{row.exact_scores}</td>
            <td className="stat">{row.correct_outcomes}</td>
            <td className="stat">{row.scored_predictions}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
