// client/src/types/event.ts

export type EventCategory = 
  | 'personal'
  | 'work'
  | 'health'
  | 'meeting'
  | 'entertainment'
  | 'study'
  | 'other';

export interface AppEvent {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  eventDate: string; // YYYY-MM-DD
  eventTime: string | null; // HH:mm
  remindDaysBefore: number; // 0, 1, 2, 3, etc.
  isCompleted: boolean;
  completedAt: string | null;
  category: string;
  createdAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string | null;
  eventDate: string;
  eventTime?: string | null;
  remindDaysBefore?: number;
  category?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string | null;
  eventDate?: string;
  eventTime?: string | null;
  remindDaysBefore?: number;
  category?: string;
  isCompleted?: boolean;
  completedAt?: string | null;
}
