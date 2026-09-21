-- ============================================================
-- 005_storage.sql: Настройка Supabase Storage для аватаров (Уровень 2.5)
-- ============================================================

-- 1. Создаем публичный бакет для аватаров
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 2. RLS-политики бакета
drop policy if exists "Public can view avatars" on storage.objects;
create policy "Public can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "Authenticated users can update avatars" on storage.objects;
create policy "Authenticated users can update avatars"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars');