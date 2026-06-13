import { translateTeamName } from './teamNames'

const API_BASE = 'https://worldcup26.ir'

const COUNTRY_REGION_OFFSET = {
  Mexico: { Central: -6 },
  Canada: { Eastern: -4, Central: -5, Western: -7 },
  'United States': { Eastern: -4, Central: -5, Western: -7 },
}

async function fetchStadiumOffsets() {
  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(new DOMException('Таймаут запроса к worldcup26.ir', 'TimeoutError')),
    15000
  )
  try {
    const res = await fetch(`${API_BASE}/get/stadiums`, { signal: controller.signal })
    const data = await res.json()
    const stadiums = data.stadiums || data
    const offsets = {}
    for (const s of stadiums) {
      const countryOffsets = COUNTRY_REGION_OFFSET[s.country_en]
      if (countryOffsets) {
        const offset = countryOffsets[s.region]
        if (offset !== undefined) {
          offsets[s.id] = offset
        }
      }
    }
    return offsets
  } finally {
    clearTimeout(timeoutId)
  }
}

function parseMatchDate(dateStr, utcOffsetHours) {
  const [date, time] = dateStr.split(' ')
  const [month, day, year] = date.split('/')
  const [hh, mm] = time.split(':').map(Number)
  const utc = Date.UTC(+year, +month - 1, +day, hh, mm) - utcOffsetHours * 3600000
  return new Date(utc).toISOString()
}

function mapStatus(match) {
  if (match.finished === 'TRUE' || match.time_elapsed === 'finished') return 'FINISHED'
  if (match.time_elapsed === 'live' || match.time_elapsed === 'started') return 'LIVE'
  if (match.time_elapsed === 'halftime') return 'HALFTIME'
  return 'SCHEDULED'
}

function transformMatch(apiMatch, stadiumOffsets) {
  const offset = stadiumOffsets[apiMatch.stadium_id]
  return {
    id: parseInt(apiMatch.id, 10),
    league_id: 4897,
    home_team: translateTeamName(apiMatch.home_team_name_en) || 'Unknown',
    away_team: translateTeamName(apiMatch.away_team_name_en) || 'Unknown',
    match_date: parseMatchDate(apiMatch.local_date, offset != null ? offset : 0),
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
  const timeoutId = setTimeout(
    () => controller.abort(new DOMException('Таймаут запроса к worldcup26.ir', 'TimeoutError')),
    15000
  )

  try {
    const [gamesRes, offsets] = await Promise.all([
      fetch(`${API_BASE}/get/games`, { signal: controller.signal }),
      fetchStadiumOffsets(),
    ])

    if (!gamesRes.ok) throw new Error(`Failed to fetch matches: ${gamesRes.status}`)
    const data = await gamesRes.json()
    const matches = data.games || data
    return matches.map((m) => transformMatch(m, offsets))
  } catch (err) {
    const msg = err.name === 'TimeoutError' || err.name === 'AbortError'
      ? 'Таймаут соединения с сервером'
      : err.message
    console.error('Sync error:', msg)
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}
