-- ========================================
-- ЧМ-2026: Новая логика начисления
-- Бонусы за голы/разницу удалены.
-- При неточном счёте — +3 за исход.
-- ========================================

-- 1. Обновляем функцию расчёта очков
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
    ELSE
      -- Исход матча по введённому счёту → +3
      predicted_outcome := CASE
        WHEN predicted_home > predicted_away THEN '1'
        WHEN predicted_home = predicted_away THEN 'X'
        ELSE '2'
      END;
      IF predicted_outcome = actual_outcome THEN
        points := points + 3;
      END IF;
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

-- 2. Пересчитываем очки для всех завершённых матчей
UPDATE predictions p
SET points_earned = calculate_points(
  p.predicted_home_score,
  p.predicted_away_score,
  m.home_score,
  m.away_score,
  p.outcome,
  p.goals_team,
  p.goals_threshold
)
FROM matches m
WHERE m.id = p.match_id AND m.status = 'FINISHED';
