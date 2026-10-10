import * as React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { DailyFocus } from '@/components/today/DailyFocus';
import { TaskItem } from '@/components/today/TaskItem';
import { QuickTaskInput } from '@/components/today/QuickTaskInput';
import { toISODateString, formatDate } from '@/utils/date';
import { CalendarDays } from 'lucide-react';

export function TodayPage() {
  const today = toISODateString(new Date());
  const { tasks, fetchTasks } = useTaskStore();

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const todaysTasks = tasks.filter((t) => t.dueDate === today);
  const nonFocusTasks = todaysTasks.filter((t) => !t.isDailyFocus || t.isCompleted);

  return (
    <div className="max-w-3xl mx-auto p-6 pb-24 md:pb-6">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {/* Добавлен dark:text-indigo-400 для иконки */}
          <CalendarDays className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          <div>
            {/* Добавлен dark:text-white для заголовка */}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Сегодня</h1>
            {/* Добавлен dark:text-slate-400 для даты */}
            <p className="text-slate-500 dark:text-slate-400">{formatDate(today, 'EEEE, d MMMM yyyy')}</p>
          </div>
        </div>
      </header>

      <DailyFocus />

      <section>
        <div className="flex items-center justify-between mb-4">
          {/* Добавлен dark:text-slate-200 для подзаголовка */}
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200">Все задачи дня</h2>
          {/* Добавлены dark:bg-slate-800 и dark:text-slate-300 для счетчика */}
          <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full dark:bg-slate-800 dark:text-slate-300">
            {todaysTasks.length}
          </span>
        </div>

        <QuickTaskInput />

        {nonFocusTasks.length === 0 ? (
          // Добавлены dark:bg-slate-900, dark:border-slate-700, dark:text-slate-400 для пустого состояния
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 dark:bg-slate-900 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">На сегодня больше нет задач. Отличная работа!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {nonFocusTasks.map((task) => (
              <li key={task.id}>
                <TaskItem task={task} onToggleFocus={useTaskStore.getState().toggleDailyFocus} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}