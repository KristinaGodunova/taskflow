import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { getBoards, createBoard, deleteBoard } from '../services/boards';
import { Navbar } from '../components/shared/Navbar';
import { Plus, Trash2, LayoutGrid, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/errors';

export const BoardsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');

  // Запрос списка досок
  const { data: boards = [], isLoading, isError } = useQuery({
    queryKey: ['boards', user?.id],
    queryFn: () => getBoards(user!.id),
    enabled: !!user?.id,
  });

  // Мутация создания доски
  const createMutation = useMutation({
    mutationFn: (title: string) => createBoard(title, user!.id),
    onSuccess: (newBoard) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setIsModalOpen(false);
      setBoardTitle('');
      toast.success('Доска успешно создана');
      navigate(`/boards/${newBoard.id}`);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Мутация удаления доски
  const deleteMutation = useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Доска удалена');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardTitle.trim()) return;
    createMutation.mutate(boardTitle.trim());
  };

  const handleDeleteBoard = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation(); // чтобы не открывался переход на доску
    if (confirm('Вы уверены, что хотите удалить эту доску? Все задачи будут потеряны.')) {
      deleteMutation.mutate(boardId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Мои доски</h1>
            <p className="text-sm text-gray-500">Выберите доску для работы или создайте новую</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Создать доску
          </button>
        </div>

        {/* Состояние загрузки (Скелетоны по п. 1.5) */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        )}

        {/* Состояние ошибки */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            Не удалось загрузить доски. Попробуйте обновить страницу.
          </div>
        )}

        {/* Список досок */}
        {!isLoading && !isError && (
          <>
            {boards.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                <LayoutGrid className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-semibold text-gray-900">У вас пока нет досок</h3>
                <p className="mt-1 text-sm text-gray-500">Создайте первую доску, чтобы начать работу</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  <Plus className="h-4 w-4" />
                  Создать новую доску
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {boards.map((board) => (
                  <div
                    key={board.id}
                    onClick={() => navigate(`/boards/${board.id}`)}
                    className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-300 cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                          {board.title}
                        </h3>
                        {board.owner_id === user?.id && (
                          <button
                            onClick={(e) => handleDeleteBoard(e, board.id)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                            title="Удалить доску"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <span className="inline-block mt-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {board.owner_id === user?.id ? 'Владелец' : 'Участник'}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(board.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Модальное окно создания доски */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Новая доска</h2>
            <form onSubmit={handleCreateBoard} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Название доски</label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Например: Разработка мобильного приложения"
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !boardTitle.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-500 disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};