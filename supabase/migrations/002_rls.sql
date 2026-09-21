-- ============================================================
-- 002_rls.sql: Row Level Security (RLS) и политики доступа
-- ============================================================

-- 1. Включение RLS
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.columns enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;

-- 2. Функция безопасной проверки членства в доске (обходит рекурсию в PostgreSQL)
create or replace function public.is_board_member(_board_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.board_members
    where board_id = _board_id
      and user_id = auth.uid()
  );
$$;

-- 3. Политики для profiles
create policy "Users can view profiles" on public.profiles for select to authenticated using (true);
create policy "Users can update own profile" on public.profiles for update to authenticated using (id = auth.uid());

-- 4. Политики для boards
create policy "Users can view their boards" on public.boards for select to authenticated
  using (owner_id = auth.uid() or public.is_board_member(id));

create policy "Users can create boards" on public.boards for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Owner can update board" on public.boards for update to authenticated
  using (owner_id = auth.uid());

create policy "Owner can delete board" on public.boards for delete to authenticated
  using (owner_id = auth.uid());

-- 5. Политики для board_members
create policy "Users can view members of their boards" on public.board_members for select to authenticated
  using (user_id = auth.uid() or public.is_board_member(board_id));

create policy "Owner can add members" on public.board_members for insert to authenticated
  with check (board_id in (select id from public.boards where owner_id = auth.uid()));

create policy "Owner can remove members" on public.board_members for delete to authenticated
  using (board_id in (select id from public.boards where owner_id = auth.uid()));

-- 6. Политики для columns
create policy "Members can view columns" on public.columns for select to authenticated
  using (public.is_board_member(board_id));

create policy "Members can manage columns" on public.columns for all to authenticated
  using (public.is_board_member(board_id))
  with check (public.is_board_member(board_id));

-- 7. Политики для tasks
create policy "Members can view tasks" on public.tasks for select to authenticated
  using (public.is_board_member((select board_id from public.columns where id = column_id)));

create policy "Members can manage tasks" on public.tasks for all to authenticated
  using (public.is_board_member((select board_id from public.columns where id = column_id)))
  with check (public.is_board_member((select board_id from public.columns where id = column_id)));

-- 8. Политики для comments
create policy "Members can view comments" on public.comments for select to authenticated
  using (task_id in (
    select t.id from public.tasks t
    join public.columns c on c.id = t.column_id
    where public.is_board_member(c.board_id)
  ));

create policy "Members can create comments" on public.comments for insert to authenticated
  with check (
    user_id = auth.uid() and 
    task_id in (
      select t.id from public.tasks t
      join public.columns c on c.id = t.column_id
      where public.is_board_member(c.board_id)
    )
  );

create policy "Users can delete own comments" on public.comments for delete to authenticated
  using (user_id = auth.uid());