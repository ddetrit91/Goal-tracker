import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  isBefore,
  parseISO,
  isValid,
  getMonth,
} from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatDate(dateStr: string | null | undefined, pattern = 'd MMM yyyy'): string {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  if (!isValid(date)) return '';
  return format(date, pattern, { locale: ru });
}

export function formatShortDate(dateStr: string | null | undefined): string {
  return formatDate(dateStr, 'd MMM');
}

export function getCurrentQuarter(): number {
  const month = getMonth(new Date());
  return Math.floor(month / 3) + 1;
}

export function getCurrentSemiAnnual(): 'H1' | 'H2' {
  const month = getMonth(new Date());
  return month < 6 ? 'H1' : 'H2';
}

export function getWeekRange(date: Date = new Date()): { start: string; end: string } {
  return {
    start: format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  };
}

export function getMonthRange(date: Date = new Date()): { start: string; end: string } {
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  };
}

export function getQuarterRange(date: Date = new Date()): { start: string; end: string } {
  return {
    start: format(startOfQuarter(date), 'yyyy-MM-dd'),
    end: format(endOfQuarter(date), 'yyyy-MM-dd'),
  };
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  if (!isValid(date)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return isBefore(date, today);
}

export function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  if (!isValid(date)) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}