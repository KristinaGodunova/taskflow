-- ============================================================
-- 004_invite_rpc.sql: Хранимые процедуры (RPC)
-- ============================================================

-- 1. Приглашение пользователя на доску по email (Уровень 2.4)
create or replace function public.invite_user_by_email(p_board_id uuid, p_email text)
returns json as $$
declare
  target_user_id uuid;
  current_user_role text;
begin
  -- Проверяем права вызывающего (только owner)
  select role into current_user_role
  from public.board_members
  where board_id = p_board_id and user_id = auth.uid();

  if current_user_role <> 'owner' then
    return json_build_object('success', false, 'error', 'Только владелец может приглашать участников');
  end if;

  -- Ищем ID пользователя по email
  select id into target_user_id
  from auth.users
  where email = lower(trim(p_email));

  if target_user_id is null then
    return json_build_object('success', false, 'error', 'Пользователь с таким email не найден в системе');
  end if;

  -- Проверяем, не состоит ли уже в участниках
  if exists (select 1 from public.board_members where board_id = p_board_id and user_id = target_user_id) then
    return json_build_object('success', false, 'error', 'Пользователь уже является участником доски');
  end if;

  -- Добавляем в участники
  insert into public.board_members (board_id, user_id, role)
  values (p_board_id, target_user_id, 'member');

  return json_build_object('success', true);
end;
$$ language plpgsql security definer;

-- 2. Пакетная атомарная нормализация позиций задач в одной транзакции (P0 Drag & Drop)
create or replace function public.reorder_tasks(p_updates jsonb)
returns void as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(p_updates)
  loop
    update public.tasks
    set 
      column_id = (item->>'column_id')::uuid,
      position = (item->>'position')::integer
    where id = (item->>'id')::uuid;
  end loop;
end;
$$ language plpgsql security definer;