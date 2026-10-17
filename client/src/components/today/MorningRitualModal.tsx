// client/src/components/today/MorningRitualModal.tsx
import * as React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { toISODateString } from '@/utils/date';
import { playFrogFocusSound, triggerHaptic } from '@/utils/soundEffects';
import { X, Sun, Sparkles, Check, Plus, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import confetti from 'canvas-confetti';

interface MorningRitualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MorningRitualModal({ isOpen, onClose }: MorningRitualModalProps) {
  const today = toISODateString(new Date());
  const { tasks, toggleDailyFocus, createTask } = useTaskStore();
  const [newTitle, setNewTitle] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  const user = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const userName = user?.name || (user?.email ? user.email.split('@')[0] : '');

  // Невыполненные задачи на сегодня
  const todaysIncompleteTasks = tasks.filter(
    (t) => t.dueDate === today && !t.isCompleted
  );

  if (!isOpen) return null;

  const handleSelectTask = async (taskId: string) => {
    playFrogFocusSound();
    triggerHaptic('medium');
    await toggleDailyFocus(taskId);
  };

  const handleCreateFocusTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setIsCreating(true);
    try {
      playFrogFocusSound();
      triggerHaptic('medium');
      await createTask({
        title: trimmed,
        description: '',
        horizon: 'daily',
        category: 'custom',
        dueDate: today,
        isCompleted: false,
        completedAt: null,
        priority: 'high',
        estimatedMinutes: null,
        isRecurring: false,
        recurrenceRule: null,
        isDailyFocus: true,
        tags: ['frog'],
        goalId: null,
      });
      setNewTitle('');
    } catch (err) {
      console.error('Failed to create focus task:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleReadyToConquer = () => {
    try {
      playFrogFocusSound();
      triggerHaptic('success');
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#6366f1', '#f59e0b'],
      });
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-200/80 dark:border-amber-900/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Декоративный градиентный фон в шапке */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-amber-400/20 via-orange-400/15 to-indigo-500/10 pointer-events-none" />

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Sun className="h-6 w-6 animate-spin-slow" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-bold mb-0.5">
                <Sparkles className="h-3 w-3" /> Утренний ритуал
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {userName ? `Доброе утро, ${userName}! ☀️` : 'Доброе утро! ☀️'}
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2 bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
            <span className="font-bold text-amber-700 dark:text-amber-300">Eat That Frog 🐸:</span> Выберите 1 главное действие на сегодня. Сделайте его в первую очередь — и день гарантированно станет победным!
          </p>
        </div>

        {/* Контент: список задач на сегодня */}
        <div className="px-6 py-2 overflow-y-auto space-y-3 flex-1 min-h-0">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Выберите главную цель из списка:
          </label>

          {todaysIncompleteTasks.length === 0 ? (
            <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">На сегодня ещё нет задач.</p>
              <p className="text-xs text-slate-400 mt-1">Добавьте ключевое действие прямо сейчас ниже 👇</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaysIncompleteTasks.map((task) => {
                const isSelected = task.isDailyFocus;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleSelectTask(task.id)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group",
                      isSelected
                        ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 dark:from-amber-950/40 dark:to-orange-950/30 dark:border-amber-700 shadow-sm ring-2 ring-amber-400/50"
                        : "bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-750"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0 select-none">
                        {isSelected ? '🐸' : '⚪'}
                      </span>
                      <div className="min-w-0">
                        <p className={cn(
                          "text-sm font-semibold truncate",
                          isSelected ? "text-amber-900 dark:text-amber-200" : "text-slate-800 dark:text-slate-200"
                        )}>
                          {task.title}
                        </p>
                        {isSelected && (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            Главная «лягушка» дня
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow">
                          <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 group-hover:border-amber-400 group-hover:text-amber-500 transition-colors">
                          <Star className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Быстрое добавление новой фокусной задачи */}
          <form onSubmit={handleCreateFocusTask} className="pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
              Или введите новую супер-задачу:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Например: Дописать отчёт до 13:00..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                type="submit"
                disabled={!newTitle.trim() || isCreating}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" /> Добавить
              </button>
            </div>
          </form>
        </div>

        {/* Футер */}
        <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Решу позже
          </button>

          <button
            type="button"
            onClick={handleReadyToConquer}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2"
          >
            🚀 В бой! Фокус готов
          </button>
        </div>
      </div>
    </div>
  );
}
