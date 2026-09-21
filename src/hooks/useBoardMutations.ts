import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumn,
  updateColumnTitle,
  deleteColumn,
  createTask,
  deleteTask,
} from '../services/boardDetail';
import { getErrorMessage } from '../utils/errors';
import { toast } from 'sonner';

interface UseBoardMutationsProps {
  boardId: string;
  userId?: string;
  columnsCount: number;
}

export const useBoardMutations = ({ boardId, userId, columnsCount }: UseBoardMutationsProps) => {
  const queryClient = useQueryClient();

  const addColumnMutation = useMutation({
    mutationFn: (title: string) => createColumn(boardId, title, columnsCount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Колонка создана');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const renameColumnMutation = useMutation({
    mutationFn: ({ colId, title }: { colId: string; title: string }) =>
      updateColumnTitle(colId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: deleteColumn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Колонка удалена');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: ({ colId, title, position }: { colId: string; title: string; position: number }) =>
      createTask(colId, title, userId || '', position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Задача создана');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Задача удалена');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  return {
    addColumnMutation,
    renameColumnMutation,
    deleteColumnMutation,
    addTaskMutation,
    deleteTaskMutation,
  };
};