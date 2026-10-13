// client/src/server/auth.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '../db';
// <-- ДОБАВЛЕНО: activityLogs для записи в журнал
import { users, goals as goalsTable, tasks as tasksTable, categories as categoriesTable, activityLogs } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const auth = new Hono();

// --- СХЕМЫ ВАЛИДАЦИИ ---
const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  horizon: z.string(),
  category: z.string(),
  priority: z.string(),
  status: z.string().default('backlog'),
  startDate: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  progress: z.number().optional(),
  isProgressCalculated: z.boolean().optional(),
  estimatedCost: z.number().nullable().optional(),
  currency: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isTodayGoal: z.boolean().optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1),
  goalId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.string().default('low'),
  category: z.string().optional(),
});

// --- АВТОРИЗАЦИЯ ---

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password, name } = c.req.valid('json');
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    
    if (existingUser) return c.json({ error: 'Пользователь с таким email уже существует' }, 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    await db.insert(users).values({ id, email, passwordHash, name: name || null, role: 'user' });

    return c.json({ message: 'Регистрация успешна', user: { id, email, name, role: 'user' } }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Ошибка сервера при регистрации' }, 500);
  }
});

// ЕДИНСТВЕННЫЙ ПРАВИЛЬНЫЙ БЛОК ЛОГИНА (С ЛОГИРОВАНИЕМ)
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    
    if (!user) return c.json({ error: 'Пользователь не найден' }, 404);

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) return c.json({ error: 'Неверный пароль' }, 401);

    // Логируем вход и обновляем lastLogin
    const now = new Date().toISOString();
    
    await db.insert(activityLogs).values({
      id: randomUUID(),
      userId: user.id,
      action: 'login',
      createdAt: now,
    });
    
    await db.update(users).set({ lastLogin: now }).where(eq(users.id, user.id));

    return c.json({ 
      message: 'Вход выполнен успешно', 
      user: { id: user.id, email: user.email, name: user.name, role: user.role } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Ошибка сервера при входе' }, 500);
  }
});

// --- ЦЕЛИ ---

auth.get('/goals', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const userGoals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));
    return c.json(userGoals);
  } catch (error) {
    console.error('Fetch goals error:', error);
    return c.json({ error: 'Ошибка при получении целей' }, 500);
  }
});

auth.post('/goals', zValidator('json', createGoalSchema), async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = c.req.valid('json');
    
    const result = await db.insert(goalsTable).values({ 
      id: randomUUID(),
      userId,
      title: body.title,
      description: body.description || null,
      category: body.category,
      priority: body.priority,
      horizon: body.horizon,
      status: body.status || 'backlog',
      startDate: body.startDate || null,
      targetDate: body.targetDate || null,
      parentId: body.parentId || null,
      estimatedCost: body.estimatedCost || null,
      currency: body.currency || 'UZS',
      progress: 0,
      isTodayGoal: body.isTodayGoal || false,
    }).returning();

    return c.json((result as any[])[0], 201);
  } catch (error) {
    console.error('Create goal error:', error);
    return c.json({ error: 'Ошибка при создании цели' }, 500);
  }
});

auth.put('/goals/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db.select().from(goalsTable).where(
      and(eq(goalsTable.id, id), eq(goalsTable.userId, userId))
    ).get();

    if (!existing) return c.json({ error: 'Цель не найдена' }, 404);

    const result = await db.update(goalsTable).set(body).where(eq(goalsTable.id, id)).returning();
    return c.json((result as any[])[0]);
  } catch (error) {
    console.error('Update goal error:', error);
    return c.json({ error: 'Ошибка обновления цели' }, 500);
  }
});

auth.delete('/goals/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const id = c.req.param('id');
    const existing = await db.select().from(goalsTable).where(
      and(eq(goalsTable.id, id), eq(goalsTable.userId, userId))
    ).get();

    if (!existing) return c.json({ error: 'Цель не найдена' }, 404);

    await db.delete(goalsTable).where(eq(goalsTable.id, id));
    return c.json({ message: 'Цель успешно удалена' });
  } catch (error) {
    console.error('Delete goal error:', error);
    return c.json({ error: 'Ошибка удаления цели' }, 500);
  }
});

// --- ЗАДАЧИ ---

auth.get('/tasks', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const userTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
    return c.json(userTasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return c.json({ error: 'Ошибка при получении задач' }, 500);
  }
});

auth.post('/tasks', zValidator('json', createTaskSchema), async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = c.req.valid('json');
    const result = await db.insert(tasksTable).values({
      id: randomUUID(), userId, ...body, isCompleted: false, isDailyFocus: false
    }).returning();

    return c.json((result as any[])[0], 201);
  } catch (error) {
    console.error('Create task error:', error);
    return c.json({ error: 'Ошибка при создании задачи' }, 500);
  }
});

auth.put('/tasks/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db.select().from(tasksTable).where(
      and(eq(tasksTable.id, id), eq(tasksTable.userId, userId))
    ).get();

    if (!existing) return c.json({ error: 'Задача не найдена' }, 404);

    const result = await db.update(tasksTable).set(body).where(eq(tasksTable.id, id)).returning();
    const updatedTask = (result as any[])[0];

    if (updatedTask.goalId && (body.isCompleted !== undefined || body.completedAt !== undefined)) {
      const goalTasks = await db.select().from(tasksTable).where(eq(tasksTable.goalId, updatedTask.goalId));
      const subGoals = await db.select().from(goalsTable).where(eq(goalsTable.parentId, updatedTask.goalId));

      const totalItems = goalTasks.length + subGoals.length;
      if (totalItems > 0) {
        const completedTasks = goalTasks.filter(t => t.isCompleted).length;
        const completedSubGoals = subGoals.filter(g => g.status === 'completed').length;
        
        const newProgress = Math.round(((completedTasks + completedSubGoals) / totalItems) * 100);

        await db.update(goalsTable)
          .set({ progress: newProgress })
          .where(eq(goalsTable.id, updatedTask.goalId));
      }
    }

    return c.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return c.json({ error: 'Ошибка обновления задачи' }, 500);
  }
});

auth.delete('/tasks/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const id = c.req.param('id');

    const existing = await db.select().from(tasksTable).where(
      and(eq(tasksTable.id, id), eq(tasksTable.userId, userId))
    ).get();

    if (!existing) return c.json({ error: 'Задача не найдена' }, 404);

    await db.delete(tasksTable).where(eq(tasksTable.id, id));
    return c.json({ message: 'Задача успешно удалена' });
  } catch (error) {
    console.error('Delete task error:', error);
    return c.json({ error: 'Ошибка удаления задачи' }, 500);
  }
});

// --- КАТЕГОРИИ ---

auth.get('/categories', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const userCategories = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));
    return c.json(userCategories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    return c.json({ error: 'Ошибка при получении категорий' }, 500);
  }
});

auth.post('/categories', zValidator('json', z.object({
  name: z.string().min(1),
  colorHex: z.string(),
  iconName: z.string().optional(),
})), async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = c.req.valid('json');
    const result = await db.insert(categoriesTable).values({
      id: randomUUID(),
      userId,
      ...body,
      isSystem: false
    }).returning();

    return c.json((result as any[])[0], 201);
  } catch (error) {
    console.error('Create category error:', error);
    return c.json({ error: 'Ошибка при создании категории' }, 500);
  }
});

auth.put('/categories/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db.select().from(categoriesTable).where(
      and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId))
    ).get();

    if (!existing) return c.json({ error: 'Категория не найдена' }, 404);

    const result = await db.update(categoriesTable).set(body).where(eq(categoriesTable.id, id)).returning();
    return c.json((result as any[])[0]);
  } catch (error) {
    console.error('Update category error:', error);
    return c.json({ error: 'Ошибка обновления категории' }, 500);
  }
});

auth.delete('/categories/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const id = c.req.param('id');
    const existing = await db.select().from(categoriesTable).where(
      and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId))
    ).get();

    if (!existing) return c.json({ error: 'Категория не найдена' }, 404);

    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    return c.json({ message: 'Категория успешно удалена' });
  } catch (error) {
    console.error('Delete category error:', error);
    return c.json({ error: 'Ошибка удаления категории' }, 500);
  }
});

export default auth;