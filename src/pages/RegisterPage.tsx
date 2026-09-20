import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Заполните все поля');
      return;
    }
    if (password.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(email, password, name);
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message || 'Ошибка регистрации');
    } else {
      toast.success('Регистрация успешна! Добро пожаловать');
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Создать аккаунт</h1>
          <p className="mt-1 text-sm text-gray-500">Начните организовывать проекты сегодня</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Имя</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Минимум 6 символов"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};