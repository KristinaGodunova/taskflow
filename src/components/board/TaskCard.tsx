import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types/database';
import { Trash2, GripVertical, Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onClick?: () => void;
  isOverlay?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete, onClick, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-20 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/50 opacity-60"
      />
    );
  }

  const priorityColors = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-rose-100 text-rose-700',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`group relative flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm transition hover:shadow hover:border-gray-300 cursor-pointer ${
        isOverlay ? 'rotate-2 shadow-xl ring-2 ring-blue-500 cursor-grabbing' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-800 break-words line-clamp-3">
            {task.title}
          </span>
        </div>

        {!isOverlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1"
            title="Удалить задачу"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-1 text-xs">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            priorityColors[task.priority] || priorityColors.medium
          }`}
        >
          {task.priority}
        </span>

        {task.due_date && (
          <div className="flex items-center gap-1 text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.due_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};