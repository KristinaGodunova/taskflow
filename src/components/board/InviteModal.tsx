import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteMemberByEmail, removeMember, type BoardMemberInfo } from '../../services/taskModal';
import { getErrorMessage } from '../../utils/errors';
import { X, UserPlus, Shield, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InviteModalProps {
  boardId: string;
  members: BoardMemberInfo[];
  isOwner: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ boardId, members, isOwner, onClose }) => {
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: (emailToInvite: string) => inviteMemberByEmail(boardId, emailToInvite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-members', boardId] });
      setEmail('');
      toast.success('Участник успешно добавлен на доску!');
    },
    onError: (err: Error) => toast.error(err.message || 'Ошибка приглашения'),
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate(email.trim());
  };
const removeMutation = useMutation({
  mutationFn: (userId: string) => removeMember(boardId, userId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['board-members', boardId] });
    toast.success('Участник удалён');
  },
  onError: (error: unknown) => toast.error(getErrorMessage(error)),
});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900">Участники доски</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Форма приглашения (только овнер) */}
        {isOwner ? (
          <form onSubmit={handleInvite} className="mt-4 flex gap-2">
            <input
              type="email"
              placeholder="Email пользователя..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={inviteMutation.isPending || !email.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-50"
            >
              {inviteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Пригласить
            </button>
          </form>
        ) : (
          <p className="mt-3 text-xs text-gray-500">Приглашать участников может только владелец доски</p>
        )}

        {/* Список текущих участников */}
        <div className="mt-5 space-y-2.5 max-h-60 overflow-y-auto">
          {members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5 border border-gray-100"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-blue-600">
  {m.profile.avatar_url ? (
    <img src={m.profile.avatar_url} alt="" className="h-full w-full object-cover" />
  ) : (
    <User className="h-4 w-4" />
  )}
</div>

                <span className="text-sm font-medium text-gray-800">
                  {m.profile.name || 'Пользователь'}
                </span>
              </div>
              <div className="flex items-center gap-2">
  <span className="flex items-center gap-1 rounded bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-gray-600">
    {m.role === 'owner' && <Shield className="h-3 w-3 text-amber-600" />}
    {m.role === 'owner' ? 'Владелец' : 'Участник'}
  </span>
  {isOwner && m.role !== 'owner' && (
    <button
      onClick={() => {
        if (confirm('Удалить участника с доски?')) removeMutation.mutate(m.user_id);
      }}
      disabled={removeMutation.isPending}
      className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      title="Удалить участника"
    >
      <X className="h-4 w-4" />
    </button>
  )}
</div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};