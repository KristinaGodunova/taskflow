import { supabase } from './supabase';
import type { Board, MemberRole } from '../types/database';

export interface BoardWithRole extends Board {
  role?: MemberRole;
}

interface RawBoardMemberJoin {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
  board_members: {
    role: MemberRole;
    user_id: string;
  }[];
}

export const getBoards = async (userId: string): Promise<BoardWithRole[]> => {
  const { data, error } = await supabase
    .from('boards')
    .select(`
      id,
      title,
      owner_id,
      created_at,
      board_members!inner(role, user_id)
    `)
    .eq('board_members.user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rawBoards = (data || []) as unknown as RawBoardMemberJoin[];

  return rawBoards.map((b) => ({
    id: b.id,
    title: b.title,
    owner_id: b.owner_id,
    created_at: b.created_at,
    role: b.board_members?.[0]?.role ?? 'member',
  }));
};

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

export const deleteBoard = async (boardId: string): Promise<void> => {
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId);

  if (error) throw error;
};