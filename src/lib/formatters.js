export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  })
}

export function formatDateShort(dateStr) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Moscow',
  })
}

export function formatDateLong(dateStr) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Moscow',
  })
}
