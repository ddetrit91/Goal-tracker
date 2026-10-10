import { create } from 'zustand';
import { getStorageAdapter } from '@/services/storage/repository.factory';
import { useGoalStore } from './useGoalStore';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types/task';

interface TaskState {
  tasks: Task[];
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

const adapter = getStorageAdapter();

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await adapter.tasks.getAll();
      set({ tasks, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch tasks', isLoading: false });
    }
  },

  createTask: async (data) => {
    const newTask = await adapter.tasks.create(data);
    await get().fetchTasks();
    // Если задача привязана к цели, обновляем её прогресс
    if (newTask.goalId) {
      await useGoalStore.getState().recalculateProgress(newTask.goalId);
    }
    return newTask;
  },

  updateTask: async (id, data) => {
    const updated = await adapter.tasks.update(id, data);
    await get().fetchTasks();
    if (updated.goalId) {
      await useGoalStore.getState().recalculateProgress(updated.goalId);
    }
    return updated;
  },

  deleteTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    await adapter.tasks.delete(id);
    await get().fetchTasks();
    if (task?.goalId) {
      await useGoalStore.getState().recalculateProgress(task.goalId);
    }
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedData: UpdateTaskInput = {
      isCompleted: !task.isCompleted,
      completedAt: !task.isCompleted ? new Date().toISOString() : null,
    };

    await adapter.tasks.update(id, updatedData);
    await get().fetchTasks();
    
    if (task.goalId) {
      await useGoalStore.getState().recalculateProgress(task.goalId);
    }
  },

  toggleDailyFocus: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    // Проверка лимита Rule of 3
    const currentFocusCount = get().tasks.filter(
      (t) => t.isDailyFocus && t.dueDate === task.dueDate && !t.isCompleted
    ).length;

    if (!task.isDailyFocus && currentFocusCount >= 3) {
      alert('Нельзя выбрать больше 3 главных фокусов на один день!');
      return;
    }

    await adapter.tasks.update(id, { isDailyFocus: !task.isDailyFocus });
    await get().fetchTasks();
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