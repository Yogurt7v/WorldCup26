# План: Переход на статические данные после чемпионата

## Цель
После завершения чемпионата мира 2026:
- Выгрузить все результаты в JSON-файлы внутри проекта
- Заменить все API/Supabase вызовы на чтение из этих файлов
- Убрать обновление данных в реальном времени
- Убрать базу данных
- Каждый пользователь видит свои ставки (логин без пароля, выбор из списка)

## Шаг 1: Создать JSON-файлы в `src/data/`

Создать папку `src/data/` с файлами:

| Файл | Содержимое | Источник |
|---|---|---|
| `users.json` | `[{ id, username, created_at }]` | Supabase таблица `users` |
| `matches.json` | `[{ id, home_team, away_team, match_date, status, home_score, away_score, half_time_home_score, half_time_away_score, stadium_name, city, timezone, stage, home_penalty_score, away_penalty_score, last_update }]` | Supabase таблица `matches` |
| `predictions.json` | `[{ id, user_id, match_id, predicted_home_score, predicted_away_score, outcome, goals_team, goals_threshold, points_earned, created_at, updated_at }]` | Supabase таблица `predictions` |
| `leaderboard.json` | `[{ id, username, total_points, total_predictions, exact_scores, correct_outcomes, scored_predictions }]` | Supabase view `leaderboard` |
| `groups.json` | `[{ name, teams: [{ team_id, name, fifa_code, mp, w, l, d, pts, gf, ga, gd }] }]` | API `GET /get/groups` + `GET /get/teams` |
| `bracket.json` | `[{ stage, label, matches: [{ id, label, home_team, away_team, home_score, away_score, home_penalty_score, away_penalty_score, status, match_date, row, span }] }]` | API `GET /get/games` |

### Как выгрузить

**Supabase (через Dashboard → SQL Editor):**
```sql
SELECT * FROM users;
SELECT * FROM matches ORDER BY id;
SELECT * FROM predictions ORDER BY id;
SELECT * FROM leaderboard;
```

**API (через браузер или curl):**
```
GET https://worldcup26.ir/get/groups
GET https://worldcup26.ir/get/teams
GET https://worldcup26.ir/get/games
```

## Шаг 2: Упростить `useAuth.jsx`

- Убрать Supabase Auth
- Логин: загрузить `users.json`, показать список пользователей
- После выбора сохранить `user` в `localStorage` (`wc26_user`)
- Экспортировать: `useAuth()` → `{ user, login, logout }`

## Шаг 3: Упростить `useMatches.jsx`

### `useMatches()`
- Загрузить `matches.json` при инициализации
- Убрать: `doSync()`, `refresh()`, `scheduleSync()`, polling, Realtime
- Вернуть: `{ matches, loading, error }`

### `useMatch(matchId)`
- Фильтровать `matches.json` по `id`
- Убрать Realtime-подписку
- Вернуть: `{ match, loading }`

### `usePredictions(matchId)`
- Загрузить `predictions.json`, фильтровать по `match_id`
- Для отображения имён пользователей — объединить с `users.json`
- Убрать Realtime-подписку
- Вернуть: `{ predictions, loading, error }`

### `useLeaderboard()`
- Загрузить `leaderboard.json`
- Убрать Realtime-подписку, localStorage-кеш
- Вернуть: `{ leaderboard, loading, error }`

## Шаг 4: Обновить страницы

### `Home.jsx`
- Прогнозы: загрузить `predictions.json`, фильтр по `user.id`
- Чемпионат-баннер: всегда показывать (все матчи завершены)

### `MatchDetails.jsx`
- Матч: из `matches.json` по `matchId`
- Прогнозы: из `predictions.json` с join `users.json`

### `GroupsPage.jsx`
- Группы: загрузить `groups.json`
- Брекет: загрузить `bracket.json`
- Убрать вызовы API `fetchGroupStandings()`, `fetchKnockoutBracket()`

### `ResultsPage.jsx`
- Данные из JSON-файлов
- Убрать проверку «все матчи завершены»

## Шаг 5: Заблокировать `PredictionForm.jsx`

- Показать сообщение: «Чемпионат завершён. Приём прогнозов закрыт.»
- Убрать форму ввода

## Шаг 6: Упростить `Layout.jsx`

- Убрать кнопку «Обновить» и индикатор синхронизации
- Убрать `syncing`, `refresh` из контекста

## Шаг 7: Удалить Supabase

- Удалить `src/lib/supabase.js`
- Удалить env-переменные: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Удалить все импорты Supabase из компонентов
- Удалить `api/supabase.js` (Vercel proxy), если есть

## Шаг 8: Проверка

- `npm run build` — убедиться что сборка проходит
- Протестировать все страницы
- Проверить что каждый пользователь видит свои ставки
