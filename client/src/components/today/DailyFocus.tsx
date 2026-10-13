import * as React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { Star, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export function DailyFocus() {
  const { tasks, toggleDailyFocus } = useTaskStore();
  
  // Получаем только активные фокус-задачи (не выполненные)
  const focusTasks = tasks.filter(t => t.isDailyFocus && !t.isCompleted);
  const maxFocus = 3;
  const canAddMore = focusTasks.length < maxFocus;

  return (
    <div className={cn(
      "rounded-xl border p-5 mb-8 transition-colors",
      // Светлая тема
      "bg-slate-100 border-slate-200",
      // Темная тема <-- ДОБАВЛЕНО
      "dark:bg-slate-800 dark:border-slate-700"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-indigo-600 fill-indigo-600 dark:text-indigo-400 dark:fill-indigo-400" />
          {/* <-- ДОБАВЛЕНО: dark:text-white для заголовка */}
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Главные фокусы дня</h2>
        </div>
        
        {/* Счетчик фокусов */}
        <span className={cn(
          "text-xs font-bold px-2.5 py-1 rounded-full",
          "bg-white text-indigo-700 border border-indigo-100",
          // Темная тема для счетчика
          "dark:bg-slate-900 dark:text-indigo-300 dark:border-indigo-900/50"
        )}>
          {focusTasks.length} / {maxFocus}
        </span>
      </div>

      {focusTasks.length === 0 ? (
        <p className="text-sm text-slate-500 italic dark:text-slate-400">
          Выберите до 3 ключевых задач, чтобы сделать день продуктивным.
        </p>
      ) : (
        <ul className="space-y-2">
          {focusTasks.map(task => (
            <li key={task.id} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              {task.title}
            </li>
          ))}
        </ul>
      )}

      {!canAddMore && (
        <div className="mt-4 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg dark:bg-amber-900/20 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Лимит фокуса достигнут. Завершите одну из задач или уберите её из фокуса, чтобы добавить новую.</p>
        </div>
      )}
    </div>
  );
}