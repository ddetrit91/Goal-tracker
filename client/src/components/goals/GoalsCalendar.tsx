// client/src/components/goals/GoalsCalendar.tsx
import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { useTaskStore } from '@/store/useTaskStore';
import { 
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday 
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Target, CheckCircle2, 
  Calendar as CalendarIcon, Clock, Check, ListFilter
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
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [filterType, setFilterType] = React.useState<'all' | 'deadlines' | 'completed'>('all');

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

  // Цели и задачи на выбранный день
  const selectedDateStr = toISODateString(selectedDate);

  const selectedDayItems = React.useMemo(() => {
    // 1. Цели со сроком (дедлайн) на этот день
    const deadlineGoals = goals.filter(g => g.targetDate === selectedDateStr);
    
    // 2. Цели, выполненные в этот день (по completedAt или status === completed)
    const completedGoals = goals.filter(g => 
      (g.completedAt && toISODateString(parseISO(g.completedAt)) === selectedDateStr) ||
      (g.status === 'completed' && g.targetDate === selectedDateStr && !g.completedAt)
    );

    // 3. Задачи, назначенные на этот день
    const dayTasks = tasks.filter(t => t.dueDate === selectedDateStr);

    return {
      deadlineGoals,
      completedGoals,
      dayTasks,
    };
  }, [goals, tasks, selectedDateStr]);

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
            const dayDeadlines = goals.filter(g => g.targetDate === dayIso && g.status !== 'completed');
            // Выполненные цели в этот день
            const dayCompleted = goals.filter(g => 
              (g.completedAt && toISODateString(parseISO(g.completedAt)) === dayIso) ||
              (g.status === 'completed' && g.targetDate === dayIso)
            );
            // Задачи в этот день
            const dayTasksCount = tasks.filter(t => t.dueDate === dayIso).length;

            const showDeadlines = filterType === 'all' || filterType === 'deadlines';
            const showCompleted = filterType === 'all' || filterType === 'completed';

            const hasItems = (showDeadlines && dayDeadlines.length > 0) || 
                             (showCompleted && dayCompleted.length > 0) || 
                             dayTasksCount > 0;

            return (
              <div
                key={dayIso}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "min-h-[58px] sm:min-h-[105px] p-1 sm:p-1.5 transition-all cursor-pointer flex flex-col justify-between group",
                  !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/30 opacity-40",
                  isSelected 
                    ? "bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-inset ring-indigo-500" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/60",
                  isCurrentDay && !isSelected && "bg-blue-50/30 dark:bg-blue-950/20"
                )}
              >
                {/* Номер дня */}
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

                  {dayTasksCount > 0 && (
                    <span className="hidden sm:inline text-[10px] font-medium text-slate-400 dark:text-slate-500" title={`${dayTasksCount} задач`}>
                      {dayTasksCount} зад.
                    </span>
                  )}
                </div>

                {/* Значки событий для планшетов и ПК (sm:block) */}
                <div className="hidden sm:block space-y-1 overflow-hidden">
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
                  {showCompleted && dayCompleted.slice(0, 2).map((g) => (
                    <div
                      key={g.id}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200/50 dark:border-emerald-800 flex items-center gap-1"
                      title={`Выполнена: ${g.title}`}
                    >
                      <Check className="h-2.5 w-2.5 shrink-0 text-emerald-600" />
                      <span className="truncate">{g.title}</span>
                    </div>
                  ))}

                  {/* Если больше 2 элементов */}
                  {((showDeadlines ? dayDeadlines.length : 0) + (showCompleted ? dayCompleted.length : 0)) > 2 && (
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium pl-1">
                      +ещё {((showDeadlines ? dayDeadlines.length : 0) + (showCompleted ? dayCompleted.length : 0)) - 2}
                    </div>
                  )}
                </div>

                {/* Цветные точки событий для смартфонов (sm:hidden) */}
                <div className="sm:hidden flex flex-wrap justify-center items-center gap-1 py-0.5">
                  {showDeadlines && dayDeadlines.slice(0, 2).map((g) => (
                    <span key={g.id} className="h-1.5 w-1.5 rounded-full bg-indigo-500" title={`Срок: ${g.title}`} />
                  ))}
                  {showCompleted && dayCompleted.slice(0, 2).map((g) => (
                    <span key={g.id} className="h-1.5 w-1.5 rounded-full bg-emerald-500" title={`Выполнена: ${g.title}`} />
                  ))}
                  {dayTasksCount > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" title={`${dayTasksCount} задач`} />
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
         selectedDayItems.dayTasks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
            <p>На этот день нет запланированных сроков выполнения и задач.</p>
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

            {/* 2. Достигнутые цели в этот день (ретроспектива) */}
            {selectedDayItems.completedGoals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Выполненные цели ({selectedDayItems.completedGoals.length})
                </h4>
                <div className="space-y-2">
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
                        Успешно достигнута! 🏆
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Задачи дня */}
            {selectedDayItems.dayTasks.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ListFilter className="h-3.5 w-3.5 text-blue-500" />
                  Задачи на этот день ({selectedDayItems.dayTasks.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDayItems.dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "p-2.5 rounded-lg border text-sm flex items-center gap-2.5",
                        t.isCompleted 
                          ? "bg-slate-50 border-slate-200 text-slate-400 line-through dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-500"
                          : "bg-white border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      )}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                        t.isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 dark:border-slate-600"
                      )}>
                        {t.isCompleted && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
