// client/src/utils/activityReminder.ts

const LAST_ACTIVE_KEY = 'gt_last_active_time';
const LAST_REMINDER_SHOWN_KEY = 'gt_last_reminder_time';
const REMINDER_COOLDOWN_MS = 2.5 * 60 * 60 * 1000; // 2.5 часа между напоминаниями

export const MOTIVATIONAL_CALLS = [
  'Выдели 5 минут, чтобы сделать ещё один шаг к цели и закрыть фокус дня!',
  'Каждое маленькое действие сегодня приближает твою большую победу. Действуй!',
  'Твой прогресс ждёт тебя! Загляни в список задач и заверши главное.',
  'Не откладывай на завтра то, что сделает тебя сильнее уже сегодня!',
  'Сфокусируйся на результате: один закрытый пункт в списке меняет весь день.',
];

/**
 * Проверяет, прошло ли достаточно времени с последнего визита/активности
 */
export function checkInactivityReminder(): { shouldRemind: boolean; message: string } {
  const now = Date.now();
  const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
  const lastReminderStr = localStorage.getItem(LAST_REMINDER_SHOWN_KEY);

  const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : now;
  const lastReminder = lastReminderStr ? parseInt(lastReminderStr, 10) : 0;

  // Обновляем время последней активности
  localStorage.setItem(LAST_ACTIVE_KEY, now.toString());

  // Если напоминание уже показывалось недавно (меньше 2.5 часов назад)
  if (now - lastReminder < REMINDER_COOLDOWN_MS) {
    return { shouldRemind: false, message: '' };
  }

  // Если пользователя не было более 2 часов
  const inactiveDurationMs = now - lastActive;
  const isInactiveLongEnough = inactiveDurationMs >= 2 * 60 * 60 * 1000;

  if (isInactiveLongEnough) {
    localStorage.setItem(LAST_REMINDER_SHOWN_KEY, now.toString());
    const randomMsg: string = MOTIVATIONAL_CALLS[Math.floor(Math.random() * MOTIVATIONAL_CALLS.length)] ?? 'Выдели 5 минут, чтобы сделать шаг к цели и закрыть фокус дня!';

    // Отправляем системное браузерное уведомление, если есть разрешение
    sendSystemNotification('🎯 Время для шага к цели!', randomMsg);

    return { shouldRemind: true, message: randomMsg };
  }

  return { shouldRemind: false, message: '' };
}

/**
 * Отправляет браузерное Web Notification (PWA / Desktop / Mobile)
 */
export function sendSystemNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
      });
    } catch {
      // ignore
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/icon-192.png',
          });
        } catch {
          // ignore
        }
      }
    });
  }
}
