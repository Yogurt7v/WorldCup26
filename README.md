# ЧМ-2026 Прогнозы

Приложение для прогнозов на матчи чемпионата мира по футболу 2026.

**Стек:** React + Vite + Supabase + OpenLigaDB + PWA

## Настройка проекта

### 1. Создать проект Supabase

1. Зарегистрироваться на [supabase.com](https://supabase.com)
2. Создать новый проект
3. Перейти в **SQL Editor** → выполнить содержимое `supabase/migrations/001_init.sql`
4. Включить Realtime:
   - Перейти **Database → Replication**
   - Включить replication для таблиц `matches` и `predictions`
   - Либо выполнить в SQL Editor:
     ```sql
     ALTER PUBLICATION supabase_realtime ADD TABLE matches;
     ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
     ```
5. Скопировать **Project URL** и **anon public key** из **Settings → API**

### 2. Настройка окружения

Создать файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Установка и запуск

```bash
pnpm install
pnpm dev
```

### 4. Сборка

```bash
pnpm build
pnpm preview
```

## Деплой на Vercel

1. Форкнуть/загрузить проект на GitHub
2. На [vercel.com](https://vercel.com) создать новый проект из репозитория
3. В настройках проекта добавить переменные окружения:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Деплой произойдёт автоматически

## Синхронизация матчей

Данные матчей берутся из бесплатного REST API [worldcup26.ir](https://worldcup26.ir) (открытый исходный код, данные ЧМ-2026).

Матчи синхронизируются автоматически:
- При первой загрузке страницы (если таблица `matches` пуста)
- Каждые 60 секунд в фоне
- По кнопке **Обновить** на странице матчей

## Система начисления очков

| Условие | Очки |
|---------|------|
| Точный счёт | 5 |
| Правильный исход (1/X/2) | 3 |
| Правильная разница голов | +2 |
| Угадано кол-во голов одной команды | +1 (за каждую) |

**Примеры:**
- Прогноз 2:1, счёт 2:1 → **5 очков**
- Прогноз 2:1, счёт 2:0 → исход (+3) + голы хозяев (+1) = **4 очка**
- Прогноз 1:1, счёт 2:2 → исход (+3) + разница (+2) = **5 очков**

## Структура БД

- **users** — id (UUID), username (unique), created_at
- **matches** — id, home_team, away_team, match_date, status, scores
- **predictions** — user_id, match_id, predicted_scores, points_earned
- **leaderboard** (view) — агрегированные очки и статистика

## Cron-синхронизация (опционально)

Если нужна регулярная синхронизация без открытия приложения:

1. Зарегистрироваться на [cron-job.org](https://cron-job.org)
2. Создать задачу с URL вашего приложения + `/sync` (если реализован endpoint)
3. Интервал: каждые 30 минут

## Лицензия

MIT
