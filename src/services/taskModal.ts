import { supabase } from './supabase';
import type { PriorityType, MemberRole } from '../types/database';

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
  role: MemberRole;
  profile: {
    name: string | null;
    avatar_url: string | null;
  };
}

export const getBoardMembers = async (boardId: string): Promise<BoardMemberInfo[]> => {
  const { data: members, error: mError } = await supabase
    .from('board_members')
    .select('user_id, role')
    .eq('board_id', boardId);

  if (mError) throw mError;
  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', userIds);

  if (pError) throw pError;

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, { name: p.name, avatar_url: p.avatar_url }])
  );

  return members.map((m) => ({
    user_id: m.user_id,
    role: m.role,
    profile: {
      name: profileMap.get(m.user_id)?.name ?? 'Пользователь',
      avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
    },
  }));
};

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

export const getTaskComments = async (taskId: string): Promise<CommentWithProfile[]> => {
  const { data: comments, error: cError } = await supabase
    .from('comments')
    .select('id, task_id, user_id, content, created_at')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (cError) throw cError;
  if (!comments || comments.length === 0) return [];

  const userIds = Array.from(new Set(comments.map((c) => c.user_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, { name: p.name, avatar_url: p.avatar_url }])
  );

  return comments.map((c) => ({
    id: c.id,
    task_id: c.task_id,
    user_id: c.user_id,
    content: c.content,
    created_at: c.created_at,
    profile: {
      name: profileMap.get(c.user_id)?.name ?? 'Пользователь',
      avatar_url: profileMap.get(c.user_id)?.avatar_url ?? null,
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

export const inviteMemberByEmail = async (boardId: string, email: string) => {
  const { data, error } = await supabase.rpc('invite_user_by_email', {
    p_board_id: boardId,
    p_email: email,
  });

  if (error) throw error;
  const result = data as { success: boolean; error?: string };
  if (!result.success) throw new Error(result.error || 'Ошибка приглашения');
  return result;
};

export const removeMember = async (boardId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', userId);

  if (error) throw error;
};
