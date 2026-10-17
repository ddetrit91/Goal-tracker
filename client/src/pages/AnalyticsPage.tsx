// client/src/pages/AnalyticsPage.tsx
import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { useTaskStore } from '@/store/useTaskStore';
import { ProgressBar } from '@/components/common/ProgressBar';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { SYSTEM_CATEGORY_MAP } from '@/types/category';
import { Trophy, CheckCircle2, CalendarCheck, Star, LayoutDashboard, PieChart, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/utils/cn';
import { GamificationBanner } from '@/components/analytics/GamificationBanner';
import { CircularAnalyticsView } from '@/components/analytics/CircularAnalyticsView';
import { GuidesAcademyView } from '@/components/analytics/GuidesAcademyView';
import { calculateTaskXP, calculateGoalXP } from '@/utils/gamification';

export function AnalyticsPage() {
  const { goals, fetchGoals } = useGoalStore();
  const { tasks, fetchTasks } = useTaskStore();
  const [viewMode, setViewMode] = React.useState<'overview' | 'charts' | 'guides'>('overview');

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

  // Недавние победы (достигнутые цели и закрытые задачи за 14 дней с очками XP)
  const recentVictories = React.useMemo(() => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const items: {
      id: string;
      title: string;
      completedAt: string;
      type: 'goal' | 'task';
      xp: number;
      isFocus?: boolean;
    }[] = [];

    goals.forEach((g) => {
      if (g.status === 'completed' && (g.progress ?? 0) >= 100 && g.completedAt && new Date(g.completedAt) >= twoWeeksAgo) {
        items.push({
          id: `goal-${g.id}`,
          title: g.title,
          completedAt: g.completedAt,
          type: 'goal',
          xp: calculateGoalXP(g),
        });
      }
    });

    tasks.forEach((t) => {
      if (t.isCompleted && t.completedAt && new Date(t.completedAt) >= twoWeeksAgo) {
        items.push({
          id: `task-${t.id}`,
          title: t.title,
          completedAt: t.completedAt,
          type: 'task',
          xp: calculateTaskXP(t),
          isFocus: t.isDailyFocus,
        });
      }
    });

    return items
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 8);
  }, [goals, tasks]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 pb-28 md:pb-6 overflow-x-hidden">
      <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Обзор и Аналитика</h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            {viewMode === 'overview' && 'Геймификация, баланс сфер жизни и журнал побед'}
            {viewMode === 'charts' && 'Круговая диаграмма достижений и продуктивности'}
            {viewMode === 'guides' && 'Академия знаний: популярные техники достижения целей'}
          </p>
        </div>

        <div className="w-full sm:w-auto shrink-0">
          {/* Переключатель вида: Обзор / Аналитика / Гайды (равномерное распределение на мобильных) */}
          <div className="grid grid-cols-3 sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto shadow-sm">
            <button
              onClick={() => setViewMode('overview')}
              className={cn(
                "flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-center",
                viewMode === 'overview'
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <LayoutDashboard className="h-4.5 w-4.5 sm:h-4 sm:w-4 shrink-0" />
              <span>Обзор</span>
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={cn(
                "flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-center",
                viewMode === 'charts'
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <PieChart className="h-4.5 w-4.5 sm:h-4 sm:w-4 shrink-0" />
              <span>Аналитика</span>
            </button>
            <button
              onClick={() => setViewMode('guides')}
              className={cn(
                "flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-center",
                viewMode === 'guides'
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <BookOpen className="h-4.5 w-4.5 sm:h-4 sm:w-4 shrink-0" />
              <span>Гайды</span>
            </button>
          </div>
        </div>
      </header>

      {/* УСЛОВНЫЙ РЕНДЕРИНГ: ОБЗОР / КРУГОВАЯ АНАЛИТИКА / ГАЙДЫ */}
      {viewMode === 'guides' ? (
        <GuidesAcademyView goals={goals} tasks={tasks} />
      ) : viewMode === 'charts' ? (
        <CircularAnalyticsView goals={goals} tasks={tasks} />
      ) : (
        <>
          {/* Блок геймификации: уровни, очки XP, кубки и достижения */}
          <GamificationBanner goals={goals} tasks={tasks} onOpenGuides={() => setViewMode('guides')} />

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

          {/* Журнал побед с начислением XP */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 dark:text-slate-200">
                <Trophy className="h-5 w-5 text-amber-500" />
                Недавние победы
              </h2>
              <span className="text-xs text-slate-400">
                За последние 14 дней
              </span>
            </div>

            {recentVictories.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 dark:bg-slate-800/30 dark:border-slate-700">
                <CheckCircle2 className="h-8 w-8 text-slate-300 mx-auto mb-2 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400">Пока нет завершённых задач или целей за последнее время.</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {recentVictories.map((item) => (
                  <li 
                    key={item.id} 
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300 transition-colors"
                  >
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'goal' 
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                        : item.isFocus 
                          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {item.type === 'goal' ? (
                        <Trophy className="h-4 w-4" />
                      ) : item.isFocus ? (
                        <Star className="h-4 w-4 fill-current text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate dark:text-slate-200">
                          {item.title}
                        </p>
                        {item.type === 'goal' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 shrink-0">
                            Цель 🏆
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {item.type === 'goal' ? 'Цель достигнута' : 'Задача выполнена'} {item.completedAt ? format(new Date(item.completedAt), 'd MMMM в HH:mm', { locale: ru }) : ''}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                        item.type === 'goal'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      }`}>
                        +{item.xp} XP
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}