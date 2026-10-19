// client/src/components/goals/GoalsCalendar.tsx
import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useEventStore } from '@/store/useEventStore';
import { 
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday 
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Target, CheckCircle2, 
  Calendar as CalendarIcon, Clock, Check, ListFilter, Search, X, MapPin
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Goal } from '@/types/goal';
import { toISODateString } from '@/utils/date';

interface GoalsCalendarProps {
  onSelectGoal?: (goal: Goal) => void;
}

export function GoalsCalendar({ onSelectGoal }: GoalsCalendarProps) {
  const { goals } = useGoalStore();
  const { tasks } = useTaskStore();
  const { events } = useEventStore();
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [filterType, setFilterType] = React.useState<'all' | 'deadlines' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Переход по месяцам
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  // Дни для календарной сетки
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Начинаем с Понедельника
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = React.useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  // Статистика за текущий месяц
  const monthStats = React.useMemo(() => {
    const currentMonthStr = format(currentMonth, 'yyyy-MM');
    const monthDeadlines = goals.filter(g => g.targetDate?.startsWith(currentMonthStr));
    const monthCompleted = goals.filter(g => 
      (g.completedAt && g.completedAt.startsWith(currentMonthStr)) ||
      (g.status === 'completed' && g.targetDate?.startsWith(currentMonthStr))
    );

    return {
      totalDeadlines: monthDeadlines.length,
      completedGoals: monthCompleted.length,
    };
  }, [goals, currentMonth]);

  // Нормализованный поисковый запрос
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesGoal = React.useCallback((g: Goal) => {
    if (!normalizedQuery) return true;
    return (
      g.title.toLowerCase().includes(normalizedQuery) ||
      (g.description ? g.description.toLowerCase().includes(normalizedQuery) : false) ||
      (g.category ? g.category.toLowerCase().includes(normalizedQuery) : false)
    );
  }, [normalizedQuery]);

  const matchesTask = React.useCallback((t: { title: string; description?: string }) => {
    if (!normalizedQuery) return true;
    return (
      t.title.toLowerCase().includes(normalizedQuery) ||
      (t.description ? t.description.toLowerCase().includes(normalizedQuery) : false)
    );
  }, [normalizedQuery]);

  // Вычисляем цели дня (отмеченные звёздочкой) и все их подцели для отображения задач на сегодня
  const todayIso = toISODateString(new Date());

  const getAllGoalDescendantIds = React.useCallback((goalId: string): string[] => {
    const children = goals.filter((g) => g.parentId === goalId);
    return [goalId, ...children.flatMap((c) => getAllGoalDescendantIds(c.id))];
  }, [goals]);

  const todayGoalHierarchyIds = React.useMemo(() => {
    const todaysRootGoals = goals.filter((g) => g.isTodayGoal === true && !g.parentId);
    const ids = new Set<string>();
    todaysRootGoals.forEach((g) => {
      getAllGoalDescendantIds(g.id).forEach((id) => ids.add(id));
    });
    return ids;
  }, [goals, getAllGoalDescendantIds]);

  // Определение, была ли задача завершена именно в указанную дату
  const isTaskCompletedOnDate = React.useCallback((task: any, dateIso: string): boolean => {
    if (!task.isCompleted) return false;
    if (task.completedAt) {
      try {
        return toISODateString(parseISO(task.completedAt)) === dateIso;
      } catch {
        return false;
      }
    }
    if (task.dueDate) return task.dueDate === dateIso;
    if (task.createdAt) {
      try {
        return toISODateString(parseISO(task.createdAt)) === dateIso;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  // Определение, является ли задача активной для указанной даты
  const isTaskActiveOnDate = React.useCallback((task: any, dateIso: string): boolean => {
    if (task.isCompleted) return false;
    if (task.dueDate === dateIso) return true;
    if (dateIso === todayIso && task.goalId && todayGoalHierarchyIds.has(task.goalId)) {
      return true;
    }
    return false;
  }, [todayIso, todayGoalHierarchyIds]);

  // Цели и задачи на выбранный день
  const selectedDateStr = toISODateString(selectedDate);

  const selectedDayItems = React.useMemo(() => {
    // 1. Цели со сроком (дедлайн) на этот день
    const deadlineGoals = goals.filter(g => g.targetDate === selectedDateStr && g.status !== 'completed' && matchesGoal(g));
    
    // 2. Цели, выполненные в этот день (по completedAt или status === completed)
    const completedGoals = goals.filter(g => 
      ((g.completedAt && toISODateString(parseISO(g.completedAt)) === selectedDateStr) ||
      (g.status === 'completed' && g.targetDate === selectedDateStr && !g.completedAt)) &&
      matchesGoal(g)
    );

    // 3. Задачи, выполненные в этот день (любые выполненные задачи с датой завершения на этот день)
    const completedTasks = tasks.filter(t => 
      isTaskCompletedOnDate(t, selectedDateStr) && matchesTask(t)
    );

    // 4. Запланированные события на этот день
    const dayEvents = events.filter(e => e.eventDate === selectedDateStr);

    // 5. Активные задачи на этот день
    const activeTasks = tasks.filter(t => 
      isTaskActiveOnDate(t, selectedDateStr) && matchesTask(t)
    );

    return {
      deadlineGoals,
      completedGoals,
      completedTasks,
      dayEvents,
      activeTasks,
    };
  }, [goals, tasks, events, selectedDateStr, isTaskCompletedOnDate, isTaskActiveOnDate, matchesGoal, matchesTask]);

  // Результаты поиска по всем датам для быстрых переходов
  const searchResults = React.useMemo(() => {
    if (!normalizedQuery) return [];

    const results: { id: string; title: string; date: string; type: 'deadline' | 'completed' | 'task' }[] = [];

    goals.forEach(g => {
      if (matchesGoal(g)) {
        if (g.targetDate) {
          results.push({ id: `goal-dl-${g.id}`, title: g.title, date: g.targetDate, type: 'deadline' });
        }
        if (g.completedAt) {
          const compDate = toISODateString(parseISO(g.completedAt));
          if (compDate !== g.targetDate) {
            results.push({ id: `goal-comp-${g.id}`, title: g.title, date: compDate, type: 'completed' });
          }
        }
      }
    });

    tasks.forEach(t => {
      if (matchesTask(t)) {
        if (t.isCompleted && t.completedAt) {
          try {
            const compDate = toISODateString(parseISO(t.completedAt));
            results.push({ id: `task-comp-${t.id}`, title: `${t.title} (выполнено)`, date: compDate, type: 'completed' });
          } catch {
            // ignore
          }
        } else if (t.dueDate) {
          results.push({ id: `task-${t.id}`, title: t.title, date: t.dueDate, type: 'task' });
        }
      }
    });

    return results.sort((a, b) => a.date.localeCompare(b.date));
  }, [normalizedQuery, goals, tasks, matchesGoal, matchesTask]);

  const jumpToDate = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      setSelectedDate(d);
      setCurrentMonth(d);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ПАНЕЛЬ УПРАВЛЕНИЯ КАЛЕНДАРЕМ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize truncate">
              {format(currentMonth, 'LLLL yyyy', { locale: ru })}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {monthStats.totalDeadlines} со сроком • {monthStats.completedGoals} выполнено
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Фильтр отображения */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap",
                filterType === 'all' 
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              Все
            </button>
            <button
              onClick={() => setFilterType('deadlines')}
              className={cn(
                "px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap",
                filterType === 'deadlines' 
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              Сроки
            </button>
            <button
              onClick={() => setFilterType('completed')}
              className={cn(
                "px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap",
                filterType === 'completed' 
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              Выполненные
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Предыдущий месяц"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Сегодня
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Следующий месяц"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* СТРОКА ПОИСКА */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по названию цели или задачи..."
          className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            title="Очистить поиск"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* РЕЗУЛЬТАТЫ ПОИСКА (БЫСТРЫЕ ПЕРЕХОДЫ) */}
      {normalizedQuery && (
        <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3 text-xs animate-in fade-in duration-200">
          <div className="font-semibold text-indigo-950 dark:text-indigo-200 mb-2 flex items-center justify-between">
            <span>
              Результаты поиска: {searchResults.length > 0 ? `найдено ${searchResults.length}` : 'совпадений не найдено'}
            </span>
            <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
              {searchResults.length > 0 && 'Кликните для перехода к дате'}
            </span>
          </div>

          {searchResults.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => jumpToDate(item.date)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-left transition-all border flex items-center gap-1.5",
                    item.type === 'deadline' && "bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50",
                    item.type === 'completed' && "bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/50",
                    item.type === 'task' && "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50",
                    selectedDateStr === item.date && "ring-2 ring-indigo-500 font-bold"
                  )}
                >
                  <span className="font-semibold text-[10px] text-slate-500 dark:text-slate-400">
                    {format(parseISO(item.date), 'dd.MM')}
                  </span>
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{item.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              По запросу «{searchQuery}» целей или задач с датами не найдено.
            </p>
          )}
        </div>
      )}

      {/* СЕТКА КАЛЕНДАРЯ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Заголовки дней недели (Пн, Вт, Ср...) */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
            <div key={day} className="py-2 sm:py-2.5">
              {day}
            </div>
          ))}
        </div>

        {/* Ячейки дней */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-700/60 border-b border-slate-200 dark:border-slate-700">
          {calendarDays.map((day) => {
            const dayIso = toISODateString(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            // Цели со сроком в этот день
            const dayDeadlines = goals.filter(g => g.targetDate === dayIso && g.status !== 'completed' && matchesGoal(g));
            // Выполненные цели в этот день
            const dayCompletedGoals = goals.filter(g => 
              ((g.completedAt && toISODateString(parseISO(g.completedAt)) === dayIso) ||
              (g.status === 'completed' && g.targetDate === dayIso)) &&
              matchesGoal(g)
            );
            // Выполненные задачи в этот день
            const dayCompletedTasks = tasks.filter(t => isTaskCompletedOnDate(t, dayIso) && matchesTask(t));
            const dayCompletedCount = dayCompletedGoals.length + dayCompletedTasks.length;

            // Активные задачи в этот день
            const dayActiveTasks = tasks.filter(t => isTaskActiveOnDate(t, dayIso) && matchesTask(t));
            const dayActiveTasksCount = dayActiveTasks.length;

            // События в этот день
            const dayEvents = events.filter(e => e.eventDate === dayIso);
            const dayEventsCount = dayEvents.length;

            const isSearchMatch = Boolean(normalizedQuery && (dayDeadlines.length > 0 || dayCompletedCount > 0 || dayActiveTasksCount > 0 || dayEventsCount > 0));

            const showDeadlines = filterType === 'all' || filterType === 'deadlines';
            const showCompleted = filterType === 'all' || filterType === 'completed';

            const hasItems = (showDeadlines && dayDeadlines.length > 0) || 
                             (showCompleted && dayCompletedCount > 0) || 
                             dayEventsCount > 0 ||
                             dayActiveTasksCount > 0;

            return (
              <div
                key={dayIso}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "min-h-[58px] sm:min-h-[105px] p-1 sm:p-1.5 transition-all cursor-pointer flex flex-col justify-between group",
                  !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/30 opacity-40",
                  isSelected 
                    ? "bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-inset ring-indigo-500" 
                    : isSearchMatch
                      ? "bg-amber-50/50 dark:bg-amber-950/25 ring-2 ring-inset ring-amber-400 dark:ring-amber-500/70"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/60",
                  isCurrentDay && !isSelected && "bg-blue-50/30 dark:bg-blue-950/20"
                )}
              >
                {/* Номер дня + индикаторы-кружочки */}
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <span
                    className={cn(
                      "text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full transition-colors",
                      isCurrentDay 
                        ? "bg-indigo-600 text-white font-bold" 
                        : isSelected 
                          ? "text-indigo-600 dark:text-indigo-400 font-bold"
                          : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Кружочки событий, задач и выполненного на десктопе */}
                  <div className="hidden sm:flex items-center gap-1">
                    {dayEventsCount > 0 && (
                      <span className="h-2 w-2 rounded-full bg-amber-500 ring-1 ring-amber-300 shadow-sm" title={`${dayEventsCount} событий / встреч`} />
                    )}
                    {dayActiveTasksCount > 0 && (
                      <span className="h-2 w-2 rounded-full bg-purple-500 ring-1 ring-purple-300 shadow-sm" title={`${dayActiveTasksCount} активных задач`} />
                    )}
                    {dayCompletedCount > 0 && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-emerald-300 shadow-sm" title={`${dayCompletedCount} выполнено (${dayCompletedGoals.length} целей, ${dayCompletedTasks.length} задач)`} />
                    )}
                  </div>
                </div>

                {/* Значки событий для планшетов и ПК (sm:block) */}
                <div className="hidden sm:block space-y-1 overflow-hidden">
                  {/* События и встречи (Оранжевые) */}
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded truncate bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300/70 dark:border-amber-800 flex items-center gap-1"
                      title={`Событие: ${e.title} ${e.eventTime ? '(' + e.eventTime + ')' : ''}`}
                    >
                      <span className="text-[9px]">📅</span>
                      <span className="truncate">{e.title}</span>
                    </div>
                  ))}

                  {/* Сроки целей */}
                  {showDeadlines && dayDeadlines.slice(0, 2).map((g) => (
                    <div
                      key={g.id}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-200/50 dark:border-indigo-800 flex items-center gap-1"
                      title={`Срок: ${g.title}`}
                    >
                      <Target className="h-2.5 w-2.5 shrink-0 text-indigo-500" />
                      <span className="truncate">{g.title}</span>
                    </div>
                  ))}

                  {/* Достигнутые цели */}
                  {showCompleted && dayCompletedGoals.slice(0, 2).map((g) => (
                    <div
                      key={g.id}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200/50 dark:border-emerald-800 flex items-center gap-1"
                      title={`Цель выполнена: ${g.title}`}
                    >
                      <Check className="h-2.5 w-2.5 shrink-0 text-emerald-600" />
                      <span className="truncate">{g.title}</span>
                    </div>
                  ))}

                  {/* Выполненные задачи (если нет выполненных целей или осталось место) */}
                  {showCompleted && dayCompletedGoals.length < 2 && dayCompletedTasks.slice(0, 2 - dayCompletedGoals.length).map((t) => (
                    <div
                      key={t.id}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1"
                      title={`Задача выполнена: ${t.title}`}
                    >
                      <Check className="h-2.5 w-2.5 shrink-0 text-emerald-600" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}

                  {/* Если больше 2 элементов */}
                  {(dayEventsCount + (showDeadlines ? dayDeadlines.length : 0) + (showCompleted ? dayCompletedCount : 0)) > 2 && (
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium pl-1">
                      +ещё {(dayEventsCount + (showDeadlines ? dayDeadlines.length : 0) + (showCompleted ? dayCompletedCount : 0)) - 2}
                    </div>
                  )}
                </div>

                {/* Цветные точки событий для смартфонов (sm:hidden) */}
                <div className="sm:hidden flex flex-wrap justify-center items-center gap-1 py-0.5">
                  {dayEventsCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 ring-1 ring-amber-300 shadow-sm" title={`${dayEventsCount} событий`} />
                  )}
                  {dayActiveTasksCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-purple-500 ring-1 ring-purple-300 shadow-sm" title={`${dayActiveTasksCount} активных задач`} />
                  )}
                  {showDeadlines && dayDeadlines.slice(0, 1).map((g) => (
                    <span key={g.id} className="h-1.5 w-1.5 rounded-full bg-indigo-500" title={`Срок: ${g.title}`} />
                  ))}
                  {showCompleted && dayCompletedCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-emerald-300 shadow-sm" title={`${dayCompletedCount} выполнено`} />
                  )}
                </div>

                {/* Маркер наличия задач */}
                <div className="h-1 mt-auto hidden sm:block">
                  {hasItems && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mx-auto" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Легенда кружочков/меток календаря */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-1 ring-amber-300" />
              <span>Оранжевый: События и встречи</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500 ring-1 ring-purple-300" />
              <span>Фиолетовый: Активные задачи</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span>Синий: Сроки целей</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-emerald-300" />
              <span>Зеленый: Выполненные цели и задачи</span>
            </div>
          </div>
        </div>
      </div>

      {/* ДЕТАЛИ ВЫБРАННОГО ДНЯ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              События на {format(selectedDate, 'd MMMM yyyy (EEEE)', { locale: ru })}
            </h3>
          </div>
          {isToday(selectedDate) && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
              Сегодня
            </span>
          )}
        </div>

        {selectedDayItems.deadlineGoals.length === 0 && 
         selectedDayItems.completedGoals.length === 0 && 
         selectedDayItems.completedTasks.length === 0 &&
         selectedDayItems.dayEvents.length === 0 &&
         selectedDayItems.activeTasks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
            <p>На этот день нет запланированных событий, сроков выполнения и задач.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Сроки выполнения целей на этот день */}
            {selectedDayItems.deadlineGoals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-indigo-500" />
                  Срок выполнения целей ({selectedDayItems.deadlineGoals.length})
                </h4>
                <div className="space-y-2">
                  {selectedDayItems.deadlineGoals.map((g) => (
                    <div
                      key={g.id}
                      onClick={() => onSelectGoal && onSelectGoal(g)}
                      className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/40 dark:bg-slate-700/50 dark:border-slate-600 hover:border-indigo-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {g.title}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-2">
                          {g.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Достигнутые цели и выполненные задачи в этот день */}
            {(selectedDayItems.completedGoals.length > 0 || selectedDayItems.completedTasks.length > 0) && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Выполнено в этот день ({selectedDayItems.completedGoals.length + selectedDayItems.completedTasks.length})
                </h4>
                <div className="space-y-2">
                  {/* Выполненные цели */}
                  {selectedDayItems.completedGoals.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/60"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 line-through truncate">
                          {g.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 pl-7">
                        Цель успешно достигнута! 🏆
                      </p>
                    </div>
                  ))}

                  {/* Выполненные задачи */}
                  {selectedDayItems.completedTasks.map((t) => {
                    const parentGoal = t.goalId ? goals.find((g) => g.id === t.goalId) : null;
                    return (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-800/50 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                          <div className="truncate">
                            <span className="text-sm font-medium text-emerald-950 dark:text-emerald-200 line-through truncate block">
                              {t.title}
                            </span>
                            {parentGoal && (
                              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/70 truncate block">
                                Внутри цели: {parentGoal.title}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 shrink-0">
                          Выполнено ✓
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. События дня */}
            {selectedDayItems.dayEvents.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  События и встречи ({selectedDayItems.dayEvents.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDayItems.dayEvents.map((e) => (
                    <div
                      key={e.id}
                      className={cn(
                        "p-3 rounded-xl border text-sm flex items-center justify-between gap-2.5",
                        e.isCompleted
                          ? "bg-slate-50 border-slate-200 text-slate-400 line-through dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-500"
                          : "bg-amber-50/60 border-amber-200 text-slate-800 dark:bg-amber-950/20 dark:border-amber-800/50 dark:text-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">📅</span>
                        <span className="font-semibold truncate">{e.title}</span>
                      </div>
                      {e.eventTime && (
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                          {e.eventTime}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Активные задачи на этот день */}
            {selectedDayItems.activeTasks.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ListFilter className="h-3.5 w-3.5 text-purple-500" />
                  Активные задачи на этот день ({selectedDayItems.activeTasks.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDayItems.activeTasks.map((t) => {
                    const parentGoal = t.goalId ? goals.find((g) => g.id === t.goalId) : null;
                    return (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-sm flex items-center justify-between gap-2.5 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 truncate">
                            <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0" />
                            <span className="truncate font-medium">{t.title}</span>
                          </div>
                          {parentGoal && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 pl-6 truncate block">
                              Цель: {parentGoal.title}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => useTaskStore.getState().toggleComplete(t.id)}
                          className="text-xs px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 font-semibold transition-colors shrink-0"
                          title="Отметить выполненной"
                        >
                          Завершить
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
