import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { useTaskStore } from '@/store/useTaskStore';
import { ProgressBar } from '@/components/common/ProgressBar';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { TaskItem } from '@/components/today/TaskItem';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { isBefore, parseISO, differenceInDays } from 'date-fns'; // <-- ДОБАВЛЕН ИМПОРТ
import type { Goal } from '@/types/goal';

interface GoalCardProps {
  goal: Goal;
  level?: number;
  onAddSubgoal?: (parentId: string) => void;
  onEditGoal?: (goal: Goal) => void;
  onDeleteGoal?: (id: string) => void;
}

export function GoalCard({ goal, level = 0, onAddSubgoal, onEditGoal, onDeleteGoal }: GoalCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { getChildren } = useGoalStore();
  const { tasks } = useTaskStore(); 
  
  const childGoals = getChildren(goal.id);
  const childTasks = tasks.filter((t) => t.goalId === goal.id);
  const hasChildren = childGoals.length > 0 || childTasks.length > 0;

  // <-- ДОБАВЛЕН РАСЧЕТ ОСТАВШИХСЯ ДНЕЙ
  const daysLeft = React.useMemo(() => {
    if (!goal.targetDate) return null;
    const target = parseISO(goal.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(target, today)) return 0; // Просрочено
    return differenceInDays(target, today);
  }, [goal.targetDate]);

  return (
    <div className={cn('mb-4 group/card', level > 0 && 'ml-6 border-l-2 border-slate-100 pl-4')}>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md relative">
        
        {/* Кнопки действий */}
        {(onEditGoal || onDeleteGoal) && (
          <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity md:opacity-0 opacity-100">
            {onEditGoal && (
              <button onClick={() => onEditGoal(goal)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Редактировать">
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDeleteGoal && (
              <button onClick={() => { if (window.confirm(`Удалить цель "${goal.title}"?`)) onDeleteGoal(goal.id); }} 
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Удалить">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-start gap-3 pr-16">
          {hasChildren ? (
            <button onClick={() => setIsExpanded(!isExpanded)} className="mt-1 text-slate-400 hover:text-indigo-600 transition-colors">
              {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          ) : <div className="w-5 shrink-0" />}
          
          <div className="flex-1 min-w-0">
            {/* <-- ОБНОВЛЕННЫЙ БЛОК ЗАГОЛОВКА С БЕЙДЖЕМ ДНЕЙ */}
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{goal.title}</h3>
              <div className="flex items-center gap-2">
                
                {/* Бейдж обратного отсчета */}
                {daysLeft !== null && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    daysLeft === 0 ? 'bg-red-100 text-red-700' :
                    daysLeft <= 7 ? 'bg-orange-100 text-orange-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    {daysLeft === 0 ? 'Просрочено' : `${daysLeft} дн.`}
                  </span>
                )}

                <CategoryBadge category={goal.category} size="sm" />
                
                {goal.priority !== 'low' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        goal.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        goal.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                        {goal.priority === 'critical' ? 'Крит' : goal.priority === 'high' ? 'Выс' : 'Сред'}
                    </span>
                )}
              </div>
            </div>
            
            {goal.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{goal.description}</p>}
            <ProgressBar progress={goal.progress} size="sm" />
            
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-400">{childTasks.filter(t => t.isCompleted).length} / {childTasks.length} задач</span>
              <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                onClick={() => onAddSubgoal && onAddSubgoal(goal.id)} title="Создать подцель">
                <Plus className="h-3 w-3" /> Добавить подцель
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {childGoals.map((child) => (
              <GoalCard key={child.id} goal={child} level={level + 1} onAddSubgoal={onAddSubgoal} onEditGoal={onEditGoal} onDeleteGoal={onDeleteGoal} />
            ))}
            {childTasks.map((task) => (<div key={task.id} className="pl-2"><TaskItem task={task} /></div>))}
            {childGoals.length === 0 && childTasks.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-2">Пока нет дочерних элементов.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}