// client/src/components/analytics/CircularAnalyticsView.tsx
import * as React from 'react';
import type { Goal } from '@/types/goal';
import type { Task } from '@/types/task';
import { SYSTEM_CATEGORY_MAP } from '@/types/category';
import { calculateTaskXP, calculateGoalXP } from '@/utils/gamification';
import { 
  PieChart as PieChartIcon, 
  Trophy, 
  CheckCircle2, 
  Zap, 
  Target, 
  TrendingUp, 
  Clock, 
  Sparkles,
  Layers,
  Flame
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { toISODateString } from '@/utils/date';

interface CircularAnalyticsViewProps {
  goals: Goal[];
  tasks: Task[];
}

type TimeRange = 'week' | 'month' | 'quarter' | 'all';
type ChartMetric = 'categories' | 'status' | 'xp';

interface SliceData {
  id: string;
  label: string;
  value: number;
  color: string;
  secondaryValue?: string;
  icon?: string;
}

export function CircularAnalyticsView({ goals, tasks }: CircularAnalyticsViewProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>('month');
  const [metric, setMetric] = React.useState<ChartMetric>('categories');
  const [hoveredSliceId, setHoveredSliceId] = React.useState<string | null>(null);

  // Вычисляем граничную дату для выбранного диапазона
  const cutoffDate = React.useMemo(() => {
    if (timeRange === 'all') return null;
    const date = new Date();
    if (timeRange === 'week') date.setDate(date.getDate() - 7);
    if (timeRange === 'month') date.setDate(date.getDate() - 30);
    if (timeRange === 'quarter') date.setDate(date.getDate() - 90);
    return date;
  }, [timeRange]);

  // Фильтруем завершенные задачи за период
  const filteredCompletedTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      if (!t.isCompleted || !t.completedAt) return false;
      if (!cutoffDate) return true;
      return new Date(t.completedAt) >= cutoffDate;
    });
  }, [tasks, cutoffDate]);

  // Фильтруем завершенные цели за период (только при 100% прогрессе)
  const filteredCompletedGoals = React.useMemo(() => {
    return goals.filter((g) => {
      if (g.status !== 'completed' || (g.progress ?? 0) < 100 || !g.completedAt) return false;
      if (!cutoffDate) return true;
      return new Date(g.completedAt) >= cutoffDate;
    });
  }, [goals, cutoffDate]);

  // Все задачи, активные/созданные/актуальные за период
  const periodAllTasks = React.useMemo(() => {
    if (!cutoffDate) return tasks;
    return tasks.filter((t) => {
      const created = t.createdAt ? new Date(t.createdAt) : null;
      const completed = t.completedAt ? new Date(t.completedAt) : null;
      const due = t.dueDate ? new Date(t.dueDate) : null;
      return (
        (created && created >= cutoffDate) ||
        (completed && completed >= cutoffDate) ||
        (due && due >= cutoffDate)
      );
    });
  }, [tasks, cutoffDate]);

  // Суммарный заработанный XP за период
  const periodXP = React.useMemo(() => {
    const taskXP = filteredCompletedTasks.reduce((sum, t) => sum + calculateTaskXP(t), 0);
    const goalXP = filteredCompletedGoals.reduce((sum, g) => sum + calculateGoalXP(g), 0);
    return taskXP + goalXP;
  }, [filteredCompletedTasks, filteredCompletedGoals]);

  // Фокусные задачи, завершенные в этот период
  const completedFocusTasksCount = React.useMemo(() => {
    return filteredCompletedTasks.filter((t) => t.isDailyFocus).length;
  }, [filteredCompletedTasks]);

  // Процент выполнения задач
  const completionRate = React.useMemo(() => {
    if (periodAllTasks.length === 0) return 0;
    const completedCount = periodAllTasks.filter((t) => t.isCompleted).length;
    return Math.round((completedCount / periodAllTasks.length) * 100);
  }, [periodAllTasks]);

  // Подготовка данных для срезов диаграммы в зависимости от метрики
  const slices: SliceData[] = React.useMemo(() => {
    if (metric === 'categories') {
      // Распределение завершенных активностей (задач и целей) по категориям
      const map: Record<string, { count: number; xp: number }> = {};
      
      Object.keys(SYSTEM_CATEGORY_MAP).forEach((k) => {
        map[k] = { count: 0, xp: 0 };
      });

      filteredCompletedTasks.forEach((t) => {
        const cat = t.category || 'self-development';
        if (!map[cat]) map[cat] = { count: 0, xp: 0 };
        map[cat].count += 1;
        map[cat].xp += calculateTaskXP(t);
      });

      filteredCompletedGoals.forEach((g) => {
        const cat = g.category || 'self-development';
        if (!map[cat]) map[cat] = { count: 0, xp: 0 };
        map[cat].count += 1;
        map[cat].xp += calculateGoalXP(g);
      });

      return Object.entries(map)
        .map(([id, val]) => {
          const sys = SYSTEM_CATEGORY_MAP[id];
          return {
            id,
            label: sys ? sys.label : id,
            value: val.count,
            color: sys ? sys.color : '#6366f1',
            secondaryValue: `${val.xp} XP`,
          };
        })
        .filter((s) => s.value > 0)
        .sort((a, b) => b.value - a.value);
    }

    if (metric === 'xp') {
      // Вклад сфер жизни в заработанный опыт
      const map: Record<string, number> = {};

      filteredCompletedTasks.forEach((t) => {
        const cat = t.category || 'self-development';
        map[cat] = (map[cat] || 0) + calculateTaskXP(t);
      });

      filteredCompletedGoals.forEach((g) => {
        const cat = g.category || 'self-development';
        map[cat] = (map[cat] || 0) + calculateGoalXP(g);
      });

      return Object.entries(map)
        .map(([id, val]) => {
          const sys = SYSTEM_CATEGORY_MAP[id];
          return {
            id,
            label: sys ? sys.label : id,
            value: val,
            color: sys ? sys.color : '#8b5cf6',
            secondaryValue: `${val} XP`,
          };
        })
        .filter((s) => s.value > 0)
        .sort((a, b) => b.value - a.value);
    }

    if (metric === 'status') {
      // Статус задач за период
      const completed = periodAllTasks.filter((t) => t.isCompleted).length;
      const todayStr = toISODateString(new Date());
      const overdue = periodAllTasks.filter(
        (t) => !t.isCompleted && t.dueDate && t.dueDate < todayStr
      ).length;
      const inProgress = Math.max(0, periodAllTasks.length - completed - overdue);

      const items: SliceData[] = [];
      if (completed > 0) {
        items.push({ id: 'completed', label: 'Выполнено', value: completed, color: '#10b981' });
      }
      if (inProgress > 0) {
        items.push({ id: 'in_progress', label: 'В процессе', value: inProgress, color: '#6366f1' });
      }
      if (overdue > 0) {
        items.push({ id: 'overdue', label: 'Просрочено', value: overdue, color: '#ef4444' });
      }
      return items;
    }

    return [];
  }, [metric, filteredCompletedTasks, filteredCompletedGoals, periodAllTasks]);

  // Общая сумма значений для круговой диаграммы
  const totalSliceValue = React.useMemo(() => {
    return slices.reduce((sum, s) => sum + s.value, 0);
  }, [slices]);

  // Категория-лидер за выбранный период
  const topCategory = React.useMemo(() => {
    if (slices.length === 0 || metric === 'status') return null;
    return slices[0];
  }, [slices, metric]);

  // Параметры SVG Donut диаграммы
  const radius = 80;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius; // ~ 502.65

  // Расчет сегментов круга
  const chartSegments = React.useMemo(() => {
    if (totalSliceValue === 0) return [];
    let accumulatedOffset = 0;

    return slices.map((slice) => {
      const percentage = (slice.value / totalSliceValue) * 100;
      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += (percentage / 100) * circumference;

      return {
        ...slice,
        percentage: Math.round(percentage * 10) / 10,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [slices, totalSliceValue, circumference]);

  // Активный срез при наведении
  const activeSlice = React.useMemo(() => {
    return chartSegments.find((s) => s.id === hoveredSliceId) || null;
  }, [chartSegments, hoveredSliceId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ПАНЕЛЬ УПРАВЛЕНИЯ ПЕРИОДОМ И МЕТРИКОЙ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Фильтр периода */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
          {[
            { id: 'week', label: 'Неделя (7 дн)' },
            { id: 'month', label: 'Месяц (30 дн)' },
            { id: 'quarter', label: 'Квартал' },
            { id: 'all', label: 'Всё время' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeRange(tab.id as TimeRange)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                timeRange === tab.id
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Переключатель разреза диаграммы */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto">
          {[
            { id: 'categories', label: 'Сферы жизни', icon: Layers },
            { id: 'status', label: 'Статус задач', icon: CheckCircle2 },
            { id: 'xp', label: 'Опыт (XP)', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = metric === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setMetric(tab.id as ChartMetric);
                  setHoveredSliceId(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border",
                  isSelected
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* КАРТОЧКИ КЛЮЧЕВЫХ МЕТРИК ЗА ПЕРИОД */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">Опыт за период</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">+{periodXP}</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">XP</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">Задач закрыто</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {filteredCompletedTasks.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">Целей достигнуто</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {filteredCompletedGoals.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">Процент успеха</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {completionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* ГЛАВНЫЙ БЛОК: КРУГОВАЯ ДИАГРАММА + ЛЕГЕНДА */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PieChartIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {metric === 'categories' && 'Круговая диаграмма: Баланс сфер жизни'}
                {metric === 'status' && 'Круговая диаграмма: Статус выполнения'}
                {metric === 'xp' && 'Круговая диаграмма: Распределение опыта'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Наведите или нажмите на сектор круга для детальной информации
              </p>
            </div>
          </div>

          {topCategory && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 self-start sm:self-auto">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span>Лидер: <strong>{topCategory.label}</strong></span>
            </div>
          )}
        </div>

        {totalSliceValue === 0 ? (
          <div className="py-16 text-center">
            <div className="h-16 w-16 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-400">
              <PieChartIcon className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Нет завершённых действий за выбранный период
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Попробуйте выбрать другой период (например, «Всё время») или завершите задачу из фокуса дня!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* SVG DONUT CHART */}
            <div className="md:col-span-6 flex justify-center items-center relative py-2">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                <svg
                  viewBox="0 0 240 240"
                  className="w-full h-full transform -rotate-90 transition-transform duration-500"
                >
                  {/* Фоновая подложка круга */}
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-100 dark:text-slate-700/40"
                  />

                  {/* Секторы круговой диаграммы */}
                  {chartSegments.map((segment) => {
                    const isHovered = hoveredSliceId === segment.id;
                    return (
                      <circle
                        key={segment.id}
                        cx="120"
                        cy="120"
                        r={radius}
                        fill="transparent"
                        stroke={segment.color}
                        strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                        strokeDasharray={segment.strokeDasharray}
                        strokeDashoffset={segment.strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-300 cursor-pointer"
                        style={{
                          filter: isHovered ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' : 'none',
                          opacity: hoveredSliceId && !isHovered ? 0.45 : 1,
                        }}
                        onMouseEnter={() => setHoveredSliceId(segment.id)}
                        onMouseLeave={() => setHoveredSliceId(null)}
                        onClick={() => setHoveredSliceId(segment.id === hoveredSliceId ? null : segment.id)}
                      />
                    );
                  })}
                </svg>

                {/* Центр круга с динамической сводкой */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                  {activeSlice ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block line-clamp-1">
                        {activeSlice.label}
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none my-0.5 block">
                        {activeSlice.value}
                        {metric === 'xp' ? ' XP' : ''}
                      </span>
                      <span 
                        className="inline-block text-xs font-extrabold px-2 py-0.5 rounded-full text-white shadow-sm mt-1"
                        style={{ backgroundColor: activeSlice.color }}
                      >
                        {activeSlice.percentage}%
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                        {metric === 'xp' ? 'Всего опыта' : 'Всего закрыто'}
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight block">
                        {totalSliceValue}
                        {metric === 'xp' ? ' XP' : ''}
                      </span>
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block mt-0.5">
                        {metric === 'categories' ? `${slices.length} сфер жизни` : '100% за период'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ИНТЕРАКТИВНАЯ ЛЕГЕНДА С ПРОЦЕНТАМИ И ПОКАЗАТЕЛЯМИ */}
            <div className="md:col-span-6 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Распределение по долям
              </h3>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {chartSegments.map((segment) => {
                  const isHovered = hoveredSliceId === segment.id;
                  return (
                    <div
                      key={segment.id}
                      onMouseEnter={() => setHoveredSliceId(segment.id)}
                      onMouseLeave={() => setHoveredSliceId(null)}
                      onClick={() => setHoveredSliceId(segment.id === hoveredSliceId ? null : segment.id)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer",
                        isHovered
                          ? "bg-indigo-50/70 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-700 shadow-sm scale-[1.01]"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: segment.color }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate block">
                            {segment.label}
                          </span>
                          {segment.secondaryValue && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                              {segment.secondaryValue}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {segment.value} {metric === 'xp' ? 'XP' : 'шт.'}
                        </span>
                        <span
                          className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg text-white"
                          style={{ backgroundColor: segment.color }}
                        >
                          {segment.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ДОПОЛНИТЕЛЬНЫЕ ИНСАЙТЫ ПРОДУКТИВНОСТИ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Инсайт: Точность фокуса */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
            <Target className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Фокусные приоритеты</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {completedFocusTasksCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Задач из «Фокуса дня» успешно выполнено за выбранный отрезок времени.
          </p>
        </div>

        {/* Инсайт: Разнообразие сфер */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Охват сфер жизни</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {slices.length} из {Object.keys(SYSTEM_CATEGORY_MAP).length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Сфер жизни получили внимание и прогресс за текущий период.
          </p>
        </div>

        {/* Инсайт: Средний темп */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Интенсивность</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {timeRange === 'week' ? (
              `${(filteredCompletedTasks.length / 7).toFixed(1)} / день`
            ) : timeRange === 'month' ? (
              `${(filteredCompletedTasks.length / 4.3).toFixed(1)} / нед`
            ) : (
              `${filteredCompletedTasks.length} всего`
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Средняя плотность завершения задач для поддержания непрерывного прогресса.
          </p>
        </div>
      </div>
    </div>
  );
}
