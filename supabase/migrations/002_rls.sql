-- ============================================================
-- 002_rls.sql: Row Level Security (RLS) и строгая ролевая модель
-- ============================================================

-- 1. Включение RLS
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.columns enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;

-- 2. Проверка членства в доске (обходит рекурсию)
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

-- 3. Проверка прав владельца доски
create or replace function public.is_board_owner(_board_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.boards
    where id = _board_id
      and owner_id = auth.uid()
  );
$$;

-- 4. Политики profiles
create policy "Users can view profiles" on public.profiles for select to authenticated using (true);
create policy "Users can update own profile" on public.profiles for update to authenticated using (id = auth.uid());

-- 5. Политики boards (удаление и редактирование только owner)
create policy "Users can view their boards" on public.boards for select to authenticated
  using (owner_id = auth.uid() or public.is_board_member(id));
create policy "Users can create boards" on public.boards for insert to authenticated
  with check (owner_id = auth.uid());
create policy "Owner can update board" on public.boards for update to authenticated
  using (owner_id = auth.uid());
create policy "Owner can delete board" on public.boards for delete to authenticated
  using (owner_id = auth.uid());

-- 6. Политики board_members (управление участниками только owner)
create policy "Users can view members of their boards" on public.board_members for select to authenticated
  using (user_id = auth.uid() or public.is_board_member(board_id));
create policy "Owner can add members" on public.board_members for insert to authenticated
  with check (board_id in (select id from public.boards where owner_id = auth.uid()));
create policy "Owner can remove members" on public.board_members for delete to authenticated
  using (board_id in (select id from public.boards where owner_id = auth.uid()));

-- 7. Политики columns (структурой управляет только owner, просмотр — все участники)
create policy "Members can view columns" on public.columns for select to authenticated
  using (public.is_board_member(board_id));
create policy "Owner can insert columns" on public.columns for insert to authenticated
  with check (public.is_board_owner(board_id));
create policy "Owner can update columns" on public.columns for update to authenticated
  using (public.is_board_owner(board_id));
create policy "Owner can delete columns" on public.columns for delete to authenticated
  using (public.is_board_owner(board_id));

-- 8. Политики tasks (задачи доступны всем участникам: owner + member)
create policy "Members can view tasks" on public.tasks for select to authenticated
  using (public.is_board_member((select board_id from public.columns where id = column_id)));
create policy "Members can manage tasks" on public.tasks for all to authenticated
  using (public.is_board_member((select board_id from public.columns where id = column_id)))
  with check (public.is_board_member((select board_id from public.columns where id = column_id)));

-- 9. Политики comments
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