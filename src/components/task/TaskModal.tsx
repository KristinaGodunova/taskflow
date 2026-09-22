import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import {
  updateTaskDetails,
  getTaskComments,
  addComment,
  deleteComment,
  type BoardMemberInfo,
} from '../../services/taskModal';
import type { PriorityType } from '../../types/database';
import type { TaskWithAssignee } from '../../services/boardDetail';
import { getErrorMessage } from '../../utils/errors';
import {
  X,
  Calendar,
  User,
  Flag,
  MessageSquare,
  Trash2,
  Send,
  Loader2,
  AlignLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface TaskModalProps {
  task: TaskWithAssignee;
  members: BoardMemberInfo[];
  boardId: string;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, members, boardId, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [onClose]);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<PriorityType>(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.slice(0, 10) : '');
  const [assigneeId, setAssigneeId] = useState(task.assignee_id || '');
  const [commentText, setCommentText] = useState('');

  // Запрос комментариев
  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['comments', task.id],
    queryFn: () => getTaskComments(task.id),
  });

  // Единая мутация обновления задачи с гарантированным onError
  const updateTaskMutation = useMutation({
    mutationFn: (updates: {
      title?: string;
      description?: string | null;
      priority?: PriorityType;
      due_date?: string | null;
      assignee_id?: string | null;
    }) => updateTaskDetails(task.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Сохранено');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Мутация добавления комментария
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => addComment(task.id, user!.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', task.id] });
      setCommentText('');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Мутация удаления комментария
  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', task.id] });
      toast.success('Комментарий удален');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleBlurSave = () => {
  const nextTitle = title.trim();
  const nextDescription = description.trim() || null;

  if (!nextTitle) {
    setTitle(task.title);
    return;
  }
  if (nextTitle === task.title && nextDescription === (task.description || null)) return;

  updateTaskMutation.mutate({ title: nextTitle, description: nextDescription });
};


  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim());
  };

  // Сегодняшняя дата в формате YYYY-MM-DD для запрета выбора прошедших дат
  const todayDate = new Date().toISOString().slice(0, 10);

  return (
    <div
  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
  onClick={(e) => {
    if (e.target === e.currentTarget) onClose();
  }}
>

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-200">
        
        {/* Шапка модального окна */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50/70">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlurSave}
            className="w-full text-base font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 bg-transparent hover:bg-white transition"
            placeholder="Название задачи"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Тело модального окна */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Левая колонка */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <AlignLeft className="h-3.5 w-3.5" />
                <span>Описание</span>
              </div>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleBlurSave}
                placeholder="Добавьте описание задачи (сохраняется автоматически при клике вне поля)..."
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition resize-y"
              />
            </div>

            {/* Комментарии */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-3">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Комментарии</span>
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Написать комментарий..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>

              <div className="space-y-2.5">
                {loadingComments ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Комментариев пока нет</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
  <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200">
    {c.profile?.avatar_url ? (
      <img src={c.profile.avatar_url} alt="" className="h-full w-full object-cover" />
    ) : (
      <User className="h-3 w-3 text-slate-500" />
    )}
  </div>
  <span className="text-xs font-semibold text-slate-800">
    {c.profile?.name || 'Пользователь'}
  </span>
</div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            {new Date(c.created_at).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                          {c.user_id === user?.id && (
                            <button
                              onClick={() => deleteCommentMutation.mutate(c.id)}
                              className="text-slate-400 hover:text-rose-600 transition"
                              title="Удалить"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Правая колонка: Свойства (строго тип date) */}
          <div className="space-y-4 rounded-xl bg-slate-50 p-4 border border-slate-200/70 h-fit">
            
            {/* Приоритет */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                <Flag className="h-3.5 w-3.5 text-slate-500" />
                Приоритет
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  const val = e.target.value as PriorityType;
                  setPriority(val);
                  updateTaskMutation.mutate({ priority: val });
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none shadow-2xs focus:border-blue-500"
              >
                <option value="low">Низкий (Low)</option>
                <option value="medium">Средний (Medium)</option>
                <option value="high">Высокий (High)</option>
              </select>
            </div>

            {/* Дедлайн строго в формате date */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Дедлайн
              </label>
              <input
                type="date"
                min={todayDate}
                value={dueDate}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setDueDate(e.target.value);
                  updateTaskMutation.mutate({ due_date: val });
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none shadow-2xs focus:border-blue-500"
              />
            </div>

            {/* Исполнитель */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                Исполнитель
              </label>
              <select
                value={assigneeId}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setAssigneeId(e.target.value);
                  updateTaskMutation.mutate({ assignee_id: val });
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none shadow-2xs focus:border-blue-500"
              >
                <option value="">Не назначен</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profile.name || m.user_id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};