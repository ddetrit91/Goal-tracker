import * as React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { TaskItem } from './TaskItem';
import { Star } from 'lucide-react';
import { toISODateString } from '@/utils/date';

export function DailyFocus() {
  const today = toISODateString(new Date());
  const { tasks, toggleDailyFocus } = useTaskStore();
  
  // Получаем задачи, которые являются фокусом дня и еще не выполнены
  const focusTasks = tasks.filter(
    (t) => t.dueDate === today && t.isDailyFocus && !t.isCompleted
  );

  return (
    <div className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50/50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-indigo-600 fill-indigo-600" />
        <h2 className="text-lg font-bold text-slate-900">Главные фокусы дня</h2>
        <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
          {focusTasks.length} / 3
        </span>
      </div>

      {focusTasks.length === 0 ? (
        <p className="text-sm text-slate-500 italic">
          Выберите до 3 ключевых задач, чтобы сделать день продуктивным.
        </p>
      ) : (
        <ul className="space-y-3">
          {focusTasks.map((task) => (
            <li key={task.id}>
              <TaskItem task={task} onToggleFocus={toggleDailyFocus} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}