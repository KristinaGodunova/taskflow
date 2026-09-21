import { useQuery } from '@tanstack/react-query';
import { getBoardDetails, type BoardFullData } from '../services/boardDetail';
import { getBoardMembers, type BoardMemberInfo } from '../services/taskModal';

export const useBoard = (boardId?: string) => {
  const boardQuery = useQuery<BoardFullData>({
    queryKey: ['board', boardId],
    queryFn: () => getBoardDetails(boardId!),
    enabled: Boolean(boardId),
  });

  const membersQuery = useQuery<BoardMemberInfo[]>({
    queryKey: ['board-members', boardId],
    queryFn: () => getBoardMembers(boardId!),
    enabled: Boolean(boardId),
  });

  return {
    boardData: boardQuery.data,
    isLoading: boardQuery.isLoading,
    isError: boardQuery.isError,
    members: membersQuery.data || [],
  };
};