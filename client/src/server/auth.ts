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

// Вспомогательная функция для рекурсивного пересчета прогресса целей любой глубины
async function recalculateGoalHierarchy(goalId: string, userId: string): Promise<void> {
  const goal = await db.select().from(goalsTable).where(
    and(eq(goalsTable.id, goalId), eq(goalsTable.userId, userId))
  ).get();

  if (!goal) return;

  const childTasks = await db.select().from(tasksTable).where(
    and(eq(tasksTable.goalId, goalId), eq(tasksTable.userId, userId))
  );

  const childGoals = await db.select().from(goalsTable).where(
    and(eq(goalsTable.parentId, goalId), eq(goalsTable.userId, userId))
  );

  const totalItems = childTasks.length + childGoals.length;
  let newProgress = 0;

  if (totalItems > 0) {
    const tasksProgress = childTasks.reduce((sum, t) => sum + (t.isCompleted ? 100 : 0), 0);
    const goalsProgress = childGoals.reduce((sum, g) => {
      if (g.status === 'completed') return sum + 100;
      return sum + Math.min(100, Math.max(0, g.progress ?? 0));
    }, 0);
    newProgress = Math.min(100, Math.max(0, Math.round((tasksProgress + goalsProgress) / totalItems)));
  } else {
    newProgress = goal.status === 'completed' ? 100 : 0;
  }

  if (goal.progress !== newProgress) {
    await db.update(goalsTable)
      .set({ progress: newProgress })
      .where(eq(goalsTable.id, goalId));
  }

  if (goal.parentId) {
    await recalculateGoalHierarchy(goal.parentId, userId);
  }
}

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
    const updatedGoal = (result as any[])[0];

    // Если изменился статус цели без явного прогресса, пересчитываем прогресс самой цели (и ее родителей)
    if (body.status !== undefined && body.progress === undefined) {
      await recalculateGoalHierarchy(id, userId);
    } else if (updatedGoal.parentId && (body.status !== undefined || body.progress !== undefined)) {
      // Иначе если изменился статус или прогресс, пересчитываем родительскую цель
      await recalculateGoalHierarchy(updatedGoal.parentId, userId);
    }

    return c.json(updatedGoal);
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

    if (existing.parentId) {
      await recalculateGoalHierarchy(existing.parentId, userId);
    }

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
    const newTask = (result as any[])[0];

    if (newTask.goalId) {
      await recalculateGoalHierarchy(newTask.goalId, userId);
    }

    return c.json(newTask, 201);
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

    if (updatedTask.goalId) {
      await recalculateGoalHierarchy(updatedTask.goalId, userId);
    }
    if (existing.goalId && existing.goalId !== updatedTask.goalId) {
      await recalculateGoalHierarchy(existing.goalId, userId);
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

    if (existing.goalId) {
      await recalculateGoalHierarchy(existing.goalId, userId);
    }

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

// --- РЕЗЕРВНОЕ КОПИРОВАНИЕ И ОЧИСТКА ДАННЫХ ---

auth.get('/backup', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));
    const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
    const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));

    return c.json({
      goals,
      tasks,
      categories,
      exportedAt: new Date().toISOString(),
      version: '0.1.0',
    });
  } catch (error) {
    console.error('Backup export error:', error);
    return c.json({ error: 'Ошибка при экспорте резервной копии' }, 500);
  }
});

auth.post('/backup', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const data = await c.req.json();
    if (!data || !Array.isArray(data.goals) || !Array.isArray(data.tasks)) {
      return c.json({ error: 'Неверный формат данных бэкапа' }, 400);
    }

    // Удаляем старые данные пользователя
    await db.delete(tasksTable).where(eq(tasksTable.userId, userId));
    await db.delete(goalsTable).where(eq(goalsTable.userId, userId));
    await db.delete(categoriesTable).where(eq(categoriesTable.userId, userId));

    // Вставляем категории
    if (data.categories && data.categories.length > 0) {
      for (const cat of data.categories) {
        await db.insert(categoriesTable).values({
          id: cat.id || randomUUID(),
          userId,
          name: cat.name,
          colorHex: cat.colorHex,
          iconName: cat.iconName || null,
          isSystem: Boolean(cat.isSystem),
          createdAt: cat.createdAt || new Date().toISOString(),
          updatedAt: cat.updatedAt || new Date().toISOString(),
        });
      }
    }

    // Вставляем цели
    if (data.goals && data.goals.length > 0) {
      for (const g of data.goals) {
        await db.insert(goalsTable).values({
          id: g.id || randomUUID(),
          userId,
          title: g.title,
          description: g.description || null,
          category: g.category || 'self-development',
          priority: g.priority || 'medium',
          horizon: g.horizon || 'quarterly',
          progress: typeof g.progress === 'number' ? g.progress : 0,
          parentId: g.parentId || null,
          startDate: g.startDate || null,
          targetDate: g.targetDate || null,
          status: g.status || 'backlog',
          isTodayGoal: Boolean(g.isTodayGoal),
          estimatedCost: typeof g.estimatedCost === 'number' ? g.estimatedCost : null,
          currency: g.currency || 'UZS',
          createdAt: g.createdAt || new Date().toISOString(),
        });
      }
    }

    // Вставляем задачи
    if (data.tasks && data.tasks.length > 0) {
      for (const t of data.tasks) {
        await db.insert(tasksTable).values({
          id: t.id || randomUUID(),
          userId,
          goalId: t.goalId || null,
          title: t.title,
          isCompleted: Boolean(t.isCompleted),
          isDailyFocus: Boolean(t.isDailyFocus),
          dueDate: t.dueDate || null,
          completedAt: t.completedAt || null,
          category: t.category || null,
          priority: t.priority || 'low',
          createdAt: t.createdAt || new Date().toISOString(),
        });
      }
    }

    return c.json({ message: 'Резервная копия успешно восстановлена' });
  } catch (error) {
    console.error('Backup import error:', error);
    return c.json({ error: 'Ошибка при восстановлении из резервной копии' }, 500);
  }
});

auth.delete('/user/data', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    await db.delete(tasksTable).where(eq(tasksTable.userId, userId));
    await db.delete(goalsTable).where(eq(goalsTable.userId, userId));
    await db.delete(categoriesTable).where(eq(categoriesTable.userId, userId));
    return c.json({ message: 'Все данные пользователя успешно удалены' });
  } catch (error) {
    console.error('Clear user data error:', error);
    return c.json({ error: 'Ошибка при удалении данных пользователя' }, 500);
  }
});

export default auth;