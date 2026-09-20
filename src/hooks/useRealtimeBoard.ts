import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export const useRealtimeBoard = (boardId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!boardId) return;

    // Подписываемся на изменения в таблицах tasks и columns для текущей доски
    const channel = supabase
      .channel(`board-realtime-${boardId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['board', boardId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['board', boardId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_members', filter: `board_id=eq.${boardId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['board-members', boardId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, queryClient]);
};