import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import {
  getProfile,
  updateProfileName,
  uploadAvatar,
  updateAvatarUrl,
  PRESET_AVATARS,
} from '../services/profile';
import { Navbar } from '../components/shared/Navbar';
import {
  ArrowLeft,
  User,
  Plus,
  Check,
  Loader2,
  Mail,
  Upload,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Состояние диалога выбора аватара
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'presets'>('menu');

  // Загрузка профиля
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const data = await getProfile(user!.id);
      setName(data.name || '');
      return data;
    },
    enabled: !!user?.id,
  });

  // Мутация сохранения имени
  const updateNameMutation = useMutation({
    mutationFn: (newName: string) => updateProfileName(user!.id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Имя профиля сохранено');
    },
    onError: (err: Error) => toast.error(err.message || 'Ошибка обновления'),
  });

  // Мутация выбора готового аватара
  const selectAvatarMutation = useMutation({
    mutationFn: (avatarUrl: string) => updateAvatarUrl(user!.id, avatarUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setIsAvatarModalOpen(false);
      setActiveTab('menu');
      toast.success('Аватар обновлен!');
    },
    onError: (err: Error) => toast.error(err.message || 'Ошибка смены аватара'),
  });

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateNameMutation.mutate(name.trim());
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 2 МБ');
      return;
    }

    try {
      setIsUploading(true);
      await uploadAvatar(user!.id, file);
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setIsAvatarModalOpen(false);
      setActiveTab('menu');
      toast.success('Фото успешно загружено!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки фото';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const openAvatarDialog = () => {
    setActiveTab('menu');
    setIsAvatarModalOpen(true);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к доскам
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Профиль пользователя</h1>
          <p className="text-xs text-slate-500 mb-6">Управление личными данными и аватаром</p>

          {/* Блок аватара */}
          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
            <div className="relative group">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden text-slate-600 shadow-xs">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name || 'Аватар'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-slate-400" />
                )}
              </div>

              {/* Кнопка с плюсиком для вызова выбора */}
              <button
                type="button"
                onClick={openAvatarDialog}
                disabled={isUploading}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-500 transition hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Сменить аватар"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-800">
                {profile?.name || 'Пользователь'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Нажмите на плюсик на аватаре, чтобы выбрать персонажа или загрузить фото
              </p>
            </div>
          </div>

          {/* Форма редактирования имени */}
          <form onSubmit={handleSaveName} className="pt-6 space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{user?.email}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Email привязан к вашей учетной записи</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Ваше имя
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Иванов"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updateNameMutation.isPending || !name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 disabled:opacity-50 transition"
              >
                {updateNameMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Сохранить имя
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Модальное окно смены аватара */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            {/* Заголовок */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {activeTab === 'presets' ? 'Выберите персонажа' : 'Сменить аватар'}
              </h3>
              <button
                onClick={() => {
                  setIsAvatarModalOpen(false);
                  setActiveTab('menu');
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Меню с двумя вариантами */}
            {activeTab === 'menu' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3.5 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50/40 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Загрузить из файлов</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Выберите фото или картинку с вашего устройства (до 2 МБ)</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className="w-full flex items-center gap-3.5 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50/40 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Выбрать готового аватара</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Коллекция готовых роботов и персонажей</p>
                  </div>
                </button>
              </div>
            )}

            {/* Галерея аватаров */}
            {activeTab === 'presets' && (
              <div>
                <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto p-1">
                  {PRESET_AVATARS.map((avatar, idx) => {
                    const isSelected = profile?.avatar_url === avatar;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectAvatarMutation.mutate(avatar)}
                        className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 p-0.5 transition hover:scale-105 active:scale-95 ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                        }`}
                        title="Выбрать"
                      >
                        <img
                          src={avatar}
                          alt={`Avatar ${idx + 1}`}
                          className="h-full w-full rounded-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex justify-between items-center pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    ← Назад к вариантам
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};