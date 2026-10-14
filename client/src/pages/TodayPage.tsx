// client/src/pages/TodayPage.tsx
import * as React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useGoalStore } from '@/store/useGoalStore';
import { DailyFocus } from '@/components/today/DailyFocus';
import { TaskItem } from '@/components/today/TaskItem';
import { QuickTaskInput } from '@/components/today/QuickTaskInput';
import { ProgressBar } from '@/components/common/ProgressBar';
import { toISODateString, formatDate } from '@/utils/date';
import { CalendarDays, CheckCircle2, Target } from 'lucide-react';
import { cn } from '@/utils/cn';
import confetti from 'canvas-confetti';

export function TodayPage() {
  const today = toISODateString(new Date());
  
  const { tasks, fetchTasks } = useTaskStore();
  const { goals, fetchGoals, updateGoal } = useGoalStore();

  React.useEffect(() => {
    Promise.all([fetchTasks(), fetchGoals()]);
  }, [fetchTasks, fetchGoals]);

  // Только корневые цели, отмеченные как "Цель дня" (Фокус дня)
  const todaysGoals = goals.filter((g) => g.isTodayGoal === true && !g.parentId);

  // Рекурсивный поиск всех подцелей
  const getAllGoalDescendantIds = React.useCallback((goalId: string): string[] => {
    const children = goals.filter((g) => g.parentId === goalId);
    return [goalId, ...children.flatMap((c) => getAllGoalDescendantIds(c.id))];
  }, [goals]);

  // Все ID целей, входящих в фокус дня
  const todayGoalHierarchyIds = React.useMemo(() => {
    const ids = new Set<string>();
    todaysGoals.forEach((g) => {
      getAllGoalDescendantIds(g.id).forEach((id) => ids.add(id));
    });
    return ids;
  }, [todaysGoals, getAllGoalDescendantIds]);

  // Задачи на сегодня: назначенные на сегодня либо входящие в отмеченные цели дня
  const todaysTasks = tasks.filter(
    (t) => t.dueDate === today || (t.goalId && todayGoalHierarchyIds.has(t.goalId))
  );

  // Отметить цель выполненной целиком с анимацией конфетти
  const handleToggleGoal = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    if (newStatus === 'completed') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b'],
      });
    }
    await updateGoal(id, { 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 pb-24 md:pb-6">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Сегодня</h1>
            <p className="text-slate-500 dark:text-slate-400">{formatDate(today, 'EEEE, d MMMM yyyy')}</p>
          </div>
        </div>
      </header>

      {/* 1. ГЛАВНЫЕ ФОКУСЫ ДНЯ */}
      <div data-tour="today-focus">
        <DailyFocus />
      </div>

      {/* 2. ЦЕЛИ НА СЕГОДНЯ (ФОКУС ДНЯ) */}
      {todaysGoals.length > 0 ? (
        <section className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            Фокус дня
          </h2>
          
          {todaysGoals.map((goal) => {
            const isCompleted = goal.status === 'completed';
            const descendantIds = getAllGoalDescendantIds(goal.id);
            // Задачи, находящиеся внутри этой цели или её подцелей
            const goalTasks = tasks.filter(t => t.goalId && descendantIds.includes(t.goalId));
            const completedTasksCount = goalTasks.filter(t => t.isCompleted).length;
            const totalTasksCount = goalTasks.length;
            const hasTasks = totalTasksCount > 0;

            return (
              <div 
                key={goal.id} 
                className={cn(
                  "rounded-xl border transition-all p-4",
                  isCompleted 
                    ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50" 
                    : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleGoal(goal.id, goal.status || '')}
                    className={cn(
                      "shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                      isCompleted 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "border-slate-300 dark:border-slate-600 hover:border-indigo-500"
                    )}
                    title={isCompleted ? "Отметить как невыполненную" : "Отметить цель выполненной"}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className={cn(
                        "font-bold truncate transition-all",
                        isCompleted ? "text-emerald-700 line-through dark:text-emerald-400" : "text-slate-900 dark:text-white"
                      )}>
                        {goal.title}
                      </h3>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">
                        {goal.progress}%
                      </span>
                    </div>

                    <ProgressBar progress={goal.progress} size="sm" showLabel={false} />

                    <div className="flex items-center justify-between mt-2 text-xs text-slate-400 dark:text-slate-500">
                      <span>
                        {hasTasks 
                          ? `${completedTasksCount} из ${totalTasksCount} подзадач выполнено` 
                          : 'Цель без подзадач'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <div className="mb-8 p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <Target className="h-8 w-8 text-slate-300 mx-auto mb-2 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">Нет выбранных целей на сегодня.</p>
          <p className="text-xs text-slate-400 mt-1">Перейдите во вкладку "Цели" и нажмите на звездочку ⭐</p>
        </div>
      )}

      {/* 3. ВСЕ ЗАДАЧИ ДНЯ (Общий список) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200">Все задачи дня</h2>
          <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full dark:bg-slate-800 dark:text-slate-300">
            {todaysTasks.length}
          </span>
        </div>

        <QuickTaskInput />

        {todaysTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 dark:bg-slate-900 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">На сегодня больше нет задач. Отличная работа!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {todaysTasks.map((task) => (
              <li key={task.id}>
                <TaskItem task={task} onToggleFocus={useTaskStore.getState().toggleDailyFocus} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}