// client/src/components/goals/GoalCard.tsx
import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { useTaskStore } from '@/store/useTaskStore';
import { ProgressBar } from '@/components/common/ProgressBar';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { TaskItem } from '@/components/today/TaskItem';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { isBefore, parseISO, differenceInDays } from 'date-fns';
import type { Goal } from '@/types/goal';
import type { Task } from '@/types/task';

interface GoalCardProps {
  goal: Goal;
  level?: number;
  onAddSubgoal?: (parentId: string) => void;
  onEditGoal?: (goal: Goal) => void;
  onDeleteGoal?: (id: string) => void;
  tasks?: Task[]; // <-- ДОБАВЛЕНО: Возможность передать задачи извне (для TodayPage)
}

export function GoalCard({ goal, level = 0, onAddSubgoal, onEditGoal, onDeleteGoal, tasks }: GoalCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { getChildren, toggleTodayGoal } = useGoalStore();
  
  // Получаем все задачи из стора
  const allStoreTasks = useTaskStore((state) => state.tasks);
  
  // Используем переданные задачи (если есть) или фильтруем из стора
  const relevantTasks = tasks || allStoreTasks.filter((t) => t.goalId === goal.id);
  
  const childGoals = getChildren(goal.id);
  const hasChildren = childGoals.length > 0 || relevantTasks.length > 0;

  const daysLeft = React.useMemo(() => {
    if (!goal.targetDate) return null;
    const target = parseISO(goal.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(target, today)) return 0;
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
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    daysLeft === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    daysLeft <= 7 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  }`}>
                    {daysLeft === 0 ? 'Просрочено' : `${daysLeft} дн.`}
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
            
            {goal.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2 dark:text-slate-400">{goal.description}</p>}
            <ProgressBar progress={goal.progress} size="sm" />
            
            {/* СЧЕТЧИК ЗАДАЧ И КНОПКА ДОБАВЛЕНИЯ ПОДЦЕЛИ */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {relevantTasks.filter(t => t.isCompleted).length} / {relevantTasks.length} задач
              </span>
              
              {/* Показываем кнопку добавления подцели только если задачи не переданы извне */}
              {!tasks && (
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors dark:text-indigo-400 dark:hover:text-indigo-300"
                  onClick={() => onAddSubgoal && onAddSubgoal(goal.id)} title="Создать подцель">
                  <Plus className="h-3 w-3" /> Добавить подцель
                </button>
              )}
            </div>
          </div>
        </div>

        {/* РАСКРЫВАЮЩАЯСЯ ЧАСТЬ: ПОДЦЕЛИ И ЗАДАЧИ */}
        {isExpanded && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {childGoals.map((child) => (
              <GoalCard key={child.id} goal={child} level={level + 1} onAddSubgoal={onAddSubgoal} onEditGoal={onEditGoal} onDeleteGoal={onDeleteGoal} />
            ))}
            
            {/* ОТОБРАЖЕНИЕ ЗАДАЧ С ЧЕКБОКСАМИ */}
            {relevantTasks.map((task) => (
              <div key={task.id} className="pl-2">
                <TaskItem task={task} onToggleFocus={() => {}} /> 
              </div>
            ))}

            {childGoals.length === 0 && relevantTasks.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-2 dark:text-slate-500">Пока нет дочерних элементов.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}