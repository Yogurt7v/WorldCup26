import { translateTeamName } from './teamNames'

const API_BASE = 'https://worldcup26.ir'

const COUNTRY_REGION_OFFSET = {
  Mexico: { Central: -6 },
  Canada: { Eastern: -4, Central: -5, Western: -7 },
  'United States': { Eastern: -4, Central: -5, Western: -7 },
}

const COUNTRY_REGION_TZ = {
  'United States': { Eastern: 'America/New_York', Central: 'America/Chicago', Western: 'America/Los_Angeles' },
  Canada: { Eastern: 'America/Toronto', Central: 'America/Winnipeg', Western: 'America/Vancouver' },
  Mexico: { Central: 'America/Mexico_City' },
}

async function fetchStadiumData() {
  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(new DOMException('Таймаут запроса к worldcup26.ir', 'TimeoutError')),
    60000
  )
  try {
    const res = await fetch(`${API_BASE}/get/stadiums`, { signal: controller.signal })
    const data = await res.json()
    const stadiums = data.stadiums || data
    const info = {}
    for (const s of stadiums) {
      const offset = COUNTRY_REGION_OFFSET[s.country_en]?.[s.region]
      const timezone = COUNTRY_REGION_TZ[s.country_en]?.[s.region] || 'Europe/Moscow'
      if (offset !== undefined) {
        info[s.id] = { offset, city: s.city_en, name_en: s.name_en, timezone }
      }
    }
    return info
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

function transformMatch(apiMatch, stadiumData) {
  const data = stadiumData[apiMatch.stadium_id] || {}
  const offset = data.offset != null ? data.offset : 0
  return {
    id: parseInt(apiMatch.id, 10),
    league_id: 4897,
    home_team: translateTeamName(apiMatch.home_team_name_en) || 'Unknown',
    away_team: translateTeamName(apiMatch.away_team_name_en) || 'Unknown',
    match_date: parseMatchDate(apiMatch.local_date, offset),
    status: mapStatus(apiMatch),
    home_score: parseInt(apiMatch.home_score, 10) || 0,
    away_score: parseInt(apiMatch.away_score, 10) || 0,
    half_time_home_score: null,
    half_time_away_score: null,
    stadium_name: data.name_en || null,
    city: data.city || null,
    timezone: data.timezone || null,
    last_update: new Date().toISOString(),
  }
}

export async function syncMatchesFromOpenLigaDB() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(new DOMException('Таймаут запроса к worldcup26.ir', 'TimeoutError')),
      60000
    )

    try {
      const [gamesRes, stadiumData] = await Promise.all([
        fetch(`${API_BASE}/get/games`, { signal: controller.signal }),
        fetchStadiumData(),
      ])

      if (!gamesRes.ok) throw new Error(`Failed to fetch matches: ${gamesRes.status}`)
      const data = await gamesRes.json()
      const matches = data.games || data
      return matches.map((m) => transformMatch(m, stadiumData))
    } catch (err) {
      const msg = err.name === 'TimeoutError' || err.name === 'AbortError'
        ? 'Таймаут соединения с сервером'
        : err.message
      console.error(`Sync error (attempt ${attempt}/3):`, msg)

      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 10000))
      } else {
        return []
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
