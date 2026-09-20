import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useAuth } from '../providers/AuthContext';
import { useRealtimeBoard } from '../hooks/useRealtimeBoard';
import {
  getBoardDetails,
  createColumn,
  updateColumnTitle,
  deleteColumn,
  createTask,
  deleteTask,
  updateTaskPosition,
  type ColumnWithTasks,
} from '../services/boardDetail';
import { getBoardMembers } from '../services/taskModal';
import { ColumnContainer } from '../components/board/ColumnContainer';
import { TaskCard } from '../components/board/TaskCard';
import { TaskModal } from '../components/task/TaskModal';
import { InviteModal } from '../components/board/InviteModal';
import { Navbar } from '../components/shared/Navbar';
import type { Task } from '../types/database';
import { ArrowLeft, Plus, Users, Search, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const BoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useRealtimeBoard(boardId);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);

  // Бонус: Фильтрация и поиск (Уровень 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: boardData, isLoading, isError } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => getBoardDetails(boardId!),
    enabled: !!boardId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['board-members', boardId],
    queryFn: () => getBoardMembers(boardId!),
    enabled: !!boardId,
  });

  // Фильтрация колонок и задач по поисковому запросу и приоритету
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

  const addColumnMutation = useMutation({
    mutationFn: (title: string) =>
      createColumn(boardId!, title, boardData?.columns.length || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setNewColTitle('');
      setIsAddingCol(false);
      toast.success('Колонка создана');
    },
  });

  const renameColumnMutation = useMutation({
    mutationFn: ({ colId, title }: { colId: string; title: string }) =>
      updateColumnTitle(colId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
  });

  const deleteColumnMutation = useMutation({
    mutationFn: deleteColumn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Колонка удалена');
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: ({ colId, title }: { colId: string; title: string }) => {
      const col = boardData?.columns.find((c) => c.id === colId);
      const position = col ? col.tasks.length : 0;
      return createTask(colId, title, user!.id, position);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Задача создана');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Задача удалена');
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task;
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    queryClient.setQueryData(['board', boardId], (old: any) => {
      if (!old) return old;

      let sourceCol: ColumnWithTasks | undefined;
      let targetCol: ColumnWithTasks | undefined;

      for (const c of old.columns) {
        if (c.tasks.some((t: Task) => t.id === activeId)) sourceCol = c;
        if (c.id === overId || c.tasks.some((t: Task) => t.id === overId)) targetCol = c;
      }

      if (!sourceCol || !targetCol || sourceCol === targetCol) return old;

      const activeTaskItem = sourceCol.tasks.find((t: Task) => t.id === activeId);
      if (!activeTaskItem) return old;

      return {
        ...old,
        columns: old.columns.map((c: ColumnWithTasks) => {
          if (c.id === sourceCol!.id) {
            return { ...c, tasks: c.tasks.filter((t: Task) => t.id !== activeId) };
          }
          if (c.id === targetCol!.id) {
            const overIndex = c.tasks.findIndex((t: Task) => t.id === overId);
            const newIndex = overIndex >= 0 ? overIndex : c.tasks.length;
            const updatedTask = { ...activeTaskItem, column_id: targetCol!.id };
            const newTasks = [...c.tasks];
            newTasks.splice(newIndex, 0, updatedTask);
            return { ...c, tasks: newTasks };
          }
          return c;
        }),
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const currentBoard = queryClient.getQueryData<any>(['board', boardId]);
    if (!currentBoard) return;

    let targetCol: ColumnWithTasks | undefined;
    for (const c of currentBoard.columns) {
      if (c.tasks.some((t: Task) => t.id === activeId)) {
        targetCol = c;
        break;
      }
    }
    if (!targetCol) return;

    const newPosition = targetCol.tasks.findIndex((t: Task) => t.id === activeId);
    try {
      await updateTaskPosition(activeId, targetCol.id, newPosition);
    } catch {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    }
  };

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

      {/* Панель инструментов: Название, Поиск, Фильтр и Участники */}
      <div className="border-b border-gray-200 bg-white px-6 py-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
              title="Назад к доскам"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">{boardData.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Поиск по названию */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск задач..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 sm:w-56 rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Фильтр по приоритету */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 outline-none"
              >
                <option value="all">Все приоритеты</option>
                <option value="low">Низкий (low)</option>
                <option value="medium">Средний (medium)</option>
                <option value="high">Высокий (high)</option>
              </select>
            </div>

            {/* Кнопка участников */}
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
            >
              <Users className="h-4 w-4 text-gray-500" />
              <span>Участники ({members.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Рабочая область канбан-доски */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full items-start gap-5">
            {filteredColumns.map((column) => (
              <ColumnContainer
                key={column.id}
                column={column}
                onAddTask={(colId, title) => addTaskMutation.mutate({ colId, title })}
                onRenameColumn={(colId, title) => renameColumnMutation.mutate({ colId, title })}
                onDeleteColumn={(colId) => deleteColumnMutation.mutate(colId)}
                onDeleteTask={(taskId) => deleteTaskMutation.mutate(taskId)}
                onSelectTask={(task) => setSelectedTask(task)}
              />
            ))}

            <div className="w-80 shrink-0">
              {isAddingCol ? (
                <div className="rounded-2xl border border-gray-300 bg-slate-100 p-3.5 shadow-sm">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Название колонки..."
                    value={newColTitle}
                    onChange={(e) => setNewColTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newColTitle.trim()) {
                        addColumnMutation.mutate(newColTitle.trim());
                      }
                      if (e.key === 'Escape') setIsAddingCol(false);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => newColTitle.trim() && addColumnMutation.mutate(newColTitle.trim())}
                      disabled={!newColTitle.trim() || addColumnMutation.isPending}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-50"
                    >
                      Создать колонку
                    </button>
                    <button
                      onClick={() => setIsAddingCol(false)}
                      className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-200"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingCol(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 p-4 text-sm font-semibold text-gray-500 hover:border-gray-400 hover:bg-slate-100/60 transition"
                >
                  <Plus className="h-4 w-4" />
                  Добавить колонку
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} onDelete={() => {}} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          members={members}
          boardId={boardId!}
          onClose={() => setSelectedTask(null)}
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