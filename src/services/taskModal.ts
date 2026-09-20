import { supabase } from './supabase';
import type { PriorityType } from '../types/database';

export interface CommentWithProfile {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    name: string | null;
    avatar_url: string | null;
  };
}

export interface BoardMemberInfo {
  user_id: string;
  role: 'owner' | 'member';
  profile: {
    name: string | null;
    avatar_url: string | null;
  };
}

// 1. Получение участников доски и их профилей
export const getBoardMembers = async (boardId: string): Promise<BoardMemberInfo[]> => {
  const { data: members, error: mError } = await supabase
    .from('board_members')
    .select('user_id, role')
    .eq('board_id', boardId);

  if (mError) throw mError;
  if (!members || members.length === 0) return [];

  const userIds = members.map((m: any) => m.user_id);
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', userIds);

  if (pError) throw pError;

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  return members.map((m: any) => ({
    user_id: m.user_id,
    role: m.role as 'owner' | 'member',
    profile: {
      name: profileMap.get(m.user_id)?.name || 'Пользователь',
      avatar_url: profileMap.get(m.user_id)?.avatar_url || null,
    },
  }));
};

// 2. Обновление полей задачи
export const updateTaskDetails = async (
  taskId: string,
  updates: {
    title?: string;
    description?: string | null;
    priority?: PriorityType;
    due_date?: string | null;
    assignee_id?: string | null;
  }
) => {
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);

  if (error) throw error;
};

// 3. Получение комментариев задачи и авторов
export const getTaskComments = async (taskId: string): Promise<CommentWithProfile[]> => {
  const { data: comments, error: cError } = await supabase
    .from('comments')
    .select('id, task_id, user_id, content, created_at')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (cError) throw cError;
  if (!comments || comments.length === 0) return [];

  const userIds = Array.from(new Set(comments.map((c: any) => c.user_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  return comments.map((c: any) => ({
    ...c,
    profile: {
      name: profileMap.get(c.user_id)?.name || 'Пользователь',
      avatar_url: profileMap.get(c.user_id)?.avatar_url || null,
    },
  }));
};

export const addComment = async (taskId: string, userId: string, content: string) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteComment = async (commentId: string) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
};

// 4. Приглашение по email
export const inviteMemberByEmail = async (boardId: string, email: string) => {
  const { data, error } = await supabase.rpc('invite_user_by_email', {
    p_board_id: boardId,
    p_email: email,
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error);
  return data;
};