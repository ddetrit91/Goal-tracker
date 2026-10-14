import { useTaskStore } from '@/store/useTaskStore';
import { useGoalStore } from '@/store/useGoalStore';
import { cn } from '@/utils/cn';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { Star, Check, Trash2, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task } from '@/types/task';

interface TaskItemProps {
  task: Task;
  onToggleFocus?: (id: string) => void;
}

export function TaskItem({ task, onToggleFocus }: TaskItemProps) {
  const { toggleComplete, deleteTask } = useTaskStore();
  const { goals } = useGoalStore();
  
  const parentGoal = task.goalId ? goals.find((g) => g.id === task.goalId) : null;

  const handleCheck = async () => {
    await toggleComplete(task.id);
    if (!task.isCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b'],
      });
    }
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-all hover:shadow-md',
        task.isCompleted && 'opacity-60 bg-slate-50',
        // <-- ДОБАВЛЕНО: Темная тема для карточки
        'dark:bg-slate-800 dark:border-slate-700 dark:hover:shadow-none',
        task.isCompleted && 'dark:bg-slate-800/50 dark:opacity-50'
      )}
    >
      <button
        onClick={handleCheck}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
          task.isCompleted
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-slate-300 hover:border-indigo-500',
          // <-- ДОБАВЛЕНО: Темная тема для чекбокса
          !task.isCompleted && 'dark:border-slate-600 dark:hover:border-indigo-400'
        )}
      >
        {task.isCompleted && <Check className="h-3.5 w-3.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'text-sm font-medium transition-all',
              task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900',
              // <-- ДОБАВЛЕНО: Темная тема для текста
              task.isCompleted ? 'dark:text-slate-500' : 'dark:text-slate-100'
            )}
          >
            {task.title}
          </span>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', priorityColors[task.priority])}>
            {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
          </span>
        </div>

        {parentGoal && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 dark:text-slate-400">
            <Target className="h-3 w-3" />
            <span className="truncate">{parentGoal.title}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <CategoryBadge category={task.category} size="sm" />
          {onToggleFocus && (
            <button
              onClick={() => onToggleFocus(task.id)}
              className={cn(
                'ml-auto p-1.5 rounded-full transition-colors',
                task.isDailyFocus
                  ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100',
                // <-- ДОБАВЛЕНО: Темная тема для звезды фокуса
                task.isDailyFocus 
                  ? 'dark:bg-amber-900/20 dark:hover:bg-amber-900/40' 
                  : 'dark:text-slate-500 dark:hover:text-amber-400 dark:hover:bg-slate-700'
              )}
              title="Сделать главным фокусом дня"
            >
              <Star className={cn('h-4 w-4', task.isDailyFocus && 'fill-current')} />
            </button>
          )}
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 dark:hover:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}