-- ============================================================
-- 001_schema.sql: Базовая схема таблиц TaskFlow
-- ============================================================

-- 1. Профили пользователей
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text
);

-- 2. Доски
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- 3. Участники доски
create table if not exists public.board_members (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  unique(board_id, user_id)
);

-- 4. Колонки
create table if not exists public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  position integer not null default 0
);

-- 5. Задачи
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.columns(id) on delete cascade,
  title text not null,
  description text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date timestamptz,
  assignee_id uuid references auth.users(id),
  position integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

-- 6. Комментарии
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- 7. Автоматическое создание профиля при регистрации в auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    null
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Включение публикации Realtime для доски
alter publication supabase_realtime add table public.tasks, public.columns, public.board_members, public.comments;