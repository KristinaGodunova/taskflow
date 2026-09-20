import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ColumnWithTasks, TaskWithAssignee } from '../../services/boardDetail';
import { TaskCard } from './TaskCard';
import { Plus, MoreHorizontal, Trash2, Edit2, Check, X } from 'lucide-react';

interface ColumnContainerProps {
  column: ColumnWithTasks;
  onAddTask: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (columnId: string, newTitle: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectTask: (task: TaskWithAssignee) => void;
}

export const ColumnContainer: React.FC<ColumnContainerProps> = ({
  column,
  onAddTask,
  onDeleteColumn,
  onRenameColumn,
  onDeleteTask,
  onSelectTask,
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onAddTask(column.id, taskTitle.trim());
    setTaskTitle('');
    setIsAddingTask(false);
  };

  const handleSaveTitle = () => {
    if (colTitle.trim() && colTitle.trim() !== column.title) {
      onRenameColumn(column.id, colTitle.trim());
    } else {
      setColTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-80 shrink-0 max-h-full rounded-2xl bg-slate-100/80 border border-slate-200/70 shadow-xs"
    >
      {/* Шапка колонки */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50">
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              autoFocus
              value={colTitle}
              onChange={(e) => setColTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') {
                  setColTitle(column.title);
                  setIsEditingTitle(false);
                }
              }}
              className="w-full rounded-lg border border-blue-400 bg-white px-2 py-1 text-xs font-bold text-slate-800 outline-none"
            />
            <button onClick={handleSaveTitle} className="text-emerald-600 hover:text-emerald-700 p-1">
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setColTitle(column.title);
                setIsEditingTitle(false);
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {column.title}
            </h3>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200/90 text-[11px] font-bold text-slate-600">
              {column.tasks.length}
            </span>
          </div>
        )}

        {/* Меню действий колонки */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setIsEditingTitle(true);
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Переименовать
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (confirm('Удалить эту колонку со всеми задачами?')) {
                    onDeleteColumn(column.id);
                  }
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Удалить
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Список задач колонки */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              onClick={() => onSelectTask(task)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Добавление задачи */}
      <div className="p-3 pt-0">
        {isAddingTask ? (
          <form onSubmit={handleCreateTask} className="space-y-2 rounded-xl bg-white p-2.5 border border-slate-200 shadow-sm">
            <textarea
              autoFocus
              placeholder="Название задачи..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateTask(e);
                }
              }}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-500"
              >
                Создать
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 transition"
          >
            <Plus className="h-4 w-4" />
            Добавить задачу
          </button>
        )}
      </div>
    </div>
  );
};