export function formatTime(dateStr) {
  const d = new Date(dateStr)
  const msk = new Date(d.getTime() + 3 * 60 * 60 * 1000)
  const hours = String(msk.getUTCHours()).padStart(2, '0')
  const minutes = String(msk.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

export function formatDateLong(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
