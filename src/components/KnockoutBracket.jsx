import { useState } from 'react'
import { getFlagForTeam } from '../lib/flags'

const STAGE_ORDER = ['r32', 'r16', 'qf', 'sf', 'final', 'third']
const STAGE_LABELS = {
  r32: '1/32 финала',
  r16: '1/8 финала',
  qf: '1/4 финала',
  sf: '1/2 финала',
  final: 'Финал',
  third: '3-е место',
}

function TeamBlock({ name, label, isTbd }) {
  if (isTbd || !name) {
    return (
      <div className="b-match-team tbd">
        <span className="b-match-label">{label}</span>
      </div>
    )
  }
  return (
    <div className="b-match-team">
      <span className="b-match-flag">{getFlagForTeam(name)}</span>
      <span className="b-match-name">{name}</span>
    </div>
  )
}

function MatchCard({ match }) {
  const homeTbd = !match.home_team
  const awayTbd = !match.away_team
  const hasScore = match.home_score !== null && match.away_score !== null

  return (
    <div className={`b-match${homeTbd && awayTbd ? ' tbd' : ''}`}>
      <TeamBlock name={match.home_team} label={match.label} isTbd={homeTbd} />
      <div className="b-match-score">{hasScore ? `${match.home_score}:${match.away_score}` : '–'}</div>
      <TeamBlock name={match.away_team} label={match.label} isTbd={awayTbd} />
    </div>
  )
}

export default function KnockoutBracket({ columns }) {
  const [collapsed, setCollapsed] = useState({})

  if (!columns || columns.length === 0) return null

  const colMap = {}
  columns.forEach(col => { colMap[col.stage] = col })

  function toggle(stage) {
    setCollapsed(prev => ({ ...prev, [stage]: !prev[stage] }))
  }

  return (
    <div className="bracket-scroll">
      <div className="bracket-grid">
        {STAGE_ORDER.map(stage => {
          const col = colMap[stage]
          if (!col) return null
          const isCol = !!collapsed[stage]

          return (
            <div key={stage} className={`b-col${isCol ? ' collapsed' : ''}`}>
              <div className="b-col-header" onClick={() => toggle(stage)}>
                <span className="b-col-toggle">{isCol ? '▶' : '▼'}</span>
                <span className="b-col-label">{STAGE_LABELS[stage]}</span>
              </div>
              <div className="b-col-body">
                {col.matches.map((m, i) => (
                  <MatchCard key={m.id || `${stage}-${i}`} match={m} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
