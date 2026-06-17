-- ========================================
-- ЧМ-2026 Прогнозы: типы прогнозов
-- ========================================

-- 1. Новые колонки в таблице прогнозов
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('1', 'X', '2')),
  ADD COLUMN IF NOT EXISTS goals_team TEXT CHECK (goals_team IN ('home', 'away')),
  ADD COLUMN IF NOT EXISTS goals_threshold INTEGER,
  ALTER COLUMN predicted_home_score DROP NOT NULL,
  ALTER COLUMN predicted_away_score DROP NOT NULL;

-- Для старых прогнозов проставляем outcome из счёта
UPDATE predictions
SET outcome = CASE
  WHEN predicted_home_score > predicted_away_score THEN '1'
  WHEN predicted_home_score = predicted_away_score THEN 'X'
  ELSE '2'
END
WHERE outcome IS NULL AND predicted_home_score IS NOT NULL AND predicted_away_score IS NOT NULL;

-- ========================================
-- Функция расчёта очков (расширенная)
-- Значения очков синхронизированы с src/lib/scoring.js
-- ========================================
CREATE OR REPLACE FUNCTION calculate_points(
  predicted_home INTEGER,
  predicted_away INTEGER,
  actual_home INTEGER,
  actual_away INTEGER,
  outcome TEXT,
  goals_team TEXT,
  goals_threshold INTEGER
) RETURNS INTEGER AS $$
DECLARE
  points INTEGER := 0;
  predicted_outcome TEXT;
  actual_outcome TEXT := CASE
    WHEN actual_home > actual_away THEN '1'
    WHEN actual_home = actual_away THEN 'X'
    ELSE '2'
  END;
BEGIN
  -- 1. Точный счёт → 5 очков
  IF predicted_home IS NOT NULL AND predicted_away IS NOT NULL THEN
    IF predicted_home = actual_home AND predicted_away = actual_away THEN
      points := points + 5;
    END IF;

    -- Исход матча по введённому счёту → +3 (суммируется с точным счётом)
    predicted_outcome := CASE
      WHEN predicted_home > predicted_away THEN '1'
      WHEN predicted_home = predicted_away THEN 'X'
      ELSE '2'
    END;
    IF predicted_outcome = actual_outcome THEN
      points := points + 3;
    END IF;
  END IF;

  -- 2. Исход (без счёта) → 3 очка
  IF outcome IS NOT NULL AND (predicted_home IS NULL OR predicted_away IS NULL) THEN
    IF outcome = actual_outcome THEN
      points := points + 3;
    END IF;
  END IF;

  -- 3. Порог голов → +2 очка
  IF goals_team IS NOT NULL AND goals_threshold IS NOT NULL THEN
    IF (goals_team = 'home' AND actual_home >= goals_threshold)
       OR (goals_team = 'away' AND actual_away >= goals_threshold)
    THEN
      points := points + 2;
    END IF;
  END IF;

  RETURN points;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Триггер: пересчёт очков (расширенный)
-- ========================================
CREATE OR REPLACE FUNCTION recalculate_match_predictions() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'FINISHED' THEN
    UPDATE predictions
    SET points_earned = calculate_points(
      predicted_home_score,
      predicted_away_score,
      NEW.home_score,
      NEW.away_score,
      outcome,
      goals_team,
      goals_threshold
    )
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер уже существует, пересоздавать не нужно
