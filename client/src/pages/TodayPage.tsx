import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTaskStore } from '@/store/useTaskStore';
import { useGoalStore } from '@/store/useGoalStore';
import { useEventStore } from '@/store/useEventStore';
import { DailyFocus } from '@/components/today/DailyFocus';
import { TaskItem } from '@/components/today/TaskItem';
import { QuickTaskInput } from '@/components/today/QuickTaskInput';
import { ProgressBar } from '@/components/common/ProgressBar';
import { TaskEditModal } from '@/components/goals/TaskEditModal';
import { EventsFullView } from '@/components/events/EventsFullView';
import { toISODateString, formatDate } from '@/utils/date';
import { getGamificationStats } from '@/utils/gamification';
import { CalendarDays, CheckCircle2, Target, Sun, Moon, Timer, Calendar, ChevronRight, ChevronDown, MapPin } from 'lucide-react';
import { MorningRitualModal } from '@/components/today/MorningRitualModal';
import { EveningReflectionModal } from '@/components/today/EveningReflectionModal';
import { FocusTimerModal } from '@/components/today/FocusTimerModal';
import { cn } from '@/utils/cn';
import confetti from 'canvas-confetti';
import { playLevelUpSound, triggerHaptic } from '@/utils/soundEffects';
import type { Task } from '@/types/task';
import type { AppEvent } from '@/types/event';

export function TodayPage() {
  const today = toISODateString(new Date());
  
  const { tasks, fetchTasks } = useTaskStore();
  const { goals, fetchGoals, updateGoal } = useGoalStore();
  const { events, toggleComplete: toggleEventComplete } = useEventStore();
  const [viewMode, setViewMode] = React.useState<'tasks' | 'events'>('tasks');
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [floatingGoalXP, setFloatingGoalXP] = React.useState<string | null>(null);
  const [isMorningRitualOpen, setIsMorningRitualOpen] = React.useState(false);
  const [isEveningRitualOpen, setIsEveningRitualOpen] = React.useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = React.useState(false);
  const [focusTask, setFocusTask] = React.useState<Task | null>(null);
  const [showCompletedTodayTasks, setShowCompletedTodayTasks] = React.useState(true);

  React.useEffect(() => {
    Promise.all([fetchTasks(), fetchGoals()]);
  }, [fetchTasks, fetchGoals]);

  // Слушатель завершения сессии глубокого фокуса для обновления уровня и опыта
  React.useEffect(() => {
    const onFocusCompleted = () => {
      fetchTasks();
      fetchGoals();
    };
    window.addEventListener('focus-session-completed', onFocusCompleted);
    return () => window.removeEventListener('focus-session-completed', onFocusCompleted);
  }, [fetchTasks, fetchGoals]);

  // Сброс на режим "Задачи дня" при запуске тура онбординга или переходе по шагам
  React.useEffect(() => {
    const handleResetView = (e?: Event) => {
      const customEvent = e as CustomEvent<{ stepId: string }>;
      if (!customEvent?.detail?.stepId || ['rituals', 'today', 'events', 'welcome'].includes(customEvent.detail.stepId)) {
        setViewMode('tasks');
      }
    };
    window.addEventListener('start-onboarding', handleResetView);
    window.addEventListener('tour-step-change', handleResetView);
    return () => {
      window.removeEventListener('start-onboarding', handleResetView);
      window.removeEventListener('tour-step-change', handleResetView);
    };
  }, []);

  // Автоматический запуск ритуала дня по времени суток (1 раз в день)
  React.useEffect(() => {
    const hour = new Date().getHours();
    const morningKey = `morning_ritual_seen_${today}`;
    const eveningKey = `evening_ritual_seen_${today}`;

    // Утро: с 05:00 до 12:00
    if (hour >= 5 && hour < 12) {
      if (!localStorage.getItem(morningKey)) {
        setIsMorningRitualOpen(true);
        localStorage.setItem(morningKey, 'true');
      }
    } 
    // Вечер: с 20:00 до 04:00
    else if (hour >= 20 || hour < 4) {
      if (!localStorage.getItem(eveningKey)) {
        setIsEveningRitualOpen(true);
        localStorage.setItem(eveningKey, 'true');
      }
    }
  }, [today]);

  // Статистика геймификации и уровень игрока (как на странице "Обзор")
  const gamificationStats = React.useMemo(() => getGamificationStats(goals, tasks, events), [goals, tasks, events]);

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

  // Разделение задач дня: активные (сверху) и выполненные (падают вниз по времени завершения)
  const { activeTodayTasks, completedTodayTasks } = React.useMemo(() => {
    const active = todaysTasks.filter((t) => !t.isCompleted);
    const completed = todaysTasks.filter((t) => t.isCompleted);

    // Сортировка выполненных задач по очерёдности завершения: свежие сверху
    completed.sort((a, b) => {
      const timeA = a.completedAt || a.createdAt || '';
      const timeB = b.completedAt || b.createdAt || '';
      return timeB.localeCompare(timeA);
    });

    return { activeTodayTasks: active, completedTodayTasks: completed };
  }, [todaysTasks]);


  // Активные события на сегодня для компактной плашки в Задачи дня
  const todaysActiveEvents = React.useMemo(() => {
    return events.filter((e) => e.eventDate === today && !e.isCompleted);
  }, [events, today]);

  // Завершение сегодняшнего события прямо из компактной полоски
  const handleCompleteTodayEvent = async (event: AppEvent) => {
    playLevelUpSound();
    triggerHaptic('success');
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#6366f1', '#10b981', '#ec4899'],
    });
    window.dispatchEvent(
      new CustomEvent('show-toast', { detail: { message: `Событие «${event.title}» посещено! +20 XP 🌟` } })
    );
    try {
      await toggleEventComplete(event.id);
    } catch (err) {
      console.error('Failed to complete event:', err);
    }
  };

  // Отметить цель выполненной целиком — только при 100% прогрессе
  const handleToggleGoal = async (goal: (typeof goals)[0]) => {
    const descendantIds = getAllGoalDescendantIds(goal.id);
    const goalTasks = tasks.filter((t) => t.goalId && descendantIds.includes(t.goalId));
    const hasTasks = goalTasks.length > 0;
    const isAllTasksCompleted = hasTasks && goalTasks.every((t) => t.isCompleted);
    const isCurrentlyCompleted = goal.status === 'completed' && (goal.progress ?? 0) >= 100;

    // 1. Если цель уже была завершена (100%) — возвращаем её в работу
    if (isCurrentlyCompleted) {
      await updateGoal(goal.id, { 
        status: 'in_progress',
        progress: hasTasks ? Math.round((goalTasks.filter(t => t.isCompleted).length / goalTasks.length) * 100) : 0,
        completedAt: null
      });
      return;
    }

    // 2. Если у цели есть подзадачи, и они ещё не завершены на 100%
    if (hasTasks && !isAllTasksCompleted) {
      const completedCount = goalTasks.filter((t) => t.isCompleted).length;
      const confirmCompleteAll = window.confirm(
        `В цели «${goal.title}» выполнено ${completedCount} из ${goalTasks.length} подзадач (${goal.progress ?? 0}%).\n\nЗавершить все оставшиеся подзадачи и закрыть цель на 100%?`
      );

      if (!confirmCompleteAll) {
        // Пользователь отменил — цель не закрывается и достижение не выдаётся
        window.dispatchEvent(
          new CustomEvent('show-toast', {
            detail: {
              message: `Цель выполнена на ${goal.progress ?? 0}%. Выполните все подзадачи для достижения 100%!`,
            },
          })
        );
        return;
      }

      // Пользователь подтвердил: завершаем все подзадачи цели, чтобы прогресс стал 100%
      const taskStore = useTaskStore.getState();
      const incompleteTasks = goalTasks.filter((t) => !t.isCompleted);
      await Promise.all(
        incompleteTasks.map((t) =>
          taskStore.updateTask(t.id, {
            isCompleted: true,
            completedAt: new Date().toISOString(),
          })
        )
      );
    }

    // 3. Прогресс гарантированно 100% — празднуем и начисляем XP
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#f59e0b'],
    });
    setFloatingGoalXP(goal.id);
    setTimeout(() => {
      setFloatingGoalXP((prev) => (prev === goal.id ? null : prev));
    }, 2200);

    await updateGoal(goal.id, { 
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString()
    });
  };

  const user = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : '');

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-28 md:pb-6">
      <header className="mb-6 sm:mb-8 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CalendarDays className="h-8 w-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                {displayName ? `Привет, ${displayName}! 👋` : 'Сегодня'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{formatDate(today, 'EEEE, d MMMM yyyy')}</p>
            </div>
          </div>

          {/* Виджет уровня игрока (со страницы "Обзор") */}
          <Link
            to="/analytics"
            data-tour="level-badge"
            className="group shrink-0 flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-amber-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-amber-500/20 border border-indigo-200/80 dark:border-indigo-800/80 transition-all hover:scale-105 active:scale-95 shadow-sm"
            title={`Твой уровень: ${gamificationStats.level} (${gamificationStats.title}). Нажми для перехода в Обзор`}
          >
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-black text-sm sm:text-base shadow-md shadow-indigo-500/30 ring-2 ring-white dark:ring-slate-900">
              <span className="leading-none">{gamificationStats.level}</span>
              <span className="absolute -bottom-1 -right-1 text-[11px] leading-none drop-shadow">
                {gamificationStats.icon}
              </span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 leading-none">
                Уровень {gamificationStats.level}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                {gamificationStats.title}
              </span>
            </div>
          </Link>
        </div>

        {/* Панель продуктивности: Утренний фокус, Помодоро-таймер и Вечерняя рефлексия */}
        <div data-tour="rituals-bar" className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setIsMorningRitualOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-300/70 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98]"
            title="Утренний ритуал дня: Eat That Frog"
          >
            <Sun className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="truncate">🌅 Утро</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFocusTask(null);
              setIsFocusModalOpen(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500/10 to-indigo-500/10 hover:from-teal-500/20 hover:to-indigo-500/20 border border-teal-300/70 dark:border-indigo-800/70 text-teal-900 dark:text-teal-200 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98]"
            title="Запустить режим глубокого фокуса (Помодоро 25 мин)"
          >
            <Timer className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">⏱ Фокус</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEveningRitualOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-300/70 dark:border-indigo-800/70 text-indigo-900 dark:text-indigo-200 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98]"
            title="Вечерняя рефлексия и итоги дня"
          >
            <Moon className="h-4 w-4 text-indigo-500 shrink-0" />
            <span className="truncate">🌙 Вечер</span>
          </button>
        </div>

        {/* Блок фокуса на эффективную цель в едином стиле с "Главные фокусы дня" */}
        <div className={cn(
          "rounded-xl border p-5 transition-colors",
          "bg-slate-100 border-slate-200",
          "dark:bg-slate-800 dark:border-slate-700"
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Фокус на эффективную цель</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800">
              Мотивация
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Каждая великая победа рождается из ежедневного движения. Выбери главные действия на день, сфокусируйся на результате и доведи задуманное до конца!
          </p>
        </div>
      </header>

      {/* Переключатель разделов: Задачи дня vs События и встречи (как Список / Календарь) */}
      <div 
        data-tour="today-events-toggle"
        className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 sm:mb-8"
      >
        <button
          type="button"
          onClick={() => setViewMode('tasks')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center",
            viewMode === 'tasks'
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Задачи дня</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('events')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center",
            viewMode === 'events'
              ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Calendar className="h-4 w-4 text-amber-500" />
          <span>События и встречи</span>
          {events.filter((e) => !e.isCompleted).length > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
              {events.filter((e) => !e.isCompleted).length}
            </span>
          )}
        </button>
      </div>

      {viewMode === 'events' ? (
        <EventsFullView />
      ) : (
        <>
          {/* 1. ГЛАВНЫЕ ФОКУСЫ ДНЯ */}
          <div data-tour="today-focus">
        <DailyFocus onStartFocus={(task) => { setFocusTask(task); setIsFocusModalOpen(true); }} />
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
                  <div className="relative shrink-0 flex items-center justify-center">
                    <button
                      onClick={() => handleToggleGoal(goal)}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                        isCompleted 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "border-slate-300 dark:border-slate-600 hover:border-indigo-500"
                      )}
                      title={
                        isCompleted 
                          ? "Отметить как невыполненную" 
                          : (hasTasks && completedTasksCount < totalTasksCount) 
                            ? `Выполнено ${completedTasksCount} из ${totalTasksCount} подзадач. Нажмите для закрытия цели на 100%` 
                            : "Отметить цель выполненной"
                      }
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>

                    {/* Всплывающий бейдж XP при выполнении цели */}
                    {floatingGoalXP === goal.id && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-bounce">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black shadow-lg bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 text-slate-950 whitespace-nowrap border border-amber-300">
                          +50 XP 🏆
                        </span>
                      </div>
                    )}
                  </div>
                  
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

        {/* Компактная аккуратная полоска событий на сегодня (Идеальный компромисс) */}
        {todaysActiveEvents.length > 0 && (
          <div className="mb-4 space-y-2">
            {todaysActiveEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80 dark:border-amber-700/70 shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 mr-2">
                      📍 {evt.eventTime ? `Сегодня в ${evt.eventTime}` : 'Сегодня'}:
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {evt.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCompleteTodayEvent(evt)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
                    title="Отметить посещение события (+20 XP)"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Я на месте!</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('events')}
                    className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40 transition-colors"
                    title="Открыть все события"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <QuickTaskInput />

        {activeTodayTasks.length === 0 && completedTodayTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 dark:bg-slate-900 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">На сегодня больше нет задач. Отличная работа!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* АКТИВНЫЕ ЗАДАЧИ ДНЯ */}
            {activeTodayTasks.length > 0 && (
              <ul className="space-y-3">
                {activeTodayTasks.map((task) => (
                  <li key={task.id}>
                    <TaskItem 
                      task={task} 
                      onToggleFocus={useTaskStore.getState().toggleDailyFocus} 
                      onEdit={(t) => setEditingTask(t)}
                      onStartFocus={(t) => {
                        setFocusTask(t);
                        setIsFocusModalOpen(true);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}

            {/* ВЫПОЛНЕННЫЕ ЗАДАЧИ ДНЯ: ПАДАЮТ ВНИЗ ПО ОЧЕРЁДНОСТИ ВЫПОЛНЕНИЯ */}
            {completedTodayTasks.length > 0 && (
              <div className="pt-3 mt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Выполненные за сегодня ({completedTodayTasks.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCompletedTodayTasks(!showCompletedTodayTasks)}
                    className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
                  >
                    <span>{showCompletedTodayTasks ? 'Свернуть' : 'Развернуть'}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !showCompletedTodayTasks && "-rotate-90")} />
                  </button>
                </div>

                {showCompletedTodayTasks && (
                  <ul className="space-y-3">
                    {completedTodayTasks.map((task) => (
                      <li key={task.id}>
                        <TaskItem 
                          task={task} 
                          onToggleFocus={useTaskStore.getState().toggleDailyFocus} 
                          onEdit={(t) => setEditingTask(t)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </section>
        </>
      )}

      {/* Модальное окно редактирования задачи */}
      <TaskEditModal 
        isOpen={!!editingTask} 
        onClose={() => setEditingTask(null)} 
        task={editingTask} 
      />

      {/* Модальные окна ритуалов дня */}
      <MorningRitualModal
        isOpen={isMorningRitualOpen}
        onClose={() => setIsMorningRitualOpen(false)}
      />
      <EveningReflectionModal
        isOpen={isEveningRitualOpen}
        onClose={() => setIsEveningRitualOpen(false)}
      />

      {/* Модальное окно режима глубокого фокуса (Помодоро 25 мин) */}
      <FocusTimerModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        initialTask={focusTask}
      />
    </div>
  );
}