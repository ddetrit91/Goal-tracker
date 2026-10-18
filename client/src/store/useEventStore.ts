// client/src/store/useEventStore.ts
import { create } from 'zustand';
import type { AppEvent, CreateEventInput, UpdateEventInput } from '@/types/event';
import { API_BASE } from '@/config/api';

const getUserId = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try { return JSON.parse(userStr).id || null; } 
  catch { return null; }
};

interface EventState {
  events: AppEvent[];
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  createEvent: (data: CreateEventInput) => Promise<AppEvent>;
  updateEvent: (id: string, data: UpdateEventInput) => Promise<AppEvent>;
  deleteEvent: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  getByDate: (date: string) => AppEvent[];
  getUpcomingEvents: (startDate: string, days?: number) => AppEvent[];
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    const userId = getUserId();
    if (!userId) {
      set({ events: [], isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/events`, {
        headers: { 'X-User-Id': userId }
      });
      
      if (!res.ok) throw new Error('Failed to fetch events');
      
      const events: AppEvent[] = await res.json();
      set({ events, isLoading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Ошибка загрузки событий', 
        isLoading: false 
      });
    }
  },

  createEvent: async (data) => {
    const userId = getUserId();
    if (!userId) throw new Error('Пользователь не авторизован');

    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка создания события');
    }

    const created: AppEvent = await res.json();
    set((state) => ({
      events: [...state.events, created].sort((a, b) => {
        const dateCmp = a.eventDate.localeCompare(b.eventDate);
        if (dateCmp !== 0) return dateCmp;
        return (a.eventTime || '').localeCompare(b.eventTime || '');
      }),
    }));

    return created;
  },

  updateEvent: async (id, data) => {
    const userId = getUserId();
    if (!userId) throw new Error('Пользователь не авторизован');

    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка обновления события');
    }

    const updated: AppEvent = await res.json();
    set((state) => ({
      events: state.events
        .map((e) => (e.id === id ? { ...e, ...updated } : e))
        .sort((a, b) => {
          const dateCmp = a.eventDate.localeCompare(b.eventDate);
          if (dateCmp !== 0) return dateCmp;
          return (a.eventTime || '').localeCompare(b.eventTime || '');
        }),
    }));

    return updated;
  },

  deleteEvent: async (id) => {
    const userId = getUserId();
    if (!userId) throw new Error('Пользователь не авторизован');

    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': userId },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка удаления события');
    }

    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    }));
  },

  toggleComplete: async (id) => {
    const event = get().events.find((e) => e.id === id);
    if (!event) return;

    const newCompleted = !event.isCompleted;
    const completedAt = newCompleted ? new Date().toISOString() : null;

    // Оптимистичное обновление UI
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, isCompleted: newCompleted, completedAt } : e
      ),
    }));

    try {
      const userId = getUserId();
      if (!userId) return;

      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ isCompleted: newCompleted, completedAt }),
      });

      if (!res.ok) throw new Error('Failed to update event');

      const updated = await res.json();
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? { ...e, ...updated } : e)),
      }));
    } catch (err) {
      console.error('Toggle complete failed:', err);
      // Откат при сбое сети
      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, isCompleted: !newCompleted, completedAt: event.completedAt } : e
        ),
      }));
    }
  },

  getByDate: (date: string) => {
    return get().events.filter((e) => e.eventDate === date);
  },

  getUpcomingEvents: (startDate: string, days = 7) => {
    const all = get().events;
    // Границы [startDate, endDate]
    const end = new Date(startDate);
    end.setDate(end.getDate() + days);
    const endStr = end.toISOString().split('T')[0] || '';

    return all.filter((e) => e.eventDate >= startDate && e.eventDate <= endStr);
  },
}));
