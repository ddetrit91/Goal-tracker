// client/src/components/auth/ForgotPasswordModal.tsx
import * as React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { KeyRound, Mail, Lock, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { API_BASE } from '@/config/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSuccess?: () => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  defaultEmail = '',
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = React.useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = React.useState(defaultEmail);
  const [code, setCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [generatedCode, setGeneratedCode] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setStep('request');
      setEmail(defaultEmail);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setGeneratedCode(null);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, defaultEmail]);

  // Шаг 1: Запрос кода
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при отправке запроса');
      }

      setGeneratedCode(data.code || null);
      if (data.code) {
        setCode(data.code);
      }
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Не удалось запросить код сброса');
    } finally {
      setIsLoading(false);
    }
  };

  // Шаг 2: Установка нового пароля
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Введённые пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при изменении пароля');
      }

      setSuccessMsg(data.message || 'Пароль успешно изменён!');
      setStep('done');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Восстановление доступа">
      <div className="py-2">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'request' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300">
              <KeyRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Забыли пароль?</p>
                <p className="text-indigo-700/80 dark:text-indigo-400/80">
                  Укажите email вашей учетной записи, и мы сгенерируем код для создания нового пароля.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" isLoading={isLoading} className="gap-2">
                Получить код
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {generatedCode && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-300">
                <span className="font-semibold block mb-0.5">Код подтверждения сформирован:</span>
                <span className="text-base font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                  {generatedCode}
                </span>
                <span className="block mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  (код уже подставлен в форму ниже, действует 15 минут)
                </span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">6-значный код</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Например, 123456"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Новый пароль</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Повторите пароль</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep('request')}>
                ← Назад
              </Button>
              <Button type="submit" isLoading={isLoading} className="gap-2">
                Сохранить пароль
              </Button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center py-4 space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Пароль успешно обновлён!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {successMsg || 'Теперь вы можете войти в свой аккаунт с новым паролем.'}
              </p>
            </div>
            <Button onClick={onClose} className="w-full">
              Понятно, войти
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
