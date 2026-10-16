// client/src/store/useGoalStore.ts
import { create } from 'zustand';
import type { Goal, CreateGoalInput, UpdateGoalInput } from '@/types/goal';
import { useTaskStore } from './useTaskStore';
import { toISODateString } from '@/utils/date';

const getUserId = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.id || null;
  } catch {
    return null;
  }
};

import { API_BASE } from '@/config/api';

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  createGoal: (data: CreateGoalInput) => Promise<Goal>;
  updateGoal: (id: string, data: UpdateGoalInput) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  recalculateProgress: (goalId: string) => Promise<void>;
  getChildren: (parentId: string) => Goal[];
  getByHorizon: (horizon: Goal['horizon']) => Goal[];
  toggleTodayGoal: (id: string) => Promise<void>; // <-- ДОБАВЛЕНО ОДИН РАЗ
  duplicateGoal: (goalId: string) => Promise<Goal>;
  celebratingGoal: Goal | null;
  setCelebratingGoal: (goal: Goal | null) => void;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,
  celebratingGoal: null,
  setCelebratingGoal: (goal) => set({ celebratingGoal: goal }),

  fetchGoals: async () => {
    const userId = getUserId();
    if (!userId) {
      set({ goals: [], isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/goals`, {
        headers: { 'X-User-Id': userId }
      });
      
      if (!res.ok) throw new Error('Failed to fetch goals');
      
      const goals = await res.json();
      set({ goals, isLoading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Ошибка загрузки целей', 
        isLoading: false 
      });
    }
  },

  createGoal: async (data) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': userId 
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка создания цели');
    }

    const newGoal = await res.json();
    set((state) => ({ goals: [...state.goals, newGoal] }));

    if (newGoal.parentId) {
      await get().recalculateProgress(newGoal.parentId);
    }
    
    return newGoal;
  },

  updateGoal: async (id, data) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const res = await fetch(`${API_BASE}/goals/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': userId 
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Ошибка обновления цели');
      }

      const updated = await res.json();
      const previousGoal = get().goals.find((g) => g.id === id);
      const isNewlyCompleted = 
        (data.status === 'completed' && previousGoal?.status !== 'completed') ||
        (data.progress === 100 && (previousGoal?.progress ?? 0) < 100 && previousGoal?.status !== 'completed');

      if (isNewlyCompleted) {
        set({ celebratingGoal: { ...(previousGoal || {}), ...updated, status: 'completed', progress: 100 } });
      }

      set((state) => ({
        goals: state.goals.map((g) => g.id === id ? { ...g, ...updated } : g)
      }));
      
      if (data.status !== undefined && data.progress === undefined) {
        await get().recalculateProgress(id);
      } else if (updated.parentId && (data.status !== undefined || data.progress !== undefined)) {
        await get().recalculateProgress(updated.parentId);
      }
      
      return updated;
    } catch (err: any) {
      console.error('Update goal failed:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: err.message || 'Не удалось обновить цель' } 
      }));
      throw err;
    }
  },

  deleteGoal: async (id) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const goal = get().goals.find((g) => g.id === id);

    try {
      const res = await fetch(`${API_BASE}/goals/${id}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Ошибка удаления цели');
      }

      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id)
      }));

      if (goal?.parentId) {
        await get().recalculateProgress(goal.parentId);
      }
      
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Цель успешно удалена!' } 
      }));
    } catch (err: any) {
      console.error('Delete goal failed:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: err.message || 'Не удалось удалить цель' } 
      }));
    }
  },

  // Переключение "Цели дня" (Фокус дня)
  toggleTodayGoal: async (id) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;

    const newValue = !goal.isTodayGoal;

    // Оптимистичное обновление UI цели
    set((state) => ({
      goals: state.goals.map((g) => 
        g.id === id ? { ...g, isTodayGoal: newValue } : g
      ),
    }));

    // Находим все подцели любого уровня вложенности
    const allGoals = get().goals;
    const getAllDescendantIds = (parentId: string): string[] => {
      const children = allGoals.filter((g) => g.parentId === parentId);
      return [parentId, ...children.flatMap((c) => getAllDescendantIds(c.id))];
    };
    const goalHierarchyIds = getAllDescendantIds(id);

    const today = toISODateString(new Date());
    const taskStore = useTaskStore.getState();

    try {
      // Синхронизируем задачи этой цели и её подцелей
      if (newValue) {
        // При добавлении цели в фокус дня: назначаем все невыполненные задачи на сегодня
        const tasksToAssign = taskStore.tasks.filter(
          (t) => t.goalId && goalHierarchyIds.includes(t.goalId) && !t.isCompleted && t.dueDate !== today
        );
        await Promise.all(
          tasksToAssign.map((t) => taskStore.updateTask(t.id, { dueDate: today }))
        );
      } else {
        // При снятии цели с фокуса дня: убираем дату у невыполненных задач, назначенных на сегодня
        const tasksToUnassign = taskStore.tasks.filter(
          (t) => t.goalId && goalHierarchyIds.includes(t.goalId) && !t.isCompleted && t.dueDate === today
        );
        await Promise.all(
          tasksToUnassign.map((t) => taskStore.updateTask(t.id, { dueDate: null }))
        );
      }

      const res = await fetch(`${API_BASE}/goals/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': userId 
        },
        body: JSON.stringify({ isTodayGoal: newValue }),
      });

      if (!res.ok) {
        // Откат при ошибке
        set((state) => ({
          goals: state.goals.map((g) => 
            g.id === id ? { ...g, isTodayGoal: !newValue } : g
          ),
        }));
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Ошибка обновления цели');
      }
    } catch (err) {
      console.error('Toggle today goal error:', err);
    }
  },

  recalculateProgress: async (goalId) => {
    const { goals } = get();
    const parent = goals.find((g) => g.id === goalId);
    if (!parent) return;

    // Получаем актуальный список задач из useTaskStore
    const allTasks = useTaskStore.getState().tasks;
    const childTasks = allTasks.filter((t) => t.goalId === goalId);
    const childGoals = goals.filter((g) => g.parentId === goalId);

    const totalItems = childGoals.length + childTasks.length;
    let newProgress = 0;

    if (totalItems > 0) {
      const tasksProgress = childTasks.reduce((sum, t) => sum + (t.isCompleted ? 100 : 0), 0);
      const goalsProgress = childGoals.reduce((sum, g) => {
        if (g.status === 'completed') return sum + 100;
        return sum + Math.min(100, Math.max(0, g.progress ?? 0));
      }, 0);
      newProgress = Math.min(100, Math.max(0, Math.round((tasksProgress + goalsProgress) / totalItems)));
    } else {
      newProgress = parent.status === 'completed' ? 100 : (parent.progress ?? 0);
    }

    // Автоматическое определение статуса при наличии подзадач/подцелей:
    // если 100% - статус переводится в completed, если меньше 100% и был completed - возвращается в in_progress
    let targetStatus = parent.status;
    let targetCompletedAt = parent.completedAt;

    if (totalItems > 0) {
      if (newProgress === 100 && parent.status !== 'completed') {
        targetStatus = 'completed';
        targetCompletedAt = new Date().toISOString();
        set({ celebratingGoal: { ...parent, status: 'completed', progress: 100 } });
      } else if (newProgress < 100 && parent.status === 'completed') {
        targetStatus = 'in_progress';
        targetCompletedAt = null;
      }
    }

    const hasProgressChanged = parent.progress !== newProgress;
    const hasStatusChanged = parent.status !== targetStatus;

    if (hasProgressChanged || hasStatusChanged) {
      // Реактивно обновляем локальное состояние
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === goalId 
            ? { ...g, progress: newProgress, status: targetStatus, completedAt: targetCompletedAt } 
            : g
        ),
      }));

      // Сохраняем прогресс и статус на сервере
      const userId = getUserId();
      if (userId) {
        await fetch(`${API_BASE}/goals/${goalId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
          },
          body: JSON.stringify({ 
            progress: newProgress,
            status: targetStatus,
            completedAt: targetCompletedAt,
          }),
        }).catch((err) => console.error('Failed to persist progress/status:', err));
      }

      // Рекурсивно пересчитываем родительскую цель на всех уровнях
      if (parent.parentId) {
        await get().recalculateProgress(parent.parentId);
      }
    }
  },

  getChildren: (parentId) => {
    return get().goals.filter((g) => g.parentId === parentId);
  },

  getByHorizon: (horizon) => {
    return get().goals.filter((g) => g.horizon === horizon);
  },

  duplicateGoal: async (goalId) => {
    const { goals, createGoal } = get();
    const sourceGoal = goals.find((g) => g.id === goalId);
    if (!sourceGoal) throw new Error('Goal not found');

    const createdGoal = await createGoal({
      title: `${sourceGoal.title} (копия)`,
      description: sourceGoal.description || '',
      horizon: sourceGoal.horizon,
      category: sourceGoal.category,
      status: 'backlog',
      priority: sourceGoal.priority,
      startDate: sourceGoal.startDate,
      targetDate: sourceGoal.targetDate,
      completedAt: null,
      progress: 0,
      isProgressCalculated: sourceGoal.isProgressCalculated,
      estimatedCost: sourceGoal.estimatedCost,
      currency: sourceGoal.currency,
      parentId: sourceGoal.parentId,
      isTodayGoal: false,
    });

    // Копируем непосредственные задачи исходной цели
    const taskStore = useTaskStore.getState();
    const sourceTasks = taskStore.tasks.filter((t) => t.goalId === goalId);
    for (const task of sourceTasks) {
      await taskStore.createTask({
        title: task.title,
        description: task.description || '',
        horizon: task.horizon,
        goalId: createdGoal.id,
        category: task.category,
        dueDate: task.dueDate,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        isRecurring: task.isRecurring,
        recurrenceRule: task.recurrenceRule,
        isCompleted: false,
        completedAt: null,
        isDailyFocus: false,
        tags: task.tags || [],
      });
    }

    return createdGoal;
  },
}));