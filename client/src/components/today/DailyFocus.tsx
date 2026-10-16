import * as React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useGoalStore } from '@/store/useGoalStore';
import { TaskItem } from '@/components/today/TaskItem';
import { TaskEditModal } from '@/components/goals/TaskEditModal';
import { Star, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Task } from '@/types/task';

export function DailyFocus() {
  const { tasks, toggleDailyFocus } = useTaskStore();
  const { goals } = useGoalStore();
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  
  // Получаем фокус-задачи (все выбранные в фокус дня)
  const focusTasks = tasks.filter(t => t.isDailyFocus);

  // Получаем цели, выбранные как "Цель дня" (Фокус дня)
  const todayGoals = goals.filter(g => g.isTodayGoal && !g.parentId);

  // Количество выполненных фокус-задач и фокус-целей
  const completedFocusTasks = focusTasks.filter(t => t.isCompleted).length;
  const completedFocusGoals = todayGoals.filter(g => g.status === 'completed').length;
  const completedCount = completedFocusTasks + completedFocusGoals;

  const maxFocus = 3;
  const activeFocusTasksCount = focusTasks.filter(t => !t.isCompleted).length;
  const canAddMore = activeFocusTasksCount < maxFocus;
  const isAllFocusCompleted = completedCount >= maxFocus;

  return (
    <div className={cn(
      "rounded-xl border p-5 mb-8 transition-colors",
      // Светлая тема
      "bg-slate-100 border-slate-200",
      // Темная тема
      "dark:bg-slate-800 dark:border-slate-700"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-indigo-600 fill-indigo-600 dark:text-indigo-400 dark:fill-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Главные фокусы дня</h2>
        </div>
        
        {/* Счетчик выполненных фокусов дня: 1/3, потом 2/3 и 3/3 */}
        <span className={cn(
          "text-xs font-bold px-2.5 py-1 rounded-full transition-colors",
          completedCount >= maxFocus
            ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700"
            : completedCount > 0
            ? "bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800"
            : "bg-white text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"
        )}>
          {completedCount} / {maxFocus}
        </span>
      </div>

      {focusTasks.length === 0 ? (
        <p className="text-sm text-slate-500 italic dark:text-slate-400">
          Выберите до 3 ключевых задач (⭐) или фокусов дня, чтобы сделать день продуктивным.
        </p>
      ) : (
        <ul className="space-y-2">
          {focusTasks.map(task => (
            <li key={task.id}>
              <TaskItem 
                task={task} 
                onToggleFocus={toggleDailyFocus} 
                onEdit={(t) => setEditingTask(t)}
              />
            </li>
          ))}
        </ul>
      )}

      {isAllFocusCompleted && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="font-medium">Все главные фокусы дня выполнены! Отличная работа! 🎉</p>
        </div>
      )}

      {!canAddMore && !isAllFocusCompleted && (
        <div className="mt-4 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg dark:bg-amber-900/20 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Лимит фокуса достигнут. Завершите одну из задач или уберите её из фокуса, чтобы добавить новую.</p>
        </div>
      )}

      {/* Модальное окно редактирования задачи */}
      <TaskEditModal 
        isOpen={!!editingTask} 
        onClose={() => setEditingTask(null)} 
        task={editingTask} 
      />
    </div>
  );
}