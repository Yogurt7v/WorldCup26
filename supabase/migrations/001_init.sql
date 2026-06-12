-- ================================
-- ЧМ-2026 Прогнозы: Инициализация БД
-- ================================

-- 1. Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Таблица матчей (синхронизируется с OpenLigaDB)
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  league_id INTEGER DEFAULT 0,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TIMESTAMPTZ,
  status TEXT DEFAULT 'SCHEDULED',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  half_time_home_score INTEGER,
  half_time_away_score INTEGER,
  last_update TIMESTAMPTZ DEFAULT now()
);

-- 3. Таблица прогнозов
CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_home_score INTEGER NOT NULL,
  predicted_away_score INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);

-- ================================
-- Функция расчёта очков
-- ================================
CREATE OR REPLACE FUNCTION calculate_points(
  predicted_home INTEGER,
  predicted_away INTEGER,
  actual_home INTEGER,
  actual_away INTEGER
) RETURNS INTEGER AS $$
DECLARE
  points INTEGER := 0;
  predicted_outcome TEXT;
  actual_outcome TEXT;
BEGIN
  -- Точный счёт → 5 очков (максимум)
  IF predicted_home = actual_home AND predicted_away = actual_away THEN
    RETURN 5;
  END IF;

  -- Определяем исходы
  predicted_outcome := CASE
    WHEN predicted_home > predicted_away THEN '1'
    WHEN predicted_home = predicted_away THEN 'X'
    ELSE '2'
  END;

  actual_outcome := CASE
    WHEN actual_home > actual_away THEN '1'
    WHEN actual_home = actual_away THEN 'X'
    ELSE '2'
  END;

  -- Правильный исход → 3 очка
  IF predicted_outcome = actual_outcome THEN
    points := 3;
  END IF;

  -- Правильная разница голов → +2
  IF (predicted_home - predicted_away) = (actual_home - actual_away) THEN
    points := points + 2;
  END IF;

  -- Угадано количество голов хозяев → +1
  IF predicted_home = actual_home THEN
    points := points + 1;
  END IF;

  -- Угадано количество голов гостей → +1
  IF predicted_away = actual_away THEN
    points := points + 1;
  END IF;

  RETURN points;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- Триггер: пересчёт очков при изменении счёта матча
-- ================================
CREATE OR REPLACE FUNCTION recalculate_match_predictions() RETURNS TRIGGER AS $$
BEGIN
  -- Пересчитываем только для завершённых матчей
  -- или когда счёт изменился для уже завершённого
  IF NEW.status = 'FINISHED' THEN
    UPDATE predictions
    SET points_earned = calculate_points(
      predicted_home_score,
      predicted_away_score,
      NEW.home_score,
      NEW.away_score
    )
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_predictions ON matches;
CREATE TRIGGER trigger_recalculate_predictions
  AFTER UPDATE OF home_score, away_score, status ON matches
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.home_score IS DISTINCT FROM NEW.home_score
    OR OLD.away_score IS DISTINCT FROM NEW.away_score
  )
  EXECUTE FUNCTION recalculate_match_predictions();

-- ================================
-- Представление таблицы лидеров
-- ================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.username,
  COALESCE(SUM(p.points_earned), 0)::INTEGER AS total_points,
  COUNT(p.id)::INTEGER AS total_predictions,
  COUNT(CASE WHEN p.points_earned = 5 THEN 1 END)::INTEGER AS exact_scores,
  COUNT(CASE WHEN p.points_earned >= 3 THEN 1 END)::INTEGER AS correct_outcomes,
  COUNT(CASE WHEN p.points_earned > 0 THEN 1 END)::INTEGER AS scored_predictions
FROM users u
LEFT JOIN predictions p ON u.id = p.user_id
GROUP BY u.id, u.username
ORDER BY total_points DESC;

-- ================================
-- Включаем Realtime для таблиц
-- ================================
-- В Supabase нужно включить Realtime вручную через Dashboard:
-- 1. Перейти в Database → Replication
-- 2. Включить replication для таблиц: matches, predictions
-- Либо выполнить SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
-- (если publication не существует, создайте через Dashboard)
