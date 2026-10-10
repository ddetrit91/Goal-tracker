export const GOAL_HORIZONS = [
  'life',
  'annual',
  'semi-annual',
  'quarterly',
  'monthly',
  'weekly',
  'daily',
] as const;

export type GoalHorizon = (typeof GOAL_HORIZONS)[number];

export const GOAL_STATUSES = [
  'backlog',
  'in_progress',
  'completed',
  'paused',
  'archived',
] as const;

export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export type GoalPriority = (typeof GOAL_PRIORITIES)[number];

export const GOAL_CATEGORIES = [
  'self-development',
  'dream',
  'altruism',
  'wishlist',
  'health',
  'career',
  'relationships',
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number] | string;

export interface Goal {
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  horizon: GoalHorizon;
  category: GoalCategory;
  status: GoalStatus;
  priority: GoalPriority;
  startDate: string | null;
  targetDate: string | null;
  completedAt: string | null;
  progress: number;
  isProgressCalculated: boolean;
  estimatedCost: number | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateGoalInput = Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateGoalInput = Partial<CreateGoalInput>;