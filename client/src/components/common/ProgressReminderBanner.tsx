// client/src/components/common/ProgressReminderBanner.tsx
import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, ArrowRight, Zap } from 'lucide-react';
import { checkInactivityReminder } from '@/utils/activityReminder';

export function ProgressReminderBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reminder, setReminder] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Не показываем на странице входа/регистрации
    if (['/login', '/register'].includes(location.pathname)) {
      setReminder(null);
      return;
    }

    const user = localStorage.getItem('user');
    if (!user) return;

    // Проверяем при монтировании и при возвращении на вкладку (visibilitychange)
    const check = () => {
      const result = checkInactivityReminder();
      if (result.shouldRemind && result.message) {
        setReminder(result.message);
      }
    };

    check();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [location.pathname]);

  if (!reminder) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md border border-indigo-500/30 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 relative">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
          <Zap className="h-5 w-5 text-amber-300" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1.5">
            <span>Продолжай движение!</span>
          </p>
          <p className="text-xs text-slate-200 leading-relaxed font-medium mb-3">
            {reminder}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setReminder(null);
                navigate('/today');
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>К задачам дня</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setReminder(null)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Позже
            </button>
          </div>
        </div>

        <button
          onClick={() => setReminder(null)}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          title="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
