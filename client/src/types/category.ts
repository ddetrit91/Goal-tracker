export interface Category {
  id: string;
  name: string;
  colorHex: string;
  iconName: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateCategoryInput = Omit<
  Category,
  'id' | 'isSystem' | 'createdAt' | 'updatedAt'
>;

export type UpdateCategoryInput = Partial<
  Omit<Category, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>
>;

export const SYSTEM_CATEGORY_MAP: Record<string, { label: string; icon: string; color: string }> = {
  'self-development': { label: 'Саморазвитие', icon: 'BookOpen', color: '#6366f1' },
  dream: { label: 'Мечта', icon: 'Star', color: '#ec4899' },
  altruism: { label: 'Помощь другим', icon: 'HeartHandshake', color: '#10b981' },
  wishlist: { label: 'Виш-лист', icon: 'Gift', color: '#f59e0b' },
  health: { label: 'Здоровье', icon: 'Activity', color: '#14b8a6' },
  career: { label: 'Карьера и финансы', icon: 'Briefcase', color: '#3b82f6' },
  relationships: { label: 'Отношения', icon: 'Users', color: '#8b5cf6' },
};