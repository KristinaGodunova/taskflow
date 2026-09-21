import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { useRealtimeBoard } from '../hooks/useRealtimeBoard';
import { useBoard } from '../hooks/useBoard';
import { useBoardMutations } from '../hooks/useBoardMutations';
import { useTaskDnD } from '../hooks/useTaskDnD';
import { BoardToolbar } from '../components/board/BoardToolbar';
import { BoardCanvas } from '../components/board/BoardCanvas';
import { TaskModal } from '../components/task/TaskModal';
import { InviteModal } from '../components/board/InviteModal';
import { Navbar } from '../components/shared/Navbar';
import { Loader2 } from 'lucide-react';

export const BoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { user } = useAuth();

  // 1. Подписка Realtime
  useRealtimeBoard(boardId);

  // 2. Загрузка данных доски и участников
  const { boardData, isLoading, isError, members } = useBoard(boardId);

  // 3. Состояния UI (модалки и фильтры)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // 4. Мутации задач и колонок
  const mutations = useBoardMutations({
    boardId: boardId || '',
    userId: user?.id,
    columnsCount: boardData?.columns.length || 0,
  });

  // 5. Бизнес-логика Drag-and-Drop
  const dnd = useTaskDnD(boardId || '');

  // Поиск актуальной задачи для модального окна
  const currentSelectedTask = useMemo(() => {
    if (!selectedTaskId || !boardData) return null;
    for (const col of boardData.columns) {
      const found = col.tasks.find((t) => t.id === selectedTaskId);
      if (found) return found;
    }
    return null;
  }, [selectedTaskId, boardData]);

  // Фильтрация колонок
  const filteredColumns = useMemo(() => {
    if (!boardData?.columns) return [];
    return boardData.columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchesSearch && matchesPriority;
      }),
    }));
  }, [boardData?.columns, searchQuery, priorityFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex h-[calc(100vh-64px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (isError || !boardData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-4xl p-8 text-center">
          <p className="text-red-600">Ошибка загрузки доски.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Вернуться ко всем доскам
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = boardData.owner_id === user?.id;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <Navbar />

      {/* Панель инструментов */}
      <BoardToolbar
        title={boardData.title}
        membersCount={members.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        onOpenMembers={() => setIsInviteModalOpen(true)}
      />

      {/* Канбан-холст */}
      <BoardCanvas
        columns={filteredColumns}
        isOwner={isOwner}
        dnd={dnd}
        onAddTask={(colId, title, position) =>
          mutations.addTaskMutation.mutate({ colId, title, position })
        }
        onRenameColumn={(colId, title) =>
          mutations.renameColumnMutation.mutate({ colId, title })
        }
        onDeleteColumn={(colId) => mutations.deleteColumnMutation.mutate(colId)}
        onDeleteTask={(taskId) => mutations.deleteTaskMutation.mutate(taskId)}
        onSelectTask={(task) => setSelectedTaskId(task.id)}
        onAddColumn={(title) => mutations.addColumnMutation.mutate(title)}
        isAddingColumnPending={mutations.addColumnMutation.isPending}
      />

      {/* Модальные окна */}
      {currentSelectedTask && (
        <TaskModal
          task={currentSelectedTask}
          members={members}
          boardId={boardId!}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {isInviteModalOpen && (
        <InviteModal
          boardId={boardId!}
          members={members}
          isOwner={isOwner}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </div>
  );
};