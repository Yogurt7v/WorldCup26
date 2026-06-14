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
