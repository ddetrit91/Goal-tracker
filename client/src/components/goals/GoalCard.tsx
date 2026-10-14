// client/src/components/goals/GoalCard.tsx
import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { useTaskStore } from '@/store/useTaskStore';
import { ProgressBar } from '@/components/common/ProgressBar';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { TaskItem } from '@/components/today/TaskItem';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Star, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';
import { parseISO, differenceInDays, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toISODateString } from '@/utils/date';
import type { Goal } from '@/types/goal';
import type { Task } from '@/types/task';

interface GoalCardProps {
  goal: Goal;
  level?: number;
  onAddSubgoal?: (parentId: string) => void;
  onEditGoal?: (goal: Goal) => void;
  onDeleteGoal?: (id: string) => void;
  tasks?: Task[];
}

export function GoalCard({ goal, level = 0, onAddSubgoal, onEditGoal, onDeleteGoal, tasks }: GoalCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [isTaskForToday, setIsTaskForToday] = React.useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = React.useState(false);

  const { goals, getChildren, toggleTodayGoal } = useGoalStore();
  const { tasks: allStoreTasks, createTask, toggleDailyFocus } = useTaskStore();

  // Проверяем, является ли эта цель или любая из её родительских целью дня
  const isGoalForToday = React.useMemo(() => {
    if (goal.isTodayGoal) return true;
    let current = goal;
    while (current.parentId) {
      const parent = goals.find((g) => g.id === current.parentId);
      if (!parent) break;
      if (parent.isTodayGoal) return true;
      current = parent;
    }
    return false;
  }, [goal, goals]);

  React.useEffect(() => {
    if (isAddingTask) {
      setIsTaskForToday(isGoalForToday);
    }
  }, [isAddingTask, isGoalForToday]);
  
  // Используем переданные задачи (если есть) или фильтруем из стора
  const relevantTasks = tasks || allStoreTasks.filter((t) => t.goalId === goal.id);
  
  const childGoals = getChildren(goal.id);
  const hasChildren = childGoals.length > 0 || relevantTasks.length > 0 || isAddingTask;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isSubmittingTask) return;

    setIsSubmittingTask(true);
    try {
      await createTask({
        title: newTaskTitle.trim(),
        description: '',
        horizon: 'daily',
        goalId: goal.id,
        category: goal.category,
        dueDate: (isTaskForToday || isGoalForToday) ? toISODateString(new Date()) : null,
        priority: 'medium',
        estimatedMinutes: null,
        isRecurring: false,
        recurrenceRule: null,
        isCompleted: false,
        completedAt: null,
        isDailyFocus: false,
        tags: [],
      });
      setNewTaskTitle('');
      setIsAddingTask(false);
      setIsExpanded(true);
    } catch (err) {
      console.error('Failed to create task for goal:', err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const daysLeft = React.useMemo(() => {
    if (!goal.targetDate) return null;
    const target = parseISO(goal.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return differenceInDays(target, today);
  }, [goal.targetDate]);

  return (
    <div className={cn('mb-4 group/card', level > 0 && 'ml-6 border-l-2 border-slate-100 pl-4 dark:border-slate-700')}>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md relative dark:bg-slate-800 dark:border-slate-700 dark:hover:shadow-none">
        
        {/* Кнопки действий */}
        {(onEditGoal || onDeleteGoal) && (
          <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity md:opacity-0 opacity-100">
            {onEditGoal && (
              <button onClick={() => onEditGoal(goal)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20" title="Редактировать">
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDeleteGoal && (
              <button onClick={() => { if (window.confirm(`Удалить цель "${goal.title}"?`)) onDeleteGoal(goal.id); }} 
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:text-red-400 dark:hover:bg-red-900/20" title="Удалить">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-start gap-3 pr-16">
          {hasChildren ? (
            <button onClick={() => setIsExpanded(!isExpanded)} className="mt-1 text-slate-400 hover:text-indigo-600 transition-colors dark:text-slate-300 dark:hover:text-white">
              {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          ) : <div className="w-5 shrink-0" />}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h3 className="font-semibold text-slate-900 truncate dark:text-white">{goal.title}</h3>
              <div className="flex items-center gap-2">
                
                {/* КНОПКА: Цель дня */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTodayGoal(goal.id);
                  }}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    goal.isTodayGoal 
                      ? "text-amber-500 bg-amber-50 dark:bg-amber-900/30" 
                      : "text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                  title={goal.isTodayGoal ? "Убрать из целей дня" : "Сделать целью дня"}
                >
                  <Star className={cn("h-4 w-4", goal.isTodayGoal && "fill-current")} />
                </button>

                {/* Бейдж обратного отсчета */}
                {daysLeft !== null && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${
                    daysLeft < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                    daysLeft === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                    daysLeft <= 7 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  }`}>
                    {daysLeft < 0 ? `Просрочено на ${Math.abs(daysLeft)} дн.` :
                     daysLeft === 0 ? 'Срок сегодня!' :
                     daysLeft === 1 ? 'Завтра' :
                     `${daysLeft} дн.`}
                  </span>
                )}

                <CategoryBadge category={goal.category} size="sm" />
                
                {goal.priority !== 'low' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        goal.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        goal.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                        {goal.priority === 'critical' ? 'Крит' : goal.priority === 'high' ? 'Выс' : 'Сред'}
                    </span>
                )}
              </div>
            </div>
            
            {goal.description && <p className="text-sm text-slate-500 mb-2 line-clamp-2 dark:text-slate-400">{goal.description}</p>}
            
            {goal.targetDate && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-400 mb-3">
                <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>
                  {goal.startDate ? `${format(parseISO(goal.startDate), 'd MMM yyyy', { locale: ru })} — ` : 'Срок до: '}
                  {format(parseISO(goal.targetDate), 'd MMMM yyyy', { locale: ru })}
                </span>
              </div>
            )}

            <ProgressBar progress={goal.progress} size="sm" />
            
            {/* СЧЕТЧИК ЗАДАЧ И КНОПКА ДОБАВЛЕНИЯ ПОДЦЕЛИ / ЗАДАЧИ */}
            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {relevantTasks.filter(t => t.isCompleted).length} / {relevantTasks.length} задач
              </span>
              
              {/* Показываем кнопки добавления только если задачи не переданы извне */}
              {!tasks && (
                <div className="flex items-center gap-2">
                  <button 
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors dark:text-emerald-400 dark:hover:text-emerald-300"
                    onClick={() => {
                      setIsAddingTask(true);
                      setIsExpanded(true);
                    }} 
                    title="Добавить задачу к этой цели"
                  >
                    <Plus className="h-3 w-3" /> Добавить задачу
                  </button>
                  <button 
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors dark:text-indigo-400 dark:hover:text-indigo-300"
                    onClick={() => onAddSubgoal && onAddSubgoal(goal.id)} 
                    title="Создать подцель"
                  >
                    <Plus className="h-3 w-3" /> Добавить подцель
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* РАСКРЫВАЮЩАЯСЯ ЧАСТЬ: ПОДЦЕЛИ И ЗАДАЧИ */}
        {isExpanded && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* ФОРМА БЫСТРОГО ДОБАВЛЕНИЯ ЗАДАЧИ К ЦЕЛИ */}
            {isAddingTask && (
              <form onSubmit={handleCreateTask} className="p-3 bg-slate-50 rounded-lg border border-slate-200 dark:bg-slate-700/50 dark:border-slate-600 mb-3 space-y-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Название новой задачи..."
                  autoFocus
                  className="w-full text-sm px-3 py-1.5 rounded-md border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTaskForToday}
                      onChange={(e) => setIsTaskForToday(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    Назначить на сегодня
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingTask(false);
                        setNewTaskTitle('');
                      }}
                      className="text-xs px-2.5 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={!newTaskTitle.trim() || isSubmittingTask}
                      className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSubmittingTask ? 'Сохранение...' : 'Создать'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {childGoals.map((child) => (
              <GoalCard key={child.id} goal={child} level={level + 1} onAddSubgoal={onAddSubgoal} onEditGoal={onEditGoal} onDeleteGoal={onDeleteGoal} />
            ))}
            
            {/* ОТОБРАЖЕНИЕ ЗАДАЧ С ЧЕКБОКСАМИ */}
            {relevantTasks.map((task) => (
              <div key={task.id} className="pl-2">
                <TaskItem task={task} onToggleFocus={toggleDailyFocus} /> 
              </div>
            ))}

            {childGoals.length === 0 && relevantTasks.length === 0 && !isAddingTask && (
              <p className="text-sm text-slate-400 italic text-center py-2 dark:text-slate-500">Пока нет дочерних элементов.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}