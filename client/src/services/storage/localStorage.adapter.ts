import { z } from 'zod';
import type {
  IGoalRepository,
  ITaskRepository,
  ICategoryRepository,
  IStorageAdapter,
  IBackupData,
} from './storage.interface';
import type { Goal, CreateGoalInput, UpdateGoalInput } from '@/types/goal';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category';
import { initialGoals, initialTasks, initialCategories } from './initialData';

// Zod схемы для валидации данных из localStorage
const GoalSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  horizon: z.enum(['life', 'annual', 'semi-annual', 'quarterly', 'monthly', 'weekly', 'daily']),
  category: z.string(),
  status: z.enum(['backlog', 'in_progress', 'completed', 'paused', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  startDate: z.string().nullable(),
  targetDate: z.string().nullable(),
  completedAt: z.string().nullable(),
  progress: z.number().min(0).max(100),
  isProgressCalculated: z.boolean(),
  estimatedCost: z.number().nullable(),
  currency: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const TaskSchema = z.object({
  id: z.string(),
  goalId: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  horizon: z.enum(['daily', 'weekly', 'monthly']),
  category: z.string(),
  dueDate: z.string(),
  isCompleted: z.boolean(),
  completedAt: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  estimatedMinutes: z.number().nullable(),
  isRecurring: z.boolean(),
  recurrenceRule: z.enum(['daily', 'weekly', 'weekdays', 'monthly']).nullable(),
  isDailyFocus: z.boolean(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  colorHex: z.string(),
  iconName: z.string(),
  isSystem: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const STORAGE_KEYS = {
  GOALS: 'goal_tracker_goals',
  TASKS: 'goal_tracker_tasks',
  CATEGORIES: 'goal_tracker_categories',
};

// Имитация сетевой задержки для реалистичного UX
const simulateDelay = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
};

class LocalGoalRepository implements IGoalRepository {
  private getData(): Goal[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return z.array(GoalSchema).parse(parsed);
    } catch (e) {
      console.error('Failed to parse goals from localStorage', e);
      return [];
    }
  }

  private saveData(data: Goal[]) {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(data));
  }

  async getAll(): Promise<Goal[]> {
    await simulateDelay();
    return this.getData();
  }

  async getById(id: string): Promise<Goal | null> {
    await simulateDelay();
    const goals = this.getData();
    return goals.find((g) => g.id === id) || null;
  }

  async create(data: CreateGoalInput): Promise<Goal> {
    await simulateDelay();
    const goals = this.getData();
    const newGoal: Goal = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    goals.push(newGoal);
    this.saveData(goals);
    return newGoal;
  }

  async update(id: string, data: UpdateGoalInput): Promise<Goal> {
    await simulateDelay();
    const goals = this.getData();
    const index = goals.findIndex((g) => g.id === id);
    if (index === -1) throw new Error(`Goal with id ${id} not found`);
    
    const updatedGoal: Goal = {
      ...goals[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    goals[index] = updatedGoal;
    this.saveData(goals);
    return updatedGoal;
  }

  async delete(id: string): Promise<void> {
    await simulateDelay();
    const goals = this.getData();
    const filtered = goals.filter((g) => g.id !== id);
    this.saveData(filtered);
  }

  async getByHorizon(horizon: Goal['horizon']): Promise<Goal[]> {
    await simulateDelay();
    return this.getData().filter((g) => g.horizon === horizon);
  }

  async getByCategory(category: string): Promise<Goal[]> {
    await simulateDelay();
    return this.getData().filter((g) => g.category === category);
  }

  async getByParentId(parentId: string): Promise<Goal[]> {
    await simulateDelay();
    return this.getData().filter((g) => g.parentId === parentId);
  }
}

class LocalTaskRepository implements ITaskRepository {
  private getData(): Task[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return z.array(TaskSchema).parse(parsed);
    } catch (e) {
      console.error('Failed to parse tasks from localStorage', e);
      return [];
    }
  }

  private saveData(data: Task[]) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data));
  }

  async getAll(): Promise<Task[]> {
    await simulateDelay();
    return this.getData();
  }

  async getById(id: string): Promise<Task | null> {
    await simulateDelay();
    const tasks = this.getData();
    return tasks.find((t) => t.id === id) || null;
  }

  async create(data: CreateTaskInput): Promise<Task> {
    await simulateDelay();
    const tasks = this.getData();
    const newTask: Task = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    this.saveData(tasks);
    return newTask;
  }

  async update(id: string, data: UpdateTaskInput): Promise<Task> {
    await simulateDelay();
    const tasks = this.getData();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Task with id ${id} not found`);
    
    const updatedTask: Task = {
      ...tasks[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    tasks[index] = updatedTask;
    this.saveData(tasks);
    return updatedTask;
  }

  async delete(id: string): Promise<void> {
    await simulateDelay();
    const tasks = this.getData();
    const filtered = tasks.filter((t) => t.id !== id);
    this.saveData(filtered);
  }

  async getByGoalId(goalId: string): Promise<Task[]> {
    await simulateDelay();
    return this.getData().filter((t) => t.goalId === goalId);
  }

  async getByDueDate(date: string): Promise<Task[]> {
    await simulateDelay();
    return this.getData().filter((t) => t.dueDate === date);
  }

  async getDailyFocusTasks(date: string): Promise<Task[]> {
    await simulateDelay();
    return this.getData().filter((t) => t.dueDate === date && t.isDailyFocus && !t.isCompleted);
  }

  async getCompletedByGoalId(goalId: string): Promise<Task[]> {
    await simulateDelay();
    return this.getData().filter((t) => t.goalId === goalId && t.isCompleted);
  }
}

class LocalCategoryRepository implements ICategoryRepository {
  private getData(): Category[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return z.array(CategorySchema).parse(parsed);
    } catch (e) {
      console.error('Failed to parse categories from localStorage', e);
      return [];
    }
  }

  private saveData(data: Category[]) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data));
  }

  async getAll(): Promise<Category[]> {
    await simulateDelay();
    return this.getData();
  }

  async getById(id: string): Promise<Category | null> {
    await simulateDelay();
    const categories = this.getData();
    return categories.find((c) => c.id === id) || null;
  }

  async create(data: CreateCategoryInput): Promise<Category> {
    await simulateDelay();
    const categories = this.getData();
    const newCategory: Category = {
      ...data,
      id: crypto.randomUUID(),
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    categories.push(newCategory);
    this.saveData(categories);
    return newCategory;
  }

  async update(id: string, data: UpdateCategoryInput): Promise<Category> {
    await simulateDelay();
    const categories = this.getData();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Category with id ${id} not found`);
    
    const updatedCategory: Category = {
      ...categories[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    categories[index] = updatedCategory;
    this.saveData(categories);
    return updatedCategory;
  }

  async delete(id: string): Promise<void> {
    await simulateDelay();
    const categories = this.getData();
    const filtered = categories.filter((c) => c.id !== id);
    this.saveData(filtered);
  }
}

export class LocalStorageAdapter implements IStorageAdapter {
  goals: IGoalRepository;
  tasks: ITaskRepository;
  categories: ICategoryRepository;

  constructor() {
    this.goals = new LocalGoalRepository();
    this.tasks = new LocalTaskRepository();
    this.categories = new LocalCategoryRepository();
    this.initializeIfEmpty();
  }

  private async initializeIfEmpty() {
    const existingGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!existingGoals) {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(initialGoals));
    }
    const existingTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!existingTasks) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(initialTasks));
    }
    const existingCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!existingCategories) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
    }
  }

  async exportAll(): Promise<IBackupData> {
    const goals = await this.goals.getAll();
    const tasks = await this.tasks.getAll();
    const categories = await this.categories.getAll();
    return {
      goals,
      tasks,
      categories,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  async importAll(data: IBackupData): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(data.goals));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
  }
}