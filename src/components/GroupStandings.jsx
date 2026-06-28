import { getFlagForTeam } from '../lib/flags'

export default function GroupStandings({ groups }) {
  if (!groups || groups.length === 0) return null

  return (
    <div className="group-standings">
      {groups.map(group => (
        <div key={group.name} className="group-card">
          <h3 className="group-card-title">Группа {group.name}</h3>
          <table className="group-table">
            <thead>
              <tr>
                <th className="col-pos">#</th>
                <th className="col-team">Команда</th>
                <th className="col-num">И</th>
                <th className="col-num col-ext">В</th>
                <th className="col-num col-ext">Н</th>
                <th className="col-num col-ext">П</th>
                <th className="col-num">+/-</th>
                <th className="col-pts">О</th>
              </tr>
            </thead>
            <tbody>
              {group.teams.map((t, i) => (
                <tr key={t.team_id} className={i < 2 ? 'top2' : i === 2 ? 'third' : ''}>
                  <td className="col-pos">{i + 1}</td>
                  <td className="col-team">
                    <span className="team-flag">{getFlagForTeam(t.name)}</span>
                    <span className="team-name">{t.name}</span>
                  </td>
                  <td className="col-num">{t.mp}</td>
                  <td className="col-num col-ext">{t.w}</td>
                  <td className="col-num col-ext">{t.d}</td>
                  <td className="col-num col-ext">{t.l}</td>
                  <td className="col-num">{t.gf}-{t.ga}</td>
                  <td className="col-pts">{t.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
