import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import { db, client } from './db';
import { users, activityLogs } from './db/schema';
import { extractClientIp, resolveClientCity } from './utils/geoIp';

// Загрузка переменных окружения
dotenv.config();

function clean(val?: string) {
  if (!val) return val;
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

const clientOrigin = clean(process.env.CLIENT_ORIGIN) || 'http://localhost:5173';
const adminEmail = clean(process.env.ADMIN_EMAIL) || 'admin@goaltracker.local';
const adminPassword = clean(process.env.ADMIN_PASSWORD) || 'AdminPass123!';

// Флаг инициализации базы данных
let isInitialized = false;

export async function ensureDbInitialized() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    console.log('🔧 Checking database schema & admin account...');

    // Создание таблицы событий, если еще нет
    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          event_date TEXT NOT NULL,
          event_time TEXT,
          remind_days_before INTEGER DEFAULT 2,
          is_completed INTEGER DEFAULT 0,
          completed_at TEXT,
          category TEXT DEFAULT 'personal',
          created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
        )
      `);
      console.log('✅ Events table verified/created');
    } catch (e: any) {
      console.warn('⚠️ Events table check warning:', e?.message);
    }

    const columnsToAdd = [
      { name: 'start_date', sql: 'ALTER TABLE goals ADD COLUMN start_date TEXT' },
      { name: 'status', sql: "ALTER TABLE goals ADD COLUMN status TEXT DEFAULT 'backlog'" },
      { name: 'is_today_goal', sql: 'ALTER TABLE goals ADD COLUMN is_today_goal INTEGER DEFAULT 0' },
      { name: 'completed_at', sql: 'ALTER TABLE goals ADD COLUMN completed_at TEXT' },
      { name: 'role', sql: "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'" },
      { name: 'last_ip', sql: 'ALTER TABLE users ADD COLUMN last_ip TEXT' },
      { name: 'last_city', sql: 'ALTER TABLE users ADD COLUMN last_city TEXT' },
      { name: 'ip_address', sql: 'ALTER TABLE activity_logs ADD COLUMN ip_address TEXT' },
      { name: 'city', sql: 'ALTER TABLE activity_logs ADD COLUMN city TEXT' },
      { name: 'completed_at', sql: 'ALTER TABLE events ADD COLUMN completed_at TEXT' },
    ];

    for (const col of columnsToAdd) {
      try {
        await client.execute(col.sql);
        console.log(`✅ Added column: ${col.name}`);
      } catch (e: any) {
        const msg = (e.message || '').toLowerCase();
        if (msg.includes('duplicate') || msg.includes('already exists')) {
          // колонка уже есть - все в порядке
        } else {
          // таблица может еще не существовать до миграции
        }
      }
    }

    // Проверка и создание аккаунта администратора
    try {
      const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).get();

      if (!existingAdmin) {
        console.log('🔑 Creating default admin account...');
        const hash = await bcrypt.hash(adminPassword, 10);

        await db.insert(users).values({
          id: crypto.randomUUID(),
          email: adminEmail,
          passwordHash: hash,
          name: 'Administrator',
          role: 'admin',
        });

        console.log('✅ Admin created successfully!');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
      } else if (existingAdmin.role !== 'admin') {
        console.log('🔑 Upgrading existing user to admin...');
        await db.update(users).set({ role: 'admin' }).where(eq(users.id, existingAdmin.id));
        console.log('✅ User upgraded to admin');
      } else {
        console.log('ℹ️ Admin account already exists and is active.');
      }
    } catch (err: any) {
      console.warn('⚠️ Admin check skipped (tables may be pending migration):', err.message);
    }
  } catch (err) {
    console.error('⚠️ Initialization failed:', err);
  }
}

// Запускаем инициализацию в фоне
ensureDbInitialized().catch(console.error);

export const app = new Hono();

app.use('*', cors({
  origin: (origin) => {
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return origin || '*';
    }
    // На Vercel фронтенд и бэкенд на одном источнике, но разрешаем и кастомный CLIENT_ORIGIN или vercel.app
    if (origin.endsWith('.vercel.app') || origin === clientOrigin) {
      return origin;
    }
    return clientOrigin;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-Client-Timezone', 'X-Client-City'],
}));

// Промежуточный middleware для гарантии инициализации БД
app.use('*', async (c, next) => {
  await ensureDbInitialized();
  await next();
});

const userActivityThrottle = new Map<string, number>();

// Middleware отслеживания активности пользователей (IP, город, время последнего визита)
app.use('*', async (c, next) => {
  await next();

  const userId = c.req.header('X-User-Id');
  if (userId && !c.req.path.startsWith('/api/admin')) {
    const lastTracked = userActivityThrottle.get(userId) || 0;
    const nowMs = Date.now();
    // Обновляем активность не чаще одного раза в 2 минуты для оптимизации БД
    if (nowMs - lastTracked > 120_000) {
      userActivityThrottle.set(userId, nowMs);
      const ip = extractClientIp(c);
      resolveClientCity(c, ip).then(async (city) => {
        try {
          const nowIso = new Date().toISOString();
          await db.update(users).set({ 
            lastLogin: nowIso,
            lastIp: ip, 
            lastCity: city 
          }).where(eq(users.id, userId));

          await db.insert(activityLogs).values({
            id: crypto.randomUUID(),
            userId,
            action: 'active',
            ipAddress: ip,
            city,
            createdAt: nowIso,
          });
        } catch {
          // Игнорируем фоновые ошибки трекинга
        }
      }).catch(() => {});
    }
  }
});

// Подключаем маршруты
app.route('/api/auth', authRoutes);
app.route('/api', authRoutes);
app.route('/api/admin', adminRoutes);

app.get('/api/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/', (c) => c.json({ status: 'ok', service: 'Goal Tracker API' }));

export default app;
