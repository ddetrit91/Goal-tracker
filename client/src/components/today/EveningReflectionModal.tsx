// client/src/components/today/EveningReflectionModal.tsx
import * as React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useGoalStore } from '@/store/useGoalStore';
import { toISODateString } from '@/utils/date';
import { playEveningChimeSound, triggerHaptic } from '@/utils/soundEffects';
import { X, Moon, Sparkles, CheckCircle2, Calendar, Trophy, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EveningReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EveningReflectionModal({ isOpen, onClose }: EveningReflectionModalProps) {
  const today = toISODateString(new Date());
  
  // Дата завтрашнего дня
  const tomorrow = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toISODateString(d);
  }, []);

  const { tasks, updateTask } = useTaskStore();
  const { goals } = useGoalStore();
  const [isRescheduling, setIsRescheduling] = React.useState(false);
  const [rescheduledSuccess, setRescheduledSuccess] = React.useState(false);

  const user = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const userName = user?.name || (user?.email ? user.email.split('@')[0] : '');

  // Задачи на сегодня
  const todaysTasks = tasks.filter((t) => t.dueDate === today);
  const completedTasks = todaysTasks.filter((t) => t.isCompleted);
  const incompleteTasks = todaysTasks.filter((t) => !t.isCompleted);

  // Выполненные сегодня цели
  const completedGoalsToday = goals.filter(
    (g) => g.status === 'completed' && g.completedAt && g.completedAt.startsWith(today)
  );

  // Подсчёт заработанного XP за сегодня (10 XP за задачу, 50 XP за цель)
  const earnedXP = completedTasks.length * 10 + completedGoalsToday.length * 50;

  // Процент завершения
  const completionRate = todaysTasks.length > 0 
    ? Math.round((completedTasks.length / todaysTasks.length) * 100) 
    : 100;

  if (!isOpen) return null;

  // Перенос незавершённых задач на завтра в 1 клик
  const handleRescheduleToTomorrow = async () => {
    if (incompleteTasks.length === 0) return;
    setIsRescheduling(true);
    try {
      triggerHaptic('medium');
      await Promise.all(
        incompleteTasks.map((t) => updateTask(t.id, { dueDate: tomorrow }))
      );
      setRescheduledSuccess(true);
      setTimeout(() => setRescheduledSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to reschedule tasks:', err);
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleFinishDay = () => {
    playEveningChimeSound();
    triggerHaptic('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-200/80 dark:border-indigo-900/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Декоративный глубокий вечерний градиент в шапке */}
        <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-blue-500/10 pointer-events-none" />

        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Шапка модального окна */}
        <div className="relative p-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Moon className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold mb-0.5">
                <Sparkles className="h-3 w-3" /> Вечерняя рефлексия
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {userName ? `Итоги дня, ${userName}! 🌙` : 'Итоги сегодняшнего дня! 🌙'}
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
            {completionRate === 100 && todaysTasks.length > 0
              ? '🎉 Невероятный результат! Вы закрыли абсолютно все задачи дня. Время полноценно отдохнуть и восстановить силы!'
              : completionRate >= 60
              ? '💪 Отличный продуктивный день! Вы проделали огромную работу и стали ближе к главным целям.'
              : '🌱 Каждый шаг имеет значение. Даже небольшое действие двигает вас вперёд. Спокойно подведите итоги.'}
          </p>
        </div>

        {/* Статистика дня (виджеты) */}
        <div className="px-6 py-2 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {completedTasks.length} / {todaysTasks.length}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Задач закрыто
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
              <Trophy className="h-4 w-4" />
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300">
              +{earnedXP} XP
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Опыт дня
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-center">
            <div className="flex items-center justify-center gap-1 text-indigo-500 mb-1">
              <Zap className="h-4 w-4" />
            </div>
            <div className="text-lg sm:text-xl font-black text-indigo-700 dark:text-indigo-300">
              {completionRate}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Успешность
            </div>
          </div>
        </div>

        {/* Незавершённые задачи и опция переноса */}
        <div className="px-6 py-3 overflow-y-auto space-y-3 flex-1 min-h-0">
          {incompleteTasks.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  Остались незавершённые задачи ({incompleteTasks.length}):
                </label>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {incompleteTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between"
                  >
                    <span className="truncate pr-2">{task.title}</span>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-400">Сегодня</span>
                  </div>
                ))}
              </div>

              {/* Кнопка переноса всех незавершённых задач на завтра */}
              <button
                type="button"
                onClick={handleRescheduleToTomorrow}
                disabled={isRescheduling}
                className={cn(
                  "w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm",
                  rescheduledSuccess
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                )}
              >
                <Calendar className="h-4 w-4" />
                {rescheduledSuccess
                  ? '✓ Задачи успешно перенесены на завтра!'
                  : isRescheduling
                  ? 'Переносим задачи...'
                  : `Перенести ${incompleteTasks.length} незавершённых задач на завтра (в 1 клик)`}
              </button>
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Все задачи на сегодня выполнены!
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                Никаких долгов и хвостов. Вы отлично потрудились!
              </p>
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Закрыть
          </button>

          <button
            type="button"
            onClick={handleFinishDay}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2"
          >
            ✨ Завершить день и отдохнуть
          </button>
        </div>
      </div>
    </div>
  );
}
