// ========================================
// Настройки системы начисления очков
// Меняй числа — и система пересчитается
//
// Используется как в JS (превью очков),
// так и в SQL (функция calculate_points).
// При изменении чисел — обнови и SQL-функцию
// в supabase/migrations/002_prediction_types.sql
// ========================================

// --- Основные типы прогнозов ---

/** Точный счёт (обе цифры совпали с реальными) */
export const POINTS_EXACT_SCORE = 5

/** Исход матча (1/X/2) — начисляется, только если точный счёт не вводился */
export const POINTS_OUTCOME = 3

/** Порог голов: команда забила не меньше N */
export const POINTS_GOALS_THRESHOLD = 2

// --- Бонусы при точном счёте ---
// (прибавляются, когда игрок не угадал точный счёт,
//  но угадал какие-то его компоненты)

/** Правильная разница голов (например, предсказал 2-1, а реально 3-2) */
export const POINTS_GOAL_DIFFERENCE = 2

/** Угадано количество голов хозяев */
export const POINTS_HOME_GOAL = 1

/** Угадано количество голов гостей */
export const POINTS_AWAY_GOAL = 1

// --- Вспомогательные функции для JS ---

/** Возвращает текстовое описание типа прогноза */
export function getPredictionTypeLabel(prediction) {
  if (prediction.predicted_home_score != null && prediction.predicted_away_score != null) {
    return 'Точный счёт'
  }
  if (prediction.outcome) {
    const labels = { 1: 'Победа хозяев', X: 'Ничья', 2: 'Победа гостей' }
    return labels[prediction.outcome] || 'Исход'
  }
  if (prediction.goals_team && prediction.goals_threshold != null) {
    const team = prediction.goals_team === 'home' ? 'Хозяева' : 'Гости'
    return `${team} ≥ ${prediction.goals_threshold}`
  }
  return 'Прогноз'
}

/** Возвращает иконку для типа прогноза */
export function getPredictionTypeIcon(prediction) {
  if (prediction.predicted_home_score != null && prediction.predicted_away_score != null) {
    return '🎯'
  }
  if (prediction.outcome) {
    return '✅'
  }
  if (prediction.goals_team && prediction.goals_threshold != null) {
    return '⚽'
  }
  return '📋'
}

/** Возвращает краткое описание прогноза одной строкой */
export function getPredictionSummary(prediction) {
  const parts = []
  if (prediction.predicted_home_score != null && prediction.predicted_away_score != null) {
    parts.push(`${prediction.predicted_home_score}:${prediction.predicted_away_score}`)
  }
  if (prediction.outcome) {
    const labels = { 1: 'П1', X: 'X', 2: 'П2' }
    parts.push(labels[prediction.outcome])
  }
  if (prediction.goals_team && prediction.goals_threshold != null) {
    parts.push(`Ɒ${prediction.goals_threshold}`)
  }
  return parts.join(' / ')
}
