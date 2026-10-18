import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role').default('user'), // 'user' | 'admin'
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  lastLogin: text('last_login'),
  lastIp: text('last_ip'),
  lastCity: text('last_city'),
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
  parentId: text('parent_id'),
  targetDate: text('target_date'),
  startDate: text('start_date'),
  status: text('status').default('backlog'),
  isTodayGoal: integer('is_today_goal', { mode: 'boolean' }).default(false),
  estimatedCost: real('estimated_cost'),
  currency: text('currency').default('UZS'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  goalId: text('goal_id').references(() => goals.id, { onDelete: 'set null' }),
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

export const activityLogs = sqliteTable('activity_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  ipAddress: text('ip_address'),
  city: text('city'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  eventDate: text('event_date').notNull(),
  eventTime: text('event_time'),
  remindDaysBefore: integer('remind_days_before').default(2),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  completedAt: text('completed_at'),
  category: text('category').default('personal'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

