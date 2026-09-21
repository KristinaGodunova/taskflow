import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Search, Filter, X } from 'lucide-react';

interface BoardToolbarProps {
  title: string;
  membersCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  onOpenMembers: () => void;
}

export const BoardToolbar: React.FC<BoardToolbarProps> = ({
  title,
  membersCount,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  onOpenMembers,
}) => {
  return (
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
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Поиск задач */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск задач..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-40 sm:w-56 rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-7 py-1.5 text-xs text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Очистить поиск"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Фильтр по приоритету */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 outline-none"
            >
              <option value="all">Все приоритеты</option>
              <option value="low">Низкий (LOW)</option>
              <option value="medium">Средний (MEDIUM)</option>
              <option value="high">Высокий (HIGH)</option>
            </select>
          </div>

          {/* Кнопка участников */}
          <button
            onClick={onOpenMembers}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
          >
            <Users className="h-4 w-4 text-gray-500" />
            <span>Участники ({membersCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};