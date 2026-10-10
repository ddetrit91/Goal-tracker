import { create } from 'zustand';
import { getStorageAdapter } from '@/services/storage/repository.factory';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category';
import { SYSTEM_CATEGORY_MAP } from '@/types/category';

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

const adapter = getStorageAdapter();

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  allCategories: [],

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const customCategories = await adapter.categories.getAll();
      
      // Объединяем системные и кастомные категории
      const systemCategories = Object.entries(SYSTEM_CATEGORY_MAP).map(([key, value]) => ({
        id: key,
        name: value.label,
        colorHex: value.color,
        iconName: value.icon,
        isSystem: true,
        createdAt: '',
        updatedAt: '',
      }));

      const all = [...systemCategories, ...customCategories];
      
      set({ 
        categories: customCategories,
        allCategories: all,
        isLoading: false 
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch categories', isLoading: false });
    }
  },

  createCategory: async (data) => {
    const newCategory = await adapter.categories.create(data);
    await get().fetchCategories();
    return newCategory;
  },

  updateCategory: async (id, data) => {
    const updated = await adapter.categories.update(id, data);
    await get().fetchCategories();
    return updated;
  },

  deleteCategory: async (id) => {
    await adapter.categories.delete(id);
    await get().fetchCategories();
  },
}));