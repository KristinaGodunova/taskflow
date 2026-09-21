import React, { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { ColumnWithTasks, TaskWithAssignee } from '../../services/boardDetail';
import { ColumnContainer } from './ColumnContainer';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import type { useTaskDnD } from '../../hooks/useTaskDnD';

interface BoardCanvasProps {
  columns: ColumnWithTasks[];
  isOwner: boolean;
  dnd: ReturnType<typeof useTaskDnD>;
  onAddTask: (columnId: string, title: string, position: number) => void;
  onRenameColumn: (colId: string, title: string) => void;
  onDeleteColumn: (colId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectTask: (task: TaskWithAssignee) => void;
  onAddColumn: (title: string) => void;
  isAddingColumnPending: boolean;
}

export const BoardCanvas: React.FC<BoardCanvasProps> = ({
  columns,
  isOwner,
  dnd,
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
  onDeleteTask,
  onSelectTask,
  onAddColumn,
  isAddingColumnPending,
}) => {
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  const handleCreateColumn = () => {
    if (!newColTitle.trim()) return;
    onAddColumn(newColTitle.trim());
    setNewColTitle('');
    setIsAddingCol(false);
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
      <DndContext
        sensors={dnd.sensors}
        collisionDetection={dnd.collisionDetectionStrategy}
        onDragStart={dnd.handleDragStart}
        onDragOver={dnd.handleDragOver}
        onDragEnd={dnd.handleDragEnd}
      >
        <div className="flex h-full items-start gap-5">
          {columns.map((column) => (
            <ColumnContainer
              key={column.id}
              column={column}
              canManageColumns={isOwner}
              onAddTask={(colId, title) => onAddTask(colId, title, column.tasks.length)}
              onRenameColumn={onRenameColumn}
              onDeleteColumn={onDeleteColumn}
              onDeleteTask={onDeleteTask}
              onSelectTask={onSelectTask}
            />
          ))}

          {/* Добавление новой колонки доступно только владельцу доски */}
          {isOwner && (
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
                      if (e.key === 'Enter') handleCreateColumn();
                      if (e.key === 'Escape') setIsAddingCol(false);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={handleCreateColumn}
                      disabled={!newColTitle.trim() || isAddingColumnPending}
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
          )}
        </div>

        <DragOverlay>
          {dnd.activeTask ? <TaskCard task={dnd.activeTask} onDelete={() => {}} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};