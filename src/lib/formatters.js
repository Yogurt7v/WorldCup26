export function formatTime(dateStr) {
  const d = new Date(dateStr)
  const msk = new Date(d.getTime() + 6 * 60 * 60 * 1000)
  const hours = String(msk.getUTCHours()).padStart(2, '0')
  const minutes = String(msk.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function toMoscow(dateStr) {
  return new Date(new Date(dateStr).getTime() + 6 * 60 * 60 * 1000)
}

export function formatDateShort(dateStr) {
  return toMoscow(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

export function formatDateLong(dateStr) {
  return toMoscow(dateStr).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
