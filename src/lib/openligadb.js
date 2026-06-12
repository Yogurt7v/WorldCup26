import { translateTeamName } from './teamNames'

const API_BASE = 'https://worldcup26.ir'

function parseMatchDate(dateStr) {
  const [date, time] = dateStr.split(' ')
  const [month, day, year] = date.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00`
}

function mapStatus(match) {
  if (match.finished === 'TRUE' || match.time_elapsed === 'finished') return 'FINISHED'
  if (match.time_elapsed === 'live' || match.time_elapsed === 'started') return 'LIVE'
  if (match.time_elapsed === 'halftime') return 'HALFTIME'
  return 'SCHEDULED'
}

function transformMatch(apiMatch) {
  return {
    id: parseInt(apiMatch.id, 10),
    league_id: 4897,
    home_team: translateTeamName(apiMatch.home_team_name_en) || 'Unknown',
    away_team: translateTeamName(apiMatch.away_team_name_en) || 'Unknown',
    match_date: parseMatchDate(apiMatch.local_date),
    status: mapStatus(apiMatch),
    home_score: parseInt(apiMatch.home_score, 10) || 0,
    away_score: parseInt(apiMatch.away_score, 10) || 0,
    half_time_home_score: null,
    half_time_away_score: null,
    last_update: new Date().toISOString(),
  }
}

export async function syncMatchesFromOpenLigaDB() {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(new DOMException('Таймаут запроса к worldcup26.ir', 'TimeoutError')), 15000)
  const res = await fetch(`${API_BASE}/get/games`, { signal: controller.signal })
  clearTimeout(timeoutId)
  if (!res.ok) throw new Error(`Failed to fetch matches: ${res.status}`)
  const data = await res.json()
  const matches = data.games || data
  return matches.map(transformMatch)
}
