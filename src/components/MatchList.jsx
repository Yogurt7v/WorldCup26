import { useMemo, useState, useCallback } from "react"
import { useScrollToUpcomingMatch } from "../hooks/useScrollToUpcomingMatch"
import matchesData from "../data/matches.json"
import { STAGE_ORDER, STAGE_LABELS } from "../lib/stages"
import { translateTeamName } from "../lib/teamNames"
import MatchCard from "./MatchCard"

export default function MatchList({
  matches,
  predictions,
  loading,
  error,
}) {
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [expandedStage, setExpandedStage] = useState(null)
  useScrollToUpcomingMatch(matches, loading)

  const teams = useMemo(() => {
    const set = new Set()
    for (const m of matchesData) {
      if (m.home_team) set.add(m.home_team)
      if (m.away_team) set.add(m.away_team)
    }
    return Array.from(set).sort()
  }, [])

  const handleFilterChange = useCallback((value) => {
    setSelectedTeam(value || null)
    setExpandedStage(null)
  }, [])

  const toggleStage = useCallback((stage) => {
    setExpandedStage((prev) => (prev === stage ? null : stage))
  }, [])

  const hasFilter = selectedTeam !== null

  const filteredMatches = useMemo(() => {
    if (!hasFilter) return matches
    return matches.filter(
      (m) => m.home_team === selectedTeam || m.away_team === selectedTeam
    )
  }, [matches, selectedTeam, hasFilter])

  const predictionMap = {}
  if (predictions) {
    for (const p of predictions) {
      predictionMap[p.match_id] = p
    }
  }

  const grouped = {}
  for (const m of filteredMatches) {
    const key = m.stage || 'group'
    ;(grouped[key] ??= []).push(m)
  }

  return (
    <div className="match-list">
      <div className="match-list-header">
        <h2>Матчи</h2>
        <div className="match-filter-wrapper">
          <select
            value={selectedTeam || ''}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="match-filter-select"
          >
            <option value="">Все команды</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {translateTeamName(t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="spinner">Загрузка матчей...</div>
      ) : error ? (
        <div className="card match-list-error">
          <p className="match-list-error-text">
            Ошибка загрузки: {error}
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="card match-list-empty">
          {hasFilter ? `Нет матчей с участием ${translateTeamName(selectedTeam)}` : 'Нет доступных матчей.'}
        </div>
      ) : (
        STAGE_ORDER.map((stage) => {
          const stageMatches = grouped[stage]
          if (!stageMatches) return null
          const isExpanded = hasFilter || expandedStage === stage
          return (
            <div key={stage} className={`match-list-section${isExpanded ? ' expanded' : ''}`}>
              <h3 className="match-list-section-header" onClick={() => toggleStage(stage)}>
                <span className="stage-arrow">{isExpanded ? '▼' : '▶'}</span>
                {STAGE_LABELS[stage]}
                <span className="stage-count">{stageMatches.length}</span>
              </h3>
              <div className="stage-matches">
                {stageMatches.map((match) => (
                  <div key={match.id} id={`match-${match.id}`}>
                    <MatchCard match={match} userPrediction={predictionMap[match.id]} />
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
