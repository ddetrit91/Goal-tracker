// client/src/store/useCategoryStore.ts
import { create } from 'zustand';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category';
import { SYSTEM_CATEGORY_MAP } from '@/types/category';

const getUserId = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try { return JSON.parse(userStr).id || null; } 
  catch { return null; }
};

import { API_BASE } from '@/config/api';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  allCategories: Array<{ id: string; name: string; colorHex: string; iconName: string; isSystem: boolean }>;
  fetchCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryInput) => Promise<Category>;
  updateCategory: (id: string, data: UpdateCategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

// Безопасная инициализация списка всех категорий (включая legacy "custom")
const getInitialCategories = () => {
  const systemCats = Object.entries(SYSTEM_CATEGORY_MAP).map(([key, value]) => ({
    id: key,
    name: value.label,
    colorHex: value.color,
    iconName: value.icon,
    isSystem: true,
    createdAt: '',
    updatedAt: '',
  }));

  // Добавляем заглушку для старых целей с категорией "custom", чтобы селект не ломался
  const hasCustomLegacy = !systemCats.some(c => c.id === 'custom');
  if (hasCustomLegacy) {
    systemCats.push({
      id: 'custom',
      name: 'Пользовательская',
      colorHex: '#64748b',
      iconName: 'Tag',
      isSystem: true,
      createdAt: '',
      updatedAt: '',
    });
  }

  return systemCats;
};

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  allCategories: getInitialCategories(), // <-- Инициализируем сразу безопасным списком

  fetchCategories: async () => {
    const userId = getUserId();
    const systemCategories = getInitialCategories();

    if (!userId) {
      set({ categories: [], allCategories: systemCategories, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        headers: { 'X-User-Id': userId }
      });
      
      if (!res.ok) throw new Error('Failed to fetch categories');
      
      const customCategories = await res.json();
      const all = [...systemCategories, ...customCategories];
      
      set({ 
        categories: customCategories,
        allCategories: all,
        isLoading: false 
      });
    } catch (err) {
      console.error('Category fetch error:', err);
      // При ошибке оставляем хотя бы системные + legacy категории
      set({ 
        error: err instanceof Error ? err.message : 'Ошибка загрузки категорий', 
        allCategories: systemCategories,
        isLoading: false 
      });
    }
  },

  createCategory: async (data) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка создания категории');
    }

    const newCategory = await res.json();
    await get().fetchCategories();
    return newCategory;
  },

  updateCategory: async (id, data) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка обновления категории');
    }

    const updated = await res.json();
    await get().fetchCategories();
    return updated;
  },

  deleteCategory: async (id) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': userId }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка удаления категории');
    }

    await get().fetchCategories();
  },
}));