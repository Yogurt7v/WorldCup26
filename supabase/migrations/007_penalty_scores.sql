-- ========================================
-- ЧМ-2026: Счёт серии пенальти для матчей плей-офф
-- ========================================

-- 1. Новые колонки в таблице матчей
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_penalty_score INTEGER,
  ADD COLUMN IF NOT EXISTS away_penalty_score INTEGER;

-- 2. Обновляем функцию расчёта очков
-- Для нокаут-матчей (stage != 'group') с серией пенальти:
--   actual_outcome определяется по победителю пенальти, а не по счёту
CREATE OR REPLACE FUNCTION calculate_points(
  predicted_home INTEGER,
  predicted_away INTEGER,
  actual_home INTEGER,
  actual_away INTEGER,
  outcome TEXT,
  goals_team TEXT,
  goals_threshold INTEGER,
  home_penalty INTEGER DEFAULT NULL,
  away_penalty INTEGER DEFAULT NULL,
  match_stage TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  points INTEGER := 0;
  predicted_outcome TEXT;
  actual_outcome TEXT;
BEGIN
  -- Определяем actual_outcome
  -- Для нокаут-матчей, закончившихся серией пенальти, — по победителю пенальти
  IF match_stage IS NOT NULL AND match_stage != 'group'
     AND home_penalty IS NOT NULL AND away_penalty IS NOT NULL
     AND actual_home = actual_away THEN
    IF home_penalty > away_penalty THEN
      actual_outcome := '1';
    ELSE
      actual_outcome := '2';
    END IF;
  ELSE
    actual_outcome := CASE
      WHEN actual_home > actual_away THEN '1'
      WHEN actual_home = actual_away THEN 'X'
      ELSE '2'
    END;
  END IF;

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

-- 3. Обновляем триггерную функцию (передаём новые параметры)
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
      goals_threshold,
      NEW.home_penalty_score,
      NEW.away_penalty_score,
      NEW.stage
    )
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Пересчитываем очки для всех завершённых матчей
UPDATE predictions p
SET points_earned = calculate_points(
  p.predicted_home_score,
  p.predicted_away_score,
  m.home_score,
  m.away_score,
  p.outcome,
  p.goals_team,
  p.goals_threshold,
  m.home_penalty_score,
  m.away_penalty_score,
  m.stage
)
FROM matches m
WHERE m.id = p.match_id AND m.status = 'FINISHED';
