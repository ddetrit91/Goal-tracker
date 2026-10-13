// client/src/store/useGoalStore.ts
import { create } from 'zustand';
import type { Goal, CreateGoalInput, UpdateGoalInput } from '@/types/goal';
import type { Task } from '@/types/task';

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

const API_BASE = 'http://localhost:3000/api';

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
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

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
      
      set((state) => ({
        goals: state.goals.map((g) => g.id === id ? { ...g, ...updated } : g)
      }));
      
      if (updated.parentId && (data.status !== undefined || data.progress !== undefined)) {
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

  // НОВЫЙ МЕТОД: Переключение "Цели дня"
  toggleTodayGoal: async (id) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;

    const newValue = !goal.isTodayGoal;

    // Оптимистичное обновление UI
    set((state) => ({
      goals: state.goals.map((g) => 
        g.id === id ? { ...g, isTodayGoal: newValue } : g
      ),
    }));

    try {
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
    if (!parent || !parent.isProgressCalculated) return;

    const childGoals = goals.filter((g) => g.parentId === goalId);
    const childTasks: Task[] = []; 

    const totalItems = childGoals.length + childTasks.length;
    if (totalItems === 0) return;

    const completedGoals = childGoals.filter((g) => g.status === 'completed').length;
    const completedTasks = childTasks.filter((t) => t.isCompleted).length;
    const totalCompleted = completedGoals + completedTasks;

    const newProgress = Math.round((totalCompleted / totalItems) * 100);

    if (parent.progress !== newProgress) {
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === goalId ? { ...g, progress: newProgress } : g
        ),
      }));
      
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
}));