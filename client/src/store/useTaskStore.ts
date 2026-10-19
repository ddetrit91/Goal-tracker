// client/src/store/useTaskStore.ts
import { create } from 'zustand';
import { useGoalStore } from './useGoalStore';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types/task';

const getUserId = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try { return JSON.parse(userStr).id || null; } 
  catch { return null; }
};

import { API_BASE } from '@/config/api';

interface TaskState {
  tasks: Task[];
  customOrder: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  toggleDailyFocus: (id: string) => Promise<void>;
  getByDate: (date: string) => Task[];
  getDailyFocusByDate: (date: string) => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  customOrder: {},
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    const userId = getUserId();
    if (!userId) {
      set({ tasks: [], isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        headers: { 'X-User-Id': userId }
      });
      
      if (!res.ok) throw new Error('Failed to fetch tasks');
      
      const rawTasks: Task[] = await res.json();
      let customOrder: Record<string, number> = {};
      try {
        const savedOrder = localStorage.getItem(`tasks_order_${userId}`);
        if (savedOrder) customOrder = JSON.parse(savedOrder);
      } catch {
        // ignore
      }

      const tasks = [...rawTasks].sort((a, b) => {
        const orderA = customOrder[a.id] ?? 999999;
        const orderB = customOrder[b.id] ?? 999999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });

      set({ tasks, customOrder, isLoading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Ошибка загрузки задач', 
        isLoading: false 
      });
    }
  },

  createTask: async (data) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': userId 
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка создания задачи');
    }

    const newTask = await res.json();
    set((state) => ({ tasks: [...state.tasks, newTask] }));

    if (newTask.goalId) {
      await useGoalStore.getState().recalculateProgress(newTask.goalId);
    }
    
    return newTask;
  },

  updateTask: async (id, data) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': userId 
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка обновления задачи');
    }

    const updated = await res.json();
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === id ? { ...t, ...updated } : t)
    }));
    
    if (updated.goalId) {
      await useGoalStore.getState().recalculateProgress(updated.goalId);
    }
    
    return updated;
  },

  deleteTask: async (id) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const task = get().tasks.find((t) => t.id === id);

    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': userId }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка удаления задачи');
    }

    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id)
    }));

    if (task?.goalId) {
      await useGoalStore.getState().recalculateProgress(task.goalId);
    }
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const newCompleted = !task.isCompleted;
    const completedAt = newCompleted ? new Date().toISOString() : null;

    // Оптимистичное обновление в store для мгновенного отклика UI
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, isCompleted: newCompleted, completedAt } : t
      ),
    }));

    // Мгновенный пересчет связанной цели и всех вышестоящих родителей
    if (task.goalId) {
      await useGoalStore.getState().recalculateProgress(task.goalId);
    }

    // Отправка на сервер
    try {
      const userId = getUserId();
      if (!userId) return;

      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ isCompleted: newCompleted, completedAt }),
      });

      if (!res.ok) {
        throw new Error('Failed to update task');
      }

      const updated = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
      }));
    } catch (err) {
      console.error('Toggle complete failed:', err);
      // Откат при сетевой ошибке
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, isCompleted: !newCompleted, completedAt: task.completedAt } : t
        ),
      }));
      if (task.goalId) {
        await useGoalStore.getState().recalculateProgress(task.goalId);
      }
    }
  },

  toggleDailyFocus: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const currentFocusCount = get().tasks.filter(
      (t) => t.isDailyFocus && t.dueDate === task.dueDate && !t.isCompleted
    ).length;

    if (!task.isDailyFocus && currentFocusCount >= 3) {
      alert('Нельзя выбрать больше 3 главных фокусов на один день!');
      return;
    }

    await get().updateTask(id, { isDailyFocus: !task.isDailyFocus });
  },

  getByDate: (date) => {
    return get().tasks.filter((t) => t.dueDate === date);
  },

  getDailyFocusByDate: (date) => {
    return get().tasks.filter(
      (t) => t.dueDate === date && t.isDailyFocus && !t.isCompleted
    );
  },
}));