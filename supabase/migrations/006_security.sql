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
