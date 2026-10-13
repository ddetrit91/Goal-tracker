// client/src/pages/AnalyticsPage.tsx
import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { useTaskStore } from '@/store/useTaskStore';
import { ProgressBar } from '@/components/common/ProgressBar';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { SYSTEM_CATEGORY_MAP } from '@/types/category';
import { Trophy, CheckCircle2, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function AnalyticsPage() {
  const { goals, fetchGoals } = useGoalStore();
  const { tasks, fetchTasks } = useTaskStore();

  // ГАРАНТИРОВАННАЯ ЗАГРУЗКА ДАННЫХ ПРИ ОТКРЫТИИ СТРАНИЦЫ
  React.useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchGoals(), fetchTasks()]);
        console.log('✅ Analytics data loaded successfully');
      } catch (err) {
        console.error('❌ Error loading analytics:', err);
      }
    };
    loadData();
  }, [fetchGoals, fetchTasks]);

  // ИСПРАВЛЕНИЕ: Безопасный подсчет прогресса с учетом strict mode
  const categoryStats = React.useMemo(() => {
    const stats: Record<string, { totalProgress: number; count: number; label: string }> = {};
    
    // Инициализация системных категорий
    Object.keys(SYSTEM_CATEGORY_MAP).forEach((key) => {
      const mapItem = SYSTEM_CATEGORY_MAP[key];
      if (mapItem) {
        stats[key] = { totalProgress: 0, count: 0, label: mapItem.label };
      }
    });

    goals.forEach((goal) => {
      // Безопасное обращение к статистике категории
      const stat = stats[goal.category];
      if (stat) {
        stat.totalProgress += goal.progress ?? 0;
        stat.count += 1;
      }
    });

    return stats;
  }, [goals]);

  // Статистика за последнюю неделю
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentCompletions = tasks.filter(t => 
    t.isCompleted && t.completedAt && new Date(t.completedAt) >= oneWeekAgo
  ).sort((a, b) => {
    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24 md:pb-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Обзор и Аналитика</h1>
        <p className="text-slate-500 mt-1 dark:text-slate-400">Баланс сфер жизни и журнал побед</p>
      </header>

      {/* Колесо баланса */}
      <section className="mb-10 bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2 dark:text-slate-200">
          <CalendarCheck className="h-5 w-5 text-indigo-600" />
          Баланс сфер жизни
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(categoryStats).map(([key, data]) => {
            if (!data || data.count === 0) return null;
            
            // Вычисляем средний прогресс по категории
            const averageProgress = Math.round(data.totalProgress / data.count);
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <CategoryBadge category={key} size="sm" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {averageProgress}% заполнено
                  </span>
                </div>
                <ProgressBar progress={averageProgress} size="sm" showLabel={false} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Журнал побед */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 dark:text-slate-200">
          <Trophy className="h-5 w-5 text-amber-500" />
          Недавние победы
        </h2>

        {recentCompletions.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 dark:bg-slate-800/30 dark:border-slate-700">
            <CheckCircle2 className="h-8 w-8 text-slate-300 mx-auto mb-2 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">Пока нет выполненных задач за последнюю неделю.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {recentCompletions.slice(0, 5).map((task) => (
              <li 
                key={task.id} 
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate dark:text-slate-200">{task.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Выполнено {task.completedAt ? format(new Date(task.completedAt), 'd MMM в HH:mm', { locale: ru }) : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}