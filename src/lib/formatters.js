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
