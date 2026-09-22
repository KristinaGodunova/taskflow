import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { getProfile } from '../../services/profile';
import { KanbanSquare, LogOut, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user?.id,
  });

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Пользователь';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Логотип */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs transition group-hover:bg-blue-700">
            <KanbanSquare className="h-4 w-4" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-base">
            TaskFlow
          </span>
        </Link>

        {/* Профиль и выход */}
        <div className="flex items-center gap-3">
          {/* Ссылка на профиль с чистым аватаром без синей подложки */}
          <Link
            to="/profile"
            className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 hover:bg-slate-100 hover:border-slate-300 transition"
            title="Перейти в профиль"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-3.5 w-3.5 text-slate-500" />
              )}
            </div>
            <span className="text-xs font-medium text-slate-700 max-w-[140px] truncate">
              {displayName}
            </span>
          </Link>

          <button
            onClick={handleSignOut}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            title="Выйти из аккаунта"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </div>
    </header>
  );
};