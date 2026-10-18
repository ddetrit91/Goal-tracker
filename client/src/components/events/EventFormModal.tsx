// client/src/components/events/EventFormModal.tsx
import * as React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useEventStore } from '@/store/useEventStore';
import type { AppEvent } from '@/types/event';
import { Calendar, Bell, Tag, Mic, MicOff, AlignLeft, Trash2 } from 'lucide-react';
import { useSpeechRecognition } from '@/utils/useSpeechRecognition';
import { toISODateString } from '@/utils/date';
import { addDays, nextWednesday, nextSaturday } from 'date-fns';
import { cn } from '@/utils/cn';
import { requestNotificationPermission } from '@/utils/eventNotifications';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: AppEvent | null;
  defaultDate?: string;
}

const CATEGORIES = [
  { id: 'personal', label: 'Личное', icon: '👤', color: 'from-blue-500 to-indigo-600' },
  { id: 'meeting', label: 'Встреча / Съемка', icon: '📸', color: 'from-purple-500 to-pink-600' },
  { id: 'health', label: 'Здоровье / Спорт', icon: '🏃', color: 'from-emerald-500 to-teal-600' },
  { id: 'work', label: 'Работа / Бизнес', icon: '💼', color: 'from-amber-500 to-orange-600' },
  { id: 'other', label: 'Другое', icon: '🌟', color: 'from-slate-500 to-slate-700' },
];

const REMINDER_OPTIONS = [
  { value: 2, label: 'За 2 дня (рекомендуется)' },
  { value: 1, label: 'За 1 день' },
  { value: 0, label: 'В день события' },
  { value: 3, label: 'За 3 дня' },
  { value: 7, label: 'За неделю' },
];

export function EventFormModal({ isOpen, onClose, eventToEdit, defaultDate }: EventFormModalProps) {
  const { createEvent, updateEvent, deleteEvent } = useEventStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [eventDate, setEventDate] = React.useState('');
  const [eventTime, setEventTime] = React.useState('');
  const [remindDaysBefore, setRemindDaysBefore] = React.useState(2);
  const [category, setCategory] = React.useState('personal');

  const handleVoiceResult = React.useCallback((text: string) => {
    setTitle((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const { isListening, isSupported, toggleListening } = useSpeechRecognition(handleVoiceResult);

  // Сброс и заполнение формы
  React.useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setTitle(eventToEdit.title || '');
        setDescription(eventToEdit.description || '');
        setEventDate(eventToEdit.eventDate || toISODateString(new Date()));
        setEventTime(eventToEdit.eventTime || '');
        setRemindDaysBefore(eventToEdit.remindDaysBefore ?? 2);
        setCategory(eventToEdit.category || 'personal');
      } else {
        setTitle('');
        setDescription('');
        setEventDate(defaultDate || toISODateString(new Date()));
        setEventTime('');
        setRemindDaysBefore(2);
        setCategory('personal');
      }
    }
  }, [isOpen, eventToEdit, defaultDate]);

  if (!isOpen) return null;

  const today = new Date();
  const todayIso = toISODateString(today);
  const tomorrowIso = toISODateString(addDays(today, 1));
  const wednesdayIso = toISODateString(nextWednesday(today));
  const saturdayIso = toISODateString(nextSaturday(today));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;

    setIsLoading(true);
    try {
      // Предлагаем включить системные уведомления, если еще не включены
      requestNotificationPermission().catch(() => {});

      if (eventToEdit) {
        await updateEvent(eventToEdit.id, {
          title: title.trim(),
          description: description.trim() || null,
          eventDate,
          eventTime: eventTime || null,
          remindDaysBefore,
          category,
        });
        window.dispatchEvent(
          new CustomEvent('show-toast', { detail: { message: 'Событие обновлено!' } })
        );
      } else {
        await createEvent({
          title: title.trim(),
          description: description.trim() || null,
          eventDate,
          eventTime: eventTime || null,
          remindDaysBefore,
          category,
        });
        window.dispatchEvent(
          new CustomEvent('show-toast', { detail: { message: 'Событие успешно запланировано! 📅' } })
        );
      }
      onClose();
    } catch (err: any) {
      console.error('Save event error:', err);
      window.dispatchEvent(
        new CustomEvent('show-toast', { detail: { message: err?.message || 'Ошибка сохранения события' } })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit) return;
    if (!window.confirm('Удалить это событие?')) return;

    setIsLoading(true);
    try {
      await deleteEvent(eventToEdit.id);
      window.dispatchEvent(
        new CustomEvent('show-toast', { detail: { message: 'Событие удалено' } })
      );
      onClose();
    } catch (err: any) {
      console.error('Delete event error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Редактировать событие' : 'Новое событие или встреча 📅'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Название события */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Название события *
            </label>
            {isSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={cn(
                  "p-1 rounded-md text-xs flex items-center gap-1 transition-colors",
                  isListening 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
                title={isListening ? "Остановить запись" : "Голосовой ввод"}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{isListening ? "Слушаю..." : "Голос"}</span>
              </button>
            )}
          </div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: ✂️ Стрижка или 📸 Фотосессия в студии"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>

        {/* Быстрые чипсы даты */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span>Дата события *</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              type="button"
              onClick={() => setEventDate(todayIso)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium transition-all",
                eventDate === todayIso 
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={() => setEventDate(tomorrowIso)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium transition-all",
                eventDate === tomorrowIso 
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              Завтра
            </button>
            <button
              type="button"
              onClick={() => setEventDate(wednesdayIso)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium transition-all",
                eventDate === wednesdayIso 
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              В среду
            </button>
            <button
              type="button"
              onClick={() => setEventDate(saturdayIso)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium transition-all",
                eventDate === saturdayIso 
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              В субботу
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <div className="relative">
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="Время (опционально)"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Напоминание */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-amber-500" />
            <span>Системное напоминание</span>
          </label>
          <select
            value={remindDaysBefore}
            onChange={(e) => setRemindDaysBefore(parseInt(e.target.value, 10))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            {REMINDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            📱 Отправит системное уведомление на рабочий стол / телефон за выбранный срок
          </p>
        </div>

        {/* Категория */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-indigo-500" />
            <span>Категория</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all text-left",
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/80 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-500 ring-1 ring-indigo-500"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Заметки/Описание (опционально) */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
            <AlignLeft className="h-4 w-4 text-slate-400" />
            <span>Заметки / Локация (опционально)</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Адрес, ссылка или что взять с собой..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>

        {/* Кнопки */}
        <div className="flex items-center justify-between pt-2">
          {eventToEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Удалить</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading || !title.trim() || !eventDate}>
              {isLoading ? 'Сохранение...' : eventToEdit ? 'Сохранить' : 'Запланировать'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
