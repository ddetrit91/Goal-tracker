export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_HORIZONS = ['daily', 'weekly', 'monthly'] as const;

export type TaskHorizon = (typeof TASK_HORIZONS)[number];

export const RECURRENCE_RULES = [
  'daily',
  'weekly',
  'weekdays',
  'monthly',
] as const;

export type RecurrenceRule = (typeof RECURRENCE_RULES)[number];

export interface Task {
  id: string;
  goalId: string | null;
  title: string;
  description: string;
  horizon: TaskHorizon;
  category: string;
  dueDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  priority: TaskPriority;
  estimatedMinutes: number | null;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  isDailyFocus: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTaskInput = Partial<CreateTaskInput>;