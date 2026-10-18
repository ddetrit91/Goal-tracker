import * as React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useGoalStore } from '@/store/useGoalStore';
import { cn } from '@/utils/cn';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { Star, Check, Trash2, Target, Pencil, Copy, Timer, GripVertical } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task } from '@/types/task';
import { calculateTaskXP } from '@/utils/gamification';
import { playTaskCompleteSound, playTaskUncheckSound, triggerHaptic } from '@/utils/soundEffects';

interface TaskItemProps {
  task: Task;
  onToggleFocus?: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
  // Drag and drop props
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
  onDragOver?: (e: React.DragEvent, task: Task) => void;
  onDragLeave?: (e: React.DragEvent, task: Task) => void;
  onDrop?: (e: React.DragEvent, task: Task) => void;
  isDragOver?: boolean;
  isDragging?: boolean;
}

export function TaskItem({ 
  task, 
  onToggleFocus, 
  onEdit, 
  onDuplicate, 
  onStartFocus,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver = false,
  isDragging = false,
}: TaskItemProps) {
  const { toggleComplete, deleteTask, createTask } = useTaskStore();
  const { goals } = useGoalStore();
  const [floatingXP, setFloatingXP] = React.useState<number | null>(null);
  
  const parentGoal = task.goalId ? goals.find((g) => g.id === task.goalId) : null;

  const handleDuplicate = async () => {
    if (onDuplicate) {
      onDuplicate(task);
      return;
    }
    try {
      await createTask({
        title: `${task.title} (копия)`,
        description: task.description || '',
        horizon: task.horizon,
        goalId: task.goalId,
        category: task.category,
        dueDate: task.dueDate,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        isRecurring: task.isRecurring,
        recurrenceRule: task.recurrenceRule,
        isCompleted: false,
        completedAt: null,
        isDailyFocus: task.isDailyFocus,
        tags: task.tags || [],
      });
      window.dispatchEvent(
        new CustomEvent('show-toast', { detail: { message: 'Задача продублирована!' } })
      );
    } catch (err: any) {
      console.error('Duplicate task failed:', err);
      window.dispatchEvent(
        new CustomEvent('show-toast', { detail: { message: 'Не удалось продублировать задачу' } })
      );
    }
  };

  const handleCheck = async () => {
    const willBeCompleted = !task.isCompleted;
    if (willBeCompleted) {
      playTaskCompleteSound();
      triggerHaptic('light');

      const earned = calculateTaskXP(task);
      setFloatingXP(earned);
      setTimeout(() => setFloatingXP(null), 1800);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b'],
      });
    } else {
      playTaskUncheckSound();
      triggerHaptic('light');
    }

    try {
      await toggleComplete(task.id);
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
    }
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  };

  return (
    <div
      draggable={isDraggable && !task.isCompleted}
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragOver={(e) => onDragOver?.(e, task)}
      onDragLeave={(e) => onDragLeave?.(e, task)}
      onDrop={(e) => onDrop?.(e, task)}
      className={cn(
        'group flex items-start gap-2.5 sm:gap-3 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 transition-all hover:shadow-md relative',
        task.isCompleted && 'opacity-65 bg-slate-50/80',
        'dark:bg-slate-800 dark:border-slate-700 dark:hover:shadow-none',
        task.isCompleted && 'dark:bg-slate-800/40 dark:opacity-60',
        isDragging && 'opacity-25 border-dashed border-indigo-400 scale-[0.98]',
        isDragOver && 'border-t-2 border-t-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
      )}
    >
      {/* Ручка перетаскивания (Grip) для активных задач */}
      {isDraggable && !task.isCompleted && (
        <div 
          className="shrink-0 -ml-1 text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing transition-colors pt-0.5"
          title="Потяните для изменения порядка"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      <div className="relative shrink-0 mt-0.5">
        <button
          onClick={handleCheck}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded border transition-colors',
            task.isCompleted
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 hover:border-indigo-500',
            // <-- ДОБАВЛЕНО: Темная тема для чекбокса
            !task.isCompleted && 'dark:border-slate-600 dark:hover:border-indigo-400'
          )}
        >
          {task.isCompleted && <Check className="h-3.5 w-3.5" />}
        </button>

        {floatingXP !== null && (
          <span className="absolute -top-7 -left-1 z-30 pointer-events-none px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-black text-[11px] shadow-lg shadow-indigo-500/40 animate-bounce whitespace-nowrap flex items-center gap-1">
            +{floatingXP} XP ✨
          </span>
        )}
      </div>

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
          <div className="ml-auto flex items-center gap-1">
            {onToggleFocus && (
              <button
                onClick={() => onToggleFocus(task.id)}
                className={cn(
                  'p-1.5 rounded-full transition-colors',
                  task.isDailyFocus
                    ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100',
                  task.isDailyFocus 
                    ? 'dark:bg-amber-900/20 dark:hover:bg-amber-900/40' 
                    : 'dark:text-slate-500 dark:hover:text-amber-400 dark:hover:bg-slate-700'
                )}
                title="Сделать главным фокусом дня"
              >
                <Star className={cn('h-4 w-4', task.isDailyFocus && 'fill-current')} />
              </button>
            )}

            {/* Кнопка запуска режима фокуса (Помодоро) */}
            {onStartFocus && !task.isCompleted && (
              <button
                onClick={() => onStartFocus(task)}
                className="p-1.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-950/40"
                title="Запустить Помодоро-таймер (25 мин) ⏱"
              >
                <Timer className="h-4 w-4" />
              </button>
            )}

            {/* Кнопка дублирования задачи */}
            <button
              onClick={handleDuplicate}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20"
              title="Дублировать задачу"
            >
              <Copy className="h-4 w-4" />
            </button>

            {/* Кнопка редактирования задачи */}
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20"
                title="Редактировать задачу"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}

            {/* Кнопка удаления */}
            <button
              onClick={() => deleteTask(task.id)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:hover:text-red-400 dark:hover:bg-red-900/20"
              title="Удалить задачу"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}