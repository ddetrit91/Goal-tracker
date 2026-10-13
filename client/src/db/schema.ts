// client/src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role').default('user'), // 'user' | 'admin'
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  lastLogin: text('last_login'), // <-- ДОБАВЛЕНО: Дата последней активности
});

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  priority: text('priority').notNull(),
  horizon: text('horizon').notNull(),
  progress: integer('progress').default(0),
  parentId: text('parent_id').references((): any => (goals as any).id, { onDelete: 'set null' }),
  targetDate: text('target_date'),
  startDate: text('start_date'),
  status: text('status').default('backlog'),
  isTodayGoal: integer('is_today_goal', { mode: 'boolean' }).default(false),
  estimatedCost: real('estimated_cost'),
  currency: text('currency').default('UZS'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  goalId: text('goal_id').references((): any => (goals as any).id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  isDailyFocus: integer('is_daily_focus', { mode: 'boolean' }).default(false),
  dueDate: text('due_date'),
  completedAt: text('completed_at'),
  category: text('category'),
  priority: text('priority').default('low'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  colorHex: text('color_hex').notNull(),
  iconName: text('icon_name'),
  isSystem: integer('is_system', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// НОВАЯ ТАБЛИЦА: Журнал активности (для статистики по дням)
export const activityLogs = sqliteTable('activity_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // 'login', 'register', 'api_request', 'create_goal' и т.д.
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});