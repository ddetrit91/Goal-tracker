import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export function UpcomingDeadlines() {
  const { goals } = useGoalStore();
  
  // Берем только корневые цели с датой, сортируем по близости дедлайна
  const upcomingGoals = React.useMemo(() => {
    const today = startOfDay(new Date());
    
    return goals
      .filter(g => g.parentId === null && g.targetDate && g.status !== 'completed')
      .map(g => ({
        ...g,
        daysLeft: differenceInDays(parseISO(g.targetDate!), today)
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 3); // Показываем только топ-3 самых срочных
  }, [goals]);

  if (upcomingGoals.length === 0) return null;

  return (
    <div className="mb-8 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-indigo-600" />
        <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Ближайшие дедлайны</h2>
      </div>

      <div className="space-y-3">
        {upcomingGoals.map((goal) => {
          const isUrgent = goal.daysLeft <= 7;
          const isOverdue = goal.daysLeft < 0;
          
          let statusColor = "bg-indigo-100 text-indigo-700";
          let Icon = Clock;
          
          if (isOverdue) {
            statusColor = "bg-red-100 text-red-700";
            Icon = AlertCircle;
          } else if (isUrgent) {
            statusColor = "bg-orange-100 text-orange-700";
            Icon = AlertCircle;
          }

          return (
            <div key={goal.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("p-2 rounded-full shrink-0", statusColor.replace('text-', 'bg-opacity-20 '))}>
                  <Icon className={cn("h-4 w-4", statusColor.split(' ')[1])} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{goal.title}</p>
                  <p className="text-xs text-slate-500">
                    {format(parseISO(goal.targetDate!), 'd MMMM yyyy', { locale: ru })}
                  </p>
                </div>
              </div>
              
              <div className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ml-3",
                statusColor
              )}>
                {isOverdue 
                  ? `Просрочено на ${Math.abs(goal.daysLeft)} дн.` 
                  : isUrgent 
                    ? `Осталось ${goal.daysLeft} дн.` 
                    : `${goal.daysLeft} дн.`
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}