function fmt(dateStr, opts) {
  return new Date(dateStr).toLocaleString('ru-RU', opts)
}

export function formatTime(dateStr) {
  return fmt(dateStr, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })
}

export function formatDateShort(dateStr) {
  return fmt(dateStr, { day: 'numeric', month: 'short', timeZone: 'Europe/Moscow' })
}

export function formatDateLong(dateStr) {
  return fmt(dateStr, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' })
}

export function formatLocalTime(dateStr, timezone) {
  if (!timezone) return formatTime(dateStr)
  return fmt(dateStr, { hour: '2-digit', minute: '2-digit', timeZone: timezone })
}

export function formatLocalDateShort(dateStr, timezone) {
  if (!timezone) return formatDateShort(dateStr)
  return fmt(dateStr, { day: 'numeric', month: 'short', timeZone: timezone })
}

export function getMatchDisplayDay(dateStr) {
  const MSK = 'Europe/Moscow'
  const date = new Date(dateStr)

  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: MSK,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date)

  let y = parts.find(p => p.type === 'year').value
  let m = parts.find(p => p.type === 'month').value
  let d = parts.find(p => p.type === 'day').value

  if (Number(parts.find(p => p.type === 'hour').value) < 8) {
    const prev = new Date(y, m - 1, d - 1)
    y = String(prev.getFullYear()).padStart(4, '0')
    m = String(prev.getMonth() + 1).padStart(2, '0')
    d = String(prev.getDate()).padStart(2, '0')
  }

  return `${y}-${m}-${d}`
}

export function formatMatchDayHeader(dayStr) {
  const [y, m, d] = dayStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12).toLocaleString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatCacheTime(isoStr) {
  if (!isoStr) return ''
  const date = new Date(isoStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return formatTime(isoStr)
  return `${formatDateShort(isoStr)}, ${formatTime(isoStr)}`
}

export function isInMoscowNightWindow(dateStr) {
  const MSK = 'Europe/Moscow'
  const now = new Date()

  const mskDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: MSK,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

  const [y, m, d] = mskDateStr.split('-').map(Number)

  // 18:00 MSK = 15:00 UTC, 06:00 MSK = 03:00 UTC
  const start = Date.UTC(y, m - 1, d, 15, 0, 0)
  const end = Date.UTC(y, m - 1, d + 1, 3, 0, 0)

  const matchTime = new Date(dateStr).getTime()
  return matchTime >= start && matchTime <= end
}
