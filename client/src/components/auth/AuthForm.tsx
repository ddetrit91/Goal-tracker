// client/src/components/auth/AuthForm.tsx
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { SERVER_URL } from '@/config/api';

interface AuthFormProps {
  type: 'login' | 'register';
}

export function AuthForm({ type }: AuthFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: type === 'register' ? (formData.get('name') as string) : undefined,
    };

    try {
      const endpoint = type === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(`${SERVER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Произошла ошибка');

      // Сохраняем данные пользователя в localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Перенаправляем на главную страницу приложения
      navigate('/today');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {type === 'register' ? 'Создать аккаунт' : 'Вход в систему'}
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {type === 'register' 
            ? 'Начни отслеживать свои цели уже сегодня' 
            : 'Добро пожаловать обратно!'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'register' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Имя</label>
            <input
              name="name"
              type="text"
              required={type === 'register'}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              placeholder="Как к тебе обращаться?"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Пароль</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              placeholder="Минимум 6 символов"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : null}
          {type === 'register' ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        {type === 'register' ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
        <a
          href={type === 'register' ? '/login' : '/register'}
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          {type === 'register' ? 'Войти' : 'Зарегистрироваться'}
        </a>
      </p>
    </div>
  );
}