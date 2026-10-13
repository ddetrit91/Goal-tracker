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

export function TodayPage() {
  const today = toISODateString(new Date());
  
  const { tasks, fetchTasks } = useTaskStore();
  const { goals, fetchGoals, updateGoal } = useGoalStore();

  React.useEffect(() => {
    Promise.all([fetchTasks(), fetchGoals()]);
  }, []);

  const todaysTasks = tasks.filter((t) => t.dueDate === today);
  const nonFocusTasks = todaysTasks.filter((t) => !t.isDailyFocus || t.isCompleted);

  // Только корневые цели, отмеченные как "Цель дня"
  const todaysGoals = goals.filter((g) => g.isTodayGoal === true && !g.parentId);

  // Отметить цель выполненной целиком
  const handleToggleGoal = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
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
      <DailyFocus />

      {/* 2. ЦЕЛИ НА СЕГОДНЯ */}
      {todaysGoals.length > 0 ? (
        <section className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            Фокус дня
          </h2>
          
          {todaysGoals.map((goal) => {
            const isCompleted = goal.status === 'completed';
            const goalTasks = todaysTasks.filter(t => t.goalId === goal.id);
            const hasTasks = goalTasks.length > 0;

            return (
              <div 
                key={goal.id} 
                className={cn(
                  "rounded-xl border transition-all",
                  isCompleted 
                    ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50" 
                    : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                )}
              >
                {/* Верхняя часть: Чекбокс цели + Название + Процент */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => handleToggleGoal(goal.id, goal.status || '')}
                    className={cn(
                      "shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                      isCompleted 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "border-slate-300 dark:border-slate-600 hover:border-indigo-500"
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={cn(
                        "font-bold truncate transition-all",
                        isCompleted ? "text-emerald-700 line-through dark:text-emerald-400" : "text-slate-900 dark:text-white"
                      )}>
                        {goal.title}
                      </h3>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2">
                        {goal.progress}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Если есть задачи: показываем прогресс-бар и список задач */}
                {hasTasks ? (
                  <div className="px-4 pb-4">
                    <ProgressBar progress={goal.progress} size="sm" showLabel={false} className="mb-3" />
                    <ul className="space-y-2 pl-9">
                      {goalTasks.map((task) => (
                        <li key={task.id}>
                          <TaskItem task={task} onToggleFocus={() => {}} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  /* Если задач нет: цель выглядит как одна большая задача, готовая к отметке */
                  <div className="px-4 pb-4 pl-[52px]">
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                      Нет подзадач на сегодня. Отметьте цель как выполненную галочкой выше.
                    </p>
                  </div>
                )}
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

        {nonFocusTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 dark:bg-slate-900 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">На сегодня больше нет задач. Отличная работа!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {nonFocusTasks.map((task) => (
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