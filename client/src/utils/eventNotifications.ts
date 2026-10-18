// client/src/utils/eventNotifications.ts
import type { AppEvent } from '@/types/event';
import { differenceInCalendarDays, parseISO, startOfDay, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { sendSystemNotification } from './activityReminder';

const SENT_REMINDERS_KEY = 'gt_sent_event_reminders';

interface SentReminderRecord {
  [key: string]: number; // key: `${eventId}_${diffDays}_${dateStr}` -> timestamp
}

function getSentRecords(): SentReminderRecord {
  try {
    const raw = localStorage.getItem(SENT_REMINDERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function markReminderSent(key: string) {
  try {
    const records = getSentRecords();
    records[key] = Date.now();
    localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

/**
 * Проверяет события и при необходимости отправляет системные Web Push / Desktop уведомления
 */
export function checkAndNotifyUpcomingEvents(events: AppEvent[]) {
  if (typeof window === 'undefined' || !events || events.length === 0) return;

  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');
  const sentRecords = getSentRecords();

  events.forEach((event) => {
    if (event.isCompleted || !event.eventDate) return;

    try {
      const eventDate = startOfDay(parseISO(event.eventDate));
      const diffDays = differenceInCalendarDays(eventDate, today);

      // 1. Напоминание в день события (сегодня)
      if (diffDays === 0) {
        const key = `${event.id}_today_${todayStr}`;
        if (!sentRecords[key]) {
          markReminderSent(key);
          const timeText = event.eventTime ? ` в ${event.eventTime}` : '';
          const title = '📍 Событие сегодня!';
          const body = `Сегодня${timeText} у вас запланировано: ${event.title}`;
          sendSystemNotification(title, body);
        }
        return;
      }

      // 2. Предварительное напоминание (за remindDaysBefore дней, по умолчанию за 2 дня)
      const remindDays = event.remindDaysBefore ?? 2;
      if (remindDays > 0 && diffDays === remindDays) {
        const key = `${event.id}_before_${diffDays}_${todayStr}`;
        if (!sentRecords[key]) {
          markReminderSent(key);
          const formattedDate = format(eventDate, 'd MMMM', { locale: ru });
          const timeText = event.eventTime ? ` в ${event.eventTime}` : '';
          const daysWord = diffDays === 1 ? 'день' : diffDays >= 2 && diffDays <= 4 ? 'дня' : 'дней';
          const title = `🔔 Напоминание о событии (через ${diffDays} ${daysWord})`;
          const body = `${formattedDate}${timeText} — ${event.title}. Не забудьте подготовиться!`;
          sendSystemNotification(title, body);
        }
      }
    } catch (e) {
      console.warn('Error checking event notification:', e);
    }
  });
}

/**
 * Запрос разрешения на получение системных уведомлений
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const res = await Notification.requestPermission();
    return res === 'granted';
  }

  return false;
}
