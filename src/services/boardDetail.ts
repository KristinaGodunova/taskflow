import { supabase } from './supabase';
import type { Column, Task } from '../types/database';

export interface TaskWithAssignee extends Task {
  assignee?: {
    name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ColumnWithTasks extends Column {
  tasks: TaskWithAssignee[];
}

export interface BoardFullData {
  id: string;
  title: string;
  owner_id: string;
  columns: ColumnWithTasks[];
}

export interface TaskPositionUpdate {
  id: string;
  column_id: string;
  position: number;
}

// 1. Получение доски с колонками и задачами (сортировка по position)
export const getBoardDetails = async (boardId: string): Promise<BoardFullData> => {
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('id, title, owner_id')
    .eq('id', boardId)
    .single();

  if (boardError) throw boardError;

  const { data: columns, error: colError } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (colError) throw colError;

  const columnIds = (columns || []).map((c) => c.id);
  let tasks: TaskWithAssignee[] = [];

  if (columnIds.length > 0) {
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .in('column_id', columnIds)
      .order('position', { ascending: true });

    if (taskError) throw taskError;

    const assigneeIds = Array.from(
      new Set((taskData || []).map((t) => t.assignee_id).filter(Boolean))
    ) as string[];

    let profileMap = new Map<string, { name: string | null; avatar_url: string | null }>();
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', assigneeIds);

      profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    }

    tasks = (taskData || []).map((t) => ({
      ...t,
      assignee: t.assignee_id ? profileMap.get(t.assignee_id) || null : null,
    }));
  }

  const columnsWithTasks: ColumnWithTasks[] = (columns || []).map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.column_id === col.id).sort((a, b) => a.position - b.position),
  }));

  return {
    ...board,
    columns: columnsWithTasks,
  };
};

// 2. Управление колонками
export const createColumn = async (boardId: string, title: string, position: number) => {
  const { data, error } = await supabase
    .from('columns')
    .insert({ board_id: boardId, title, position })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateColumnTitle = async (columnId: string, title: string) => {
  const { error } = await supabase
    .from('columns')
    .update({ title })
    .eq('id', columnId);

  if (error) throw error;
};

export const deleteColumn = async (columnId: string) => {
  const { error } = await supabase
    .from('columns')
    .delete()
    .eq('id', columnId);

  if (error) throw error;
};

// 3. Управление задачами
export const createTask = async (columnId: string, title: string, createdBy: string, position: number) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      column_id: columnId,
      title,
      created_by: createdBy,
      position,
      priority: 'medium',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
};

// 4. Пакетная атомарная нормализация позиций задач (P0)
export const batchReorderTasks = async (updates: TaskPositionUpdate[]): Promise<void> => {
  if (updates.length === 0) return;
  const { error } = await supabase.rpc('reorder_tasks', {
    p_updates: updates,
  });

  if (error) throw error;
};