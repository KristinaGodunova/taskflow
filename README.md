# TaskFlow (Jira-lite)

Веб-приложение для управления задачами на канбан-досках с поддержкой совместной работы и обновлениями в реальном времени.

## Стек технологий
- **Frontend:** React 18, TypeScript (strict mode: `true`), Vite
- **Стилизация:** Tailwind CSS, Lucide React
- **State Management & Caching:** TanStack Query (React Query) + Context API
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **Маршрутизация:** React Router v6
- **Backend / Database:** Supabase (PostgreSQL, Auth, Row Level Security, Realtime, Storage)
- **Уведомления:** Sonner

---

## Развертывание базы данных (Supabase Migrations)

Все серверные миграции (таблицы, RLS-политики, триггеры, RPC-функции и хранилище файлов) вынесены в директорию `supabase/migrations/`:

1. `001_schema.sql` — базовые таблицы (`profiles`, `boards`, `board_members`, `columns`, `tasks`, `comments`), триггер создания профиля при регистрации и публикация Realtime.
2. `002_rls.sql` — политики Row Level Security (RLS) и функция безопасной проверки членства без рекурсии.
3. `003_board_trigger.sql` — триггер автоматического добавления владельца в `board_members` и создания 3 колонок по умолчанию («To Do», «In Progress», «Done»).
4. `004_invite_rpc.sql` — хранимые процедуры: `invite_user_by_email` (приглашение по email) и `reorder_tasks` (пакетное сохранение позиций задач).
5. `005_storage.sql` — инициализация публичного бакета `avatars` и RLS-политики на загрузку файлов в Supabase Storage.

### Применение миграций к новому проекту Supabase:
- **Способ 1 (через веб-интерфейс):** в дашборде Supabase откройте **SQL Editor** -> поочередно скопируйте и выполните содержимое файлов с `001` по `005`.
- **Способ 2 (через Supabase CLI):**
  ```bash
  npx supabase link --project-ref <your-project-ref>
  npx supabase db push