import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { BoardFullData } from '../services/boardDetail';

export const useRealtimeBoard = (boardId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`board-realtime-${boardId}`)
      // 1. Колонки фильтруются на уровне PostgreSQL по board_id
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['board', boardId] });
        }
      )
      // 2. Участники фильтруются на уровне PostgreSQL по board_id
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_members', filter: `board_id=eq.${boardId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['board-members', boardId] });
        }
      )
      // 3. Задачи: точечная локальная фильтрация по payload (P2 решение)
      // Исключает лишние refetch при активности на других досках пользователя
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          const currentBoard = queryClient.getQueryData<BoardFullData>(['board', boardId]);

          // Если доска еще не загружена в кэш — безопасное обновление
          if (!currentBoard) {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            return;
          }

          const currentColumnIds = new Set(currentBoard.columns.map((c) => c.id));
          const newColId = (payload.new as { column_id?: string })?.column_id;
          const oldColId = (payload.old as { column_id?: string })?.column_id;
          const deletedTaskId = (payload.old as { id?: string })?.id;

          // Проверяем: затрагивает ли событие колонки текущей открытой доски
          const isCurrentBoardColumn =
            (Boolean(newColId) && currentColumnIds.has(newColId!)) ||
            (Boolean(oldColId) && currentColumnIds.has(oldColId!));

          // Для события DELETE: проверяем, была ли задача в текущей доске
          const isDeletedTaskFromCurrentBoard = deletedTaskId
            ? currentBoard.columns.some((col) => col.tasks.some((t) => t.id === deletedTaskId))
            : false;

          // Инвалидируем кэш только если событие действительно принадлежит текущей доске
          if (isCurrentBoardColumn || isDeletedTaskFromCurrentBoard) {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, queryClient]);
};