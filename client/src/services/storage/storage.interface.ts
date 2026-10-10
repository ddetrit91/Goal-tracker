import type { Goal, CreateGoalInput, UpdateGoalInput } from '@/types/goal';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category';

export interface IGoalRepository {
  getAll(): Promise<Goal[]>;
  getById(id: string): Promise<Goal | null>;
  create(data: CreateGoalInput): Promise<Goal>;
  update(id: string, data: UpdateGoalInput): Promise<Goal>;
  delete(id: string): Promise<void>;
  getByHorizon(horizon: Goal['horizon']): Promise<Goal[]>;
  getByCategory(category: string): Promise<Goal[]>;
  getByParentId(parentId: string): Promise<Goal[]>;
}

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  create(data: CreateTaskInput): Promise<Task>;
  update(id: string, data: UpdateTaskInput): Promise<Task>;
  delete(id: string): Promise<void>;
  getByGoalId(goalId: string): Promise<Task[]>;
  getByDueDate(date: string): Promise<Task[]>;
  getDailyFocusTasks(date: string): Promise<Task[]>;
  getCompletedByGoalId(goalId: string): Promise<Task[]>;
}

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(data: CreateCategoryInput): Promise<Category>;
  update(id: string, data: UpdateCategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;
}

export interface IBackupData {
  goals: Goal[];
  tasks: Task[];
  categories: Category[];
  exportedAt: string;
  version: string;
}

export interface IStorageAdapter {
  goals: IGoalRepository;
  tasks: ITaskRepository;
  categories: ICategoryRepository;
  exportAll(): Promise<IBackupData>;
  importAll(data: IBackupData): Promise<void>;
}