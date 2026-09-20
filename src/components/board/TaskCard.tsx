import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TaskWithAssignee } from '../../services/boardDetail';
import { Trash2, GripVertical, Clock, User } from 'lucide-react';

interface TaskCardProps {
  task: TaskWithAssignee;
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
        className="h-24 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/50 opacity-60"
      />
    );
  }

  const priorityStyles = {
    low: {
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      label: 'LOW',
    },
    medium: {
      dot: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
      label: 'MEDIUM',
    },
    high: {
      dot: 'bg-rose-500',
      badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
      label: 'HIGH',
    },
  };

  const pConfig = priorityStyles[task.priority] || priorityStyles.medium;

  // Форматирование даты и времени по локальному времени пользователя
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const dayMonth = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${dayMonth} ${time}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`group relative flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-slate-300 hover:shadow-md cursor-pointer ${
        isOverlay ? 'rotate-1 scale-105 shadow-xl ring-2 ring-blue-500 cursor-grabbing bg-white' : ''
      }`}
    >
      {/* Верхняя строка: Заголовок и кнопка удаления */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab text-slate-300 hover:text-slate-600 active:cursor-grabbing p-0.5 mt-0.5"
            title="Перетащить"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <p className="text-sm font-semibold text-slate-800 break-words line-clamp-2 leading-snug">
            {task.title}
          </p>
        </div>

        {!isOverlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition p-1 rounded hover:bg-rose-50"
            title="Удалить задачу"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Описание задачи (если есть) */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 pl-5">
          {task.description}
        </p>
      )}

      {/* Нижняя панель: Приоритет, Дата со временем и Ответственный */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs gap-2">
        <div className="flex items-center gap-2">
          {/* Бейдж приоритета */}
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${pConfig.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${pConfig.dot}`} />
            {pConfig.label}
          </span>

          {/* Дата и время дедлайна */}
          {task.due_date && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500" title="Срок выполнения">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{formatDateTime(task.due_date)}</span>
            </div>
          )}
        </div>

        {/* Ответственный исполнитель */}
        {task.assignee ? (
          <div
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-0.5 pr-2"
            title={`Исполнитель: ${task.assignee.name || 'Пользователь'}`}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 overflow-hidden shrink-0">
              {task.assignee.avatar_url ? (
                <img
                  src={task.assignee.avatar_url}
                  alt={task.assignee.name || 'Аватар'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-3 w-3 text-slate-500" />
              )}
            </div>
            <span className="text-[11px] font-medium text-slate-700 max-w-[80px] truncate">
              {task.assignee.name || 'Участник'}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};