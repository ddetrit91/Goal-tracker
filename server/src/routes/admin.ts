// client/src/server/admin.ts
import { Hono } from 'hono';
import { db } from '../db';
import { users, goals as goalsTable, activityLogs, settings as settingsTable } from '../db/schema';
import { eq, count, sql, and, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const admin = new Hono();

// Middleware: Проверка, что пользователь — админ
admin.use('*', async (c, next) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  await next();
});

// GET /admin/users - Получить всех пользователей с корректным подсчетом целей
admin.get('/users', async (c) => {
  try {
    const userList = await db.select().from(users);
    
    const usersWithGoals = await Promise.all(
      userList.map(async (user: any) => {
        const mainGoals = await db
          .select({ count: count() })
          .from(goalsTable)
          .where(and(
            eq(goalsTable.userId, user.id), 
            isNull(goalsTable.parentId)
          ));
        
        return {
          ...user,
          goalCount: mainGoals[0]?.count || 0,
        };
      })
    );
    
    return c.json(usersWithGoals);
  } catch (error) {
    console.error('Fetch users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// POST /admin/users - Создать нового пользователя
admin.post('/users', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email и пароль обязательны' }, 400);
    }
    
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
      return c.json({ error: 'Пользователь с таким email уже существует' }, 409);
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    
    await db.insert(users).values({
      id,
      email,
      passwordHash,
      name: name || null,
      role: role || 'user',
    });
    
    return c.json({ message: 'Пользователь создан', user: { id, email, name, role } }, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// PUT /admin/users/:id/role - Изменить роль пользователя
admin.put('/users/:id/role', async (c) => {
  try {
    const id = c.req.param('id');
    const { role } = await c.req.json();
    
    if (role !== 'admin') {
      const admins = await db.select({ count: count() }).from(users).where(eq(users.role, 'admin'));
      const adminCount = admins[0]?.count ?? 0;
      if (adminCount <= 1) {
        return c.json({ error: 'Cannot remove the last admin' }, 400);
      }
    }
    
    await db.update(users).set({ role }).where(eq(users.id, id));
    return c.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    return c.json({ error: 'Failed to update role' }, 500);
  }
});

// POST /admin/users/:id/reset-password - Сбросить пароль (админ устанавливает новый)
admin.post('/users/:id/reset-password', async (c) => {
  try {
    const id = c.req.param('id');
    const { newPassword } = await c.req.json();
    
    if (!newPassword || newPassword.length < 6) {
      return c.json({ error: 'Пароль должен быть не менее 6 символов' }, 400);
    }
    
    const hash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash: hash }).where(eq(users.id, id));
    
    return c.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// DELETE /admin/users/:id - Удалить пользователя
admin.delete('/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const currentUserId = c.req.header('X-User-Id');
    
    if (id === currentUserId) {
      return c.json({ error: 'Cannot delete yourself' }, 400);
    }
    
    await db.delete(users).where(eq(users.id, id));
    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// GET /admin/stats - Получить статистику системы
admin.get('/stats', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;
    
    const activeTodayResult = await db
      .select({ count: count() })
      .from(users)
      .where(sql`date(last_login) = date(${today})`);
    const activeToday = activeTodayResult[0]?.count || 0;
    
    const requestsTodayResult = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(sql`date(created_at) = date(${today})`);
    const requestsToday = requestsTodayResult[0]?.count || 0;
    
    const registrationsByDay = await db
      .select({
        date: sql`date(created_at)`.as('date'),
        count: count(),
      })
      .from(users)
      .groupBy(sql`date(created_at)`)
      .orderBy(sql`date(created_at) DESC`)
      .limit(7);
    
    const requestsByDay = await db
      .select({
        date: sql`date(created_at)`.as('date'),
        count: count(),
      })
      .from(activityLogs)
      .groupBy(sql`date(created_at)`)
      .orderBy(sql`date(created_at) DESC`)
      .limit(7);
    
    return c.json({
      totalUsers,
      activeToday,
      requestsToday,
      registrationsByDay,
      requestsByDay,
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// client/src/server/admin.ts (найди и замени GET /admin/activity)

// GET /admin/activity - Журнал активности всех пользователей
admin.get('/activity', async (c) => {
  try {
    const logs = await db.select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
      lastLogin: sql<string>`COALESCE(MAX(${activityLogs.createdAt}), ${users.lastLogin}, ${users.createdAt})`.as('last_login'),
      requestCount: sql<number>`COUNT(${activityLogs.id})`.as('request_count'),
      ipAddress: sql<string>`COALESCE(
        (SELECT al.ip_address FROM activity_logs al WHERE al.user_id = ${users.id} AND al.ip_address IS NOT NULL AND al.ip_address != '' ORDER BY al.created_at DESC LIMIT 1),
        ${users.lastIp},
        '127.0.0.1'
      )`.as('ip_address'),
      city: sql<string>`COALESCE(
        (SELECT al.city FROM activity_logs al WHERE al.user_id = ${users.id} AND al.city IS NOT NULL AND al.city != '' ORDER BY al.created_at DESC LIMIT 1),
        ${users.lastCity},
        'Локально'
      )`.as('city'),
    })
    .from(users)
    .leftJoin(activityLogs, eq(users.id, activityLogs.userId))
    .groupBy(users.id, users.name, users.email, users.role, users.createdAt, users.lastLogin, users.lastIp, users.lastCity)
    .orderBy(sql`COALESCE(MAX(${activityLogs.createdAt}), ${users.lastLogin}, ${users.createdAt}) DESC`)
    .limit(100);
    
    return c.json(logs);
  } catch (error) {
    console.error('Fetch activity error:', error);
    return c.json({ error: 'Failed to fetch activity' }, 500);
  }
});

// GET /admin/settings - Получить настройки
admin.get('/settings', async (c) => {
  try {
    const allSettings = await db.select().from(settingsTable);
    return c.json(allSettings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// PUT /admin/settings - Обновить настройку
admin.put('/settings', async (c) => {
  try {
    const { key, value } = await c.req.json();
    await db.insert(settingsTable).values({ key, value })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date().toISOString() } });
    return c.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Update setting error:', error);
    return c.json({ error: 'Failed to update setting' }, 500);
  }
});

export default admin;