// client/src/components/events/EventsFullView.tsx
import * as React from 'react';
import { useEventStore } from '@/store/useEventStore';
import type { AppEvent } from '@/types/event';
import { 
  Calendar, Clock, Bell, Plus, Check, MapPin, 
  Sparkles, Pencil, CheckCircle2, Trash2, CalendarDays 
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { toISODateString } from '@/utils/date';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { playLevelUpSound, triggerHaptic } from '@/utils/soundEffects';
import { EventFormModal } from './EventFormModal';

const CATEGORIES = [
  { id: 'all', label: 'Все категории', icon: '✨' },
  { id: 'meeting', label: 'Встречи / Съемки', icon: '📸' },
  { id: 'personal', label: 'Личное', icon: '👤' },
  { id: 'health', label: 'Здоровье / Спорт', icon: '🏃' },
  { id: 'work', label: 'Работа', icon: '💼' },
  { id: 'other', label: 'Другое', icon: '🌟' },
];

export function EventsFullView() {
  const { events, toggleComplete, deleteEvent } = useEventStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<AppEvent | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [tab, setTab] = React.useState<'upcoming' | 'completed'>('upcoming');
  const [floatingXPEventId, setFloatingXPEventId] = React.useState<string | null>(null);

  const today = new Date();
  const todayIso = toISODateString(today);

  // Фильтрация
  const filteredEvents = React.useMemo(() => {
    return events
      .filter((e) => {
        // Фильтр по категории
        if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
        // Фильтр по статусу
        if (tab === 'upcoming') {
          return !e.isCompleted;
        } else {
          return e.isCompleted;
        }
      })
      .sort((a, b) => {
        if (tab === 'upcoming') {
          const dateCmp = a.eventDate.localeCompare(b.eventDate);
          if (dateCmp !== 0) return dateCmp;
          return (a.eventTime || '').localeCompare(b.eventTime || '');
        } else {
          // Завершенные: самые свежие сверху
          const dateCmp = b.eventDate.localeCompare(a.eventDate);
          if (dateCmp !== 0) return dateCmp;
          return (b.eventTime || '').localeCompare(a.eventTime || '');
        }
      });
  }, [events, selectedCategory, tab]);

  // Статистика
  const totalUpcoming = events.filter((e) => !e.isCompleted).length;
  const totalCompleted = events.filter((e) => e.isCompleted).length;
  const todaysCount = events.filter((e) => e.eventDate === todayIso && !e.isCompleted).length;

  const handleCompleteEvent = async (event: AppEvent) => {
    const willBeCompleted = !event.isCompleted;

    if (willBeCompleted) {
      playLevelUpSound();
      triggerHaptic('success');
      setFloatingXPEventId(event.id);
      setTimeout(() => setFloatingXPEventId(null), 2000);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#6366f1', '#10b981', '#ec4899'],
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

  const handleDelete = async (event: AppEvent) => {
    if (!window.confirm(`Удалить событие «${event.title}»?`)) return;
    try {
      await deleteEvent(event.id);
      window.dispatchEvent(
        new CustomEvent('show-toast', { detail: { message: 'Событие удалено' } })
      );
    } catch (err) {
      console.error('Delete event error:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Статистические карточки */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-300/70 dark:border-amber-800/60 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Сегодня</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200">
            {todaysCount}
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400 hidden sm:block">
            {todaysCount === 1 ? 'событие сегодня' : 'событий сегодня'}
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-indigo-500/10 border border-indigo-300/70 dark:border-indigo-800/60 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Впереди</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-900 dark:text-indigo-200">
            {totalUpcoming}
          </div>
          <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400 hidden sm:block">
            запланировано
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300/70 dark:border-emerald-800/60 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Посещено</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-200">
            +{totalCompleted * 20} <span className="text-xs font-bold text-emerald-600">XP</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 hidden sm:block">
            {totalCompleted} выполнено
          </p>
        </div>
      </div>

      {/* Панель управления: Вкладки (ровно 50/50 на мобильных) + Кнопка добавления события */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:flex sm:items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTab('upcoming')}
            className={cn(
              "py-2 sm:py-1.5 px-2 sm:px-4 rounded-lg font-bold transition-all text-center truncate",
              tab === 'upcoming'
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Предстоящие ({totalUpcoming})
          </button>
          <button
            type="button"
            onClick={() => setTab('completed')}
            className={cn(
              "py-2 sm:py-1.5 px-2 sm:px-4 rounded-lg font-bold transition-all text-center truncate",
              tab === 'completed'
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            История ({totalCompleted})
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingEvent(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Новое событие</span>
        </button>
      </div>

      {/* Фильтр по категориям */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60"
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Список событий */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <CalendarDays className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {tab === 'upcoming' ? 'Нет предстоящих событий' : 'История посещений пуста'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            {tab === 'upcoming' 
              ? 'Запланируйте стрижку, фотосессию, встречу или тренировку, и система вовремя напомнит вам за 2 дня!' 
              : 'Здесь будут сохраняться все ваши завершённые события и встречи.'}
          </p>
          {tab === 'upcoming' && (
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Запланировать первое событие</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const eventDate = parseISO(event.eventDate);
            const diffDays = differenceInCalendarDays(eventDate, today);
            const isToday = diffDays === 0;
            const isTomorrow = diffDays === 1;

            let badgeText = '';
            if (event.isCompleted) badgeText = 'Посещено ✅';
            else if (isToday) badgeText = 'Сегодня 📍';
            else if (isTomorrow) badgeText = 'Завтра ⏳';
            else if (diffDays > 1) badgeText = `Через ${diffDays} дн.`;
            else badgeText = 'Прошедшее';

            const isFloatingXP = floatingXPEventId === event.id;

            return (
              <div
                key={event.id}
                className={cn(
                  "relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all shadow-sm",
                  event.isCompleted
                    ? "bg-slate-50/80 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/60 opacity-70"
                    : isToday
                    ? "bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-amber-300 dark:border-amber-700/70"
                    : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:shadow-md"
                )}
              >
                {/* Анимация всплывающего XP */}
                {isFloatingXP && (
                  <div className="absolute top-2 right-4 -translate-y-4 flex items-center gap-1 text-sm font-black text-amber-500 animate-bounce pointer-events-none z-20">
                    <Sparkles className="h-4 w-4" />
                    <span>+20 XP</span>
                  </div>
                )}

                {/* Левая часть: дата, время, название и заметки */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={cn(
                    "flex flex-col items-center justify-center h-12 w-12 rounded-xl text-center shrink-0 border",
                    isToday
                      ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/30"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600"
                  )}>
                    <span className="text-[10px] font-bold uppercase leading-none">
                      {format(eventDate, 'MMM', { locale: ru })}
                    </span>
                    <span className="text-base font-black leading-tight">
                      {format(eventDate, 'd')}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider",
                        event.isCompleted
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : isToday
                          ? "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 ring-1 ring-amber-400/40"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      )}>
                        {badgeText}
                      </span>

                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {format(eventDate, 'EEEE', { locale: ru })}
                      </span>

                      {event.eventTime && (
                        <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          <Clock className="h-3 w-3" />
                          <span>{event.eventTime}</span>
                        </span>
                      )}

                      {event.remindDaysBefore > 0 && !event.isCompleted && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <Bell className="h-3 w-3" />
                          <span>за {event.remindDaysBefore} дн.</span>
                        </span>
                      )}
                    </div>

                    <h4 className={cn(
                      "text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight",
                      event.isCompleted && "line-through text-slate-500 dark:text-slate-400"
                    )}>
                      {event.title}
                    </h4>

                    {event.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Правая часть: Действия */}
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60 shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(event)}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Кнопка "Я на месте! / Посетил" */}
                  <button
                    type="button"
                    onClick={() => handleCompleteEvent(event)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm",
                      event.isCompleted
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200"
                        : isToday
                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25 animate-pulse"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    )}
                  >
                    {event.isCompleted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Посещено (+20 XP)</span>
                      </>
                    ) : isToday ? (
                      <>
                        <MapPin className="h-4 w-4" />
                        <span>Я на месте! (+20 XP)</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
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

      {/* Модальное окно создания/редактирования */}
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
