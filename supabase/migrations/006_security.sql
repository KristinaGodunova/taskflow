create or replace function public.reorder_tasks(p_updates jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(p_updates)
  loop
    update public.tasks
    set column_id = (item->>'column_id')::uuid,
        position  = (item->>'position')::integer
    where id = (item->>'id')::uuid;
  end loop;
end;
$$;

revoke execute on function public.reorder_tasks(jsonb) from public, anon;
grant  execute on function public.reorder_tasks(jsonb) to authenticated;

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Authenticated users can update avatars" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.invite_user_by_email(p_board_id uuid, p_email text)
returns json as $$
declare
  target_user_id uuid;
  current_user_role text;
begin
  select role into current_user_role
  from public.board_members
  where board_id = p_board_id and user_id = auth.uid();

  if current_user_role is distinct from 'owner' then
    return json_build_object('success', false, 'error', 'Только владелец может приглашать участников');
  end if;

  select id into target_user_id
  from auth.users
  where email = lower(trim(p_email));

  if target_user_id is null then
    return json_build_object('success', false, 'error', 'Пользователь с таким email не найден в системе');
  end if;

  if exists (select 1 from public.board_members where board_id = p_board_id and user_id = target_user_id) then
    return json_build_object('success', false, 'error', 'Пользователь уже является участником доски');
  end if;

  insert into public.board_members (board_id, user_id, role)
  values (p_board_id, target_user_id, 'member');

  return json_build_object('success', true);
end;
$$ language plpgsql security definer;

revoke execute on function public.invite_user_by_email(uuid, text) from public, anon;
grant  execute on function public.invite_user_by_email(uuid, text) to authenticated;
