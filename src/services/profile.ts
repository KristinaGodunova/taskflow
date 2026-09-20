import { supabase } from './supabase';
import type { Profile } from '../types/database';

// Список стильных готовых аватаров
export const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cosmo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Buster',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Mila',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Sam',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Alex',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Felix',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Ruby',
];

// Получение профиля
export const getProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

// Обновление имени
export const updateProfileName = async (userId: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', userId);

  if (error) throw error;
};

// Установка готового аватара по URL
export const updateAvatarUrl = async (userId: string, avatarUrl: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (error) throw error;
};

// Загрузка собственного фото в Supabase Storage
export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}-${Math.random()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId);

  if (updateError) throw updateError;

  return data.publicUrl;
};