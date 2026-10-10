import { create } from 'zustand';
import { getStorageAdapter } from '@/services/storage/repository.factory';
import type { Goal, CreateGoalInput, UpdateGoalInput } from '@/types/goal';

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
}

const adapter = getStorageAdapter();

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const goals = await adapter.goals.getAll();
      set({ goals, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch goals', isLoading: false });
    }
  },

  createGoal: async (data) => {
    const newGoal = await adapter.goals.create(data);
    await get().fetchGoals();
    if (newGoal.parentId) {
      await get().recalculateProgress(newGoal.parentId);
    }
    return newGoal;
  },

  updateGoal: async (id, data) => {
    const updated = await adapter.goals.update(id, data);
    await get().fetchGoals();
    // Если изменился статус или прогресс, пересчитываем родителя
    if (updated.parentId && (data.status !== undefined || data.progress !== undefined)) {
      await get().recalculateProgress(updated.parentId);
    }
    return updated;
  },

  deleteGoal: async (id) => {
    const goal = get().goals.find((g) => g.id === id);
    await adapter.goals.delete(id);
    await get().fetchGoals();
    if (goal?.parentId) {
      await get().recalculateProgress(goal.parentId);
    }
  },

  recalculateProgress: async (goalId) => {
    const { goals } = get();
    const parent = goals.find((g) => g.id === goalId);
    if (!parent || !parent.isProgressCalculated) return;

    // Получаем все дочерние цели и задачи
    const childGoals = goals.filter((g) => g.parentId === goalId);
    const childTasks = await adapter.tasks.getByGoalId(goalId);

    const totalItems = childGoals.length + childTasks.length;
    if (totalItems === 0) return;

    const completedGoals = childGoals.filter((g) => g.status === 'completed').length;
    const completedTasks = childTasks.filter((t) => t.isCompleted).length;
    const totalCompleted = completedGoals + completedTasks;

    const newProgress = Math.round((totalCompleted / totalItems) * 100);

    // Обновляем прогресс только если он изменился
    if (parent.progress !== newProgress) {
      await adapter.goals.update(goalId, { progress: newProgress });
      // Рекурсивно пересчитываем вышестоящего родителя
      if (parent.parentId) {
        await get().recalculateProgress(parent.parentId);
      }
      // Обновляем локальное состояние без полного refetch
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === goalId ? { ...g, progress: newProgress } : g
        ),
      }));
    }
  },

  getChildren: (parentId) => {
    return get().goals.filter((g) => g.parentId === parentId);
  },

  getByHorizon: (horizon) => {
    return get().goals.filter((g) => g.horizon === horizon);
  },
}));