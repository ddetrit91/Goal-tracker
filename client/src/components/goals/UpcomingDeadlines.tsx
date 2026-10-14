import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock, AlertCircle, CalendarClock, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { GoalHorizon } from '@/types/goal';

interface UpcomingDeadlinesProps {
  onOpenCreateGoal?: () => void;
  activeHorizon?: GoalHorizon | 'all';
}

export function UpcomingDeadlines({ onOpenCreateGoal, activeHorizon = 'all' }: UpcomingDeadlinesProps) {
  const { goals } = useGoalStore();
  
  // Берем все активные цели со сроком (как корневые, так и подцели), сортируем по срочности
  const upcomingGoals = React.useMemo(() => {
    const today = startOfDay(new Date());
    
    return goals
      .filter(g => {
        if (!g.targetDate || g.status === 'completed' || (g.progress || 0) >= 100) return false;
        if (activeHorizon !== 'all' && g.horizon !== activeHorizon) return false;
        return true;
      })
      .map(g => ({
        ...g,
        daysLeft: differenceInDays(parseISO(g.targetDate!), today)
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 4); // Показываем топ-4 самых срочных
  }, [goals, activeHorizon]);

  return (
    <div className={cn(
      "mb-8 rounded-xl border p-5 shadow-sm transition-all",
      "bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 border-indigo-100",
      "dark:from-slate-800/90 dark:via-slate-800/50 dark:to-slate-900 dark:border-slate-700"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Ближайшие сроки выполнения
          </h2>
        </div>
        {upcomingGoals.length > 0 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            {upcomingGoals.length} {upcomingGoals.length === 1 ? 'цель' : 'цели'}
          </span>
        )}
      </div>

      {upcomingGoals.length === 0 ? (
        <div className="p-4 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 text-center">
          <CalendarClock className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Пока нет активных целей со сроком выполнения
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
            При создании или редактировании цели укажите дату завершения (срок выполнения), чтобы здесь отображался обратный отсчёт дней.
          </p>
          {onOpenCreateGoal && (
            <button
              onClick={onOpenCreateGoal}
              className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              Создать цель со сроком <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {upcomingGoals.map((goal) => {
            const isOverdue = goal.daysLeft < 0;
            const isToday = goal.daysLeft === 0;
            const isTomorrow = goal.daysLeft === 1;
            const isUrgent = goal.daysLeft <= 7;
            
            let statusColor = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300";
            let Icon = Clock;
            
            if (isOverdue) {
              statusColor = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
              Icon = AlertCircle;
            } else if (isToday || isTomorrow) {
              statusColor = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
              Icon = AlertCircle;
            } else if (isUrgent) {
              statusColor = "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300";
              Icon = Clock;
            }

            const formattedDate = format(parseISO(goal.targetDate!), 'd MMMM yyyy', { locale: ru });

            return (
              <div 
                key={goal.id} 
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn("p-1.5 rounded-full shrink-0", statusColor)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={goal.title}>
                        {goal.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formattedDate}
                      </p>
                    </div>
                  </div>
                  
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap", statusColor)}>
                    {isOverdue 
                      ? `Просрочено на ${Math.abs(goal.daysLeft)} дн.` 
                      : isToday 
                        ? 'Срок сегодня!'
                        : isTomorrow
                          ? 'Завтра'
                          : isUrgent 
                            ? `Осталось ${goal.daysLeft} дн.` 
                            : `${goal.daysLeft} дн.`
                    }
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className={cn(
                      "h-full transition-all duration-300",
                      isOverdue ? "bg-red-500" : isUrgent ? "bg-amber-500" : "bg-indigo-600 dark:bg-indigo-400"
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}