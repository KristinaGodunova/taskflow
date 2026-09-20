import { supabase } from './supabase';
import type { Board } from '../types/database';

export interface BoardWithRole extends Board {
  role?: 'owner' | 'member';
}

// 1. Получить список всех досок текущего пользователя
export const getBoards = async (userId: string): Promise<BoardWithRole[]> => {
  const { data, error } = await supabase
    .from('boards')
    .select(`
      *,
      board_members!inner(role, user_id)
    `)
    .eq('board_members.user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((b: any) => ({
    ...b,
    role: b.board_members?.[0]?.role || 'member',
  }));
};

// 2. Создать новую доску (триггер в БД сам добавит владельца и создаст колонки "To Do", "In Progress", "Done")
export const createBoard = async (title: string, ownerId: string): Promise<Board> => {
  const { data, error } = await supabase
    .from('boards')
    .insert({
      title,
      owner_id: ownerId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 3. Удалить доску
export const deleteBoard = async (boardId: string): Promise<void> => {
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId);

  if (error) throw error;
};