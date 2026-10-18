// client/src/components/events/EventsWidget.tsx
import * as React from 'react';
import { useEventStore } from '@/store/useEventStore';
import type { AppEvent } from '@/types/event';
import { 
  Calendar, Clock, Bell, Plus, Check, ChevronDown, ChevronUp, 
  MapPin, Sparkles, Pencil, CheckCircle2 
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { toISODateString } from '@/utils/date';
import { differenceInCalendarDays, parseISO, format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { playLevelUpSound, triggerHaptic } from '@/utils/soundEffects';
import { EventFormModal } from './EventFormModal';

interface EventsWidgetProps {
  onOpenCreateModal?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  personal: '👤',
  meeting: '📸',
  health: '🏃',
  work: '💼',
  other: '🌟',
};

export function EventsWidget({}: EventsWidgetProps) {
  const { events, toggleComplete } = useEventStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<AppEvent | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'week' | 'today'>('week');
  const [floatingXPEventId, setFloatingXPEventId] = React.useState<string | null>(null);

  const today = new Date();
  const todayIso = toISODateString(today);
  const next7DaysIso = toISODateString(addDays(today, 7));

  // События на сегодня
  const todaysEvents = React.useMemo(() => {
    return events.filter((e) => e.eventDate === todayIso);
  }, [events, todayIso]);

  // Предстоящие события на следующие 7 дней (включая сегодня)
  const upcomingWeekEvents = React.useMemo(() => {
    return events
      .filter((e) => e.eventDate >= todayIso && e.eventDate <= next7DaysIso)
      .sort((a, b) => {
        const dateCmp = a.eventDate.localeCompare(b.eventDate);
        if (dateCmp !== 0) return dateCmp;
        return (a.eventTime || '').localeCompare(b.eventTime || '');
      });
  }, [events, todayIso, next7DaysIso]);

  const displayedEvents = activeTab === 'today' ? todaysEvents : upcomingWeekEvents;
  const incompleteUpcomingCount = upcomingWeekEvents.filter((e) => !e.isCompleted).length;

  const handleCompleteEvent = async (event: AppEvent) => {
    const willBeCompleted = !event.isCompleted;

    if (willBeCompleted) {
      // Праздничный салют и звук мгновенно!
      playLevelUpSound();
      triggerHaptic('success');
      setFloatingXPEventId(event.id);
      setTimeout(() => setFloatingXPEventId(null), 2000);

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });
    }

    try {
      await toggleComplete(event.id);
    } catch (err) {
      console.error('Failed to toggle event complete:', err);
    }
  };

  const handleEdit = (event: AppEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  return (
    <div className={cn(
      "mb-8 rounded-2xl border transition-all overflow-hidden shadow-sm",
      "bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/40 border-indigo-200/80",
      "dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900 dark:border-slate-700/80"
    )}>
      {/* Шапка виджета (Аккордеон) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-indigo-100/60 dark:border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                События и встречи
              </h2>
              {incompleteUpcomingCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {incompleteUpcomingCount} впереди
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Стрижка, съемка, встречи — всё под контролем и с напоминанием за 2 дня
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Кнопка добавления нового события */}
          <button
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Событие</span>
          </button>

          {/* Сворачивание / Разворачивание */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
            title={isCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Тело виджета */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Фильтр: 7 дней или Сегодня */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('week')}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
                  activeTab === 'week'
                    ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                Ближайшие 7 дней ({upcomingWeekEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('today')}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
                  activeTab === 'today'
                    ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                Сегодня ({todaysEvents.length})
              </button>
            </div>

            <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Награда: <span className="text-amber-600 dark:text-amber-400 font-bold">+20 XP</span> за посещение
            </span>
          </div>

          {/* Список событий */}
          {displayedEvents.length === 0 ? (
            <div className="text-center py-7 px-4 rounded-xl border border-dashed border-indigo-200/60 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40">
              <Calendar className="h-7 w-7 text-indigo-300 dark:text-slate-600 mx-auto mb-1.5" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {activeTab === 'today' ? 'На сегодня нет запланированных событий' : 'На ближайшие 7 дней ничего не запланировано'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Запланируйте стрижку, фотосессию, поездку или встречу
              </p>
              <button
                type="button"
                onClick={handleAddNew}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs font-semibold transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Запланировать событие</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedEvents.map((event) => {
                const eventDate = parseISO(event.eventDate);
                const diffDays = differenceInCalendarDays(eventDate, today);
                const isToday = diffDays === 0;
                const icon = CATEGORY_ICONS[event.category] || '🌟';

                // Подпись срока
                let timeBadge = '';
                if (isToday) timeBadge = 'Сегодня 📍';
                else if (diffDays === 1) timeBadge = 'Завтра ⏳';
                else if (diffDays > 1) timeBadge = `Через ${diffDays} дн.`;
                else timeBadge = 'Прошедшее';

                const isFloatingXP = floatingXPEventId === event.id;

                return (
                  <div
                    key={event.id}
                    className={cn(
                      "group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border transition-all",
                      event.isCompleted
                        ? "bg-slate-50/80 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/60 opacity-60"
                        : isToday
                        ? "bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-amber-300/80 dark:border-amber-700/60 shadow-sm"
                        : "bg-white border-slate-200/90 dark:bg-slate-800 dark:border-slate-700 hover:shadow-md"
                    )}
                  >
                    {/* Анимация всплывающего XP */}
                    {isFloatingXP && (
                      <div className="absolute top-2 right-4 -translate-y-4 flex items-center gap-1 text-sm font-black text-amber-500 animate-bounce pointer-events-none z-20">
                        <Sparkles className="h-4 w-4" />
                        <span>+20 XP</span>
                      </div>
                    )}

                    <div>
                      {/* Верхняя строка: дата, время, статус */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                            isToday
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-400/40"
                              : diffDays === 1
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          )}>
                            {timeBadge}
                          </span>

                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {format(eventDate, 'EEEE, d MMMM', { locale: ru })}
                          </span>

                          {event.eventTime && (
                            <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              <Clock className="h-3 w-3" />
                              <span>{event.eventTime}</span>
                            </span>
                          )}
                        </div>

                        {/* Кнопка редактирования */}
                        <button
                          type="button"
                          onClick={() => handleEdit(event)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-all"
                          title="Редактировать событие"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Название события */}
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-lg leading-none shrink-0 mt-0.5">{icon}</span>
                        <div className="min-w-0">
                          <h3 className={cn(
                            "text-sm font-bold text-slate-900 dark:text-white leading-snug break-words",
                            event.isCompleted && "line-through text-slate-500 dark:text-slate-400"
                          )}>
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Нижняя панель действия */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                      {event.remindDaysBefore > 0 ? (
                        <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium" title="Системное напоминание включено">
                          <Bell className="h-3 w-3" />
                          <span>Напоминание за {event.remindDaysBefore} дн.</span>
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Кнопка "Я на месте! / Посетил" */}
                      <button
                        type="button"
                        onClick={() => handleCompleteEvent(event)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm",
                          event.isCompleted
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : isToday
                            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25 animate-pulse"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        )}
                      >
                        {event.isCompleted ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Посещено (+20 XP)</span>
                          </>
                        ) : isToday ? (
                          <>
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Я на месте! (+20 XP)</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Отметить явку</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно редактирования/создания */}
      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        eventToEdit={editingEvent}
      />
    </div>
  );
}
