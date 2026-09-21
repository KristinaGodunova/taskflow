-- ============================================================
-- 003_board_trigger.sql: Автоматизация создания доски (Уровень 1.3)
-- ============================================================

create or replace function public.handle_new_board()
returns trigger as $$
begin
  -- 1. Добавляем владельца доски в участники с ролью owner
  insert into public.board_members (board_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  -- 2. Автоматически создаем 3 колонки по умолчанию
  insert into public.columns (board_id, title, position)
  values 
    (new.id, 'To Do', 0),
    (new.id, 'In Progress', 1),
    (new.id, 'Done', 2);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_board_created on public.boards;
create trigger on_board_created
  after insert on public.boards
  for each row execute procedure public.handle_new_board();