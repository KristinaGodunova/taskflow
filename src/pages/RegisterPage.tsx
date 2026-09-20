import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { toast } from 'sonner';
import { Loader2, UserPlus, MailCheck, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessConfirmation, setIsSuccessConfirmation] = useState(false);
  const { signUp } = useAuth();

  // Валидация формата email
  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error('Заполните все поля');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Введите корректный адрес электронной почты');
      return;
    }

    if (password.length < 6) {
      toast.error('Пароль должен содержать не менее 6 символов');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(email.trim(), password, name.trim());
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message || 'Ошибка регистрации');
    } else {
      // Показываем экран с просьбой подтвердить email
      setIsSuccessConfirmation(true);
      toast.success('Письмо с подтверждением отправлено!');
    }
  };

  // Экран успешной отправки письма
  if (isSuccessConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <MailCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Проверьте вашу почту</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Мы отправили ссылку для подтверждения аккаунта на адрес:
          </p>
          <div className="mt-2 inline-block rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">
            {email}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Перейдите по ссылке из письма, чтобы активировать аккаунт и войти в систему.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 transition"
            >
              <span>Перейти на страницу входа</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Создать аккаунт</h1>
          <p className="mt-1 text-sm text-slate-500">Начните работу с TaskFlow</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Ваше имя</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
              placeholder="Минимум 6 символов"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 disabled:opacity-50 transition"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};