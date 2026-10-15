import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import { db } from './db';
import { users } from './db/schema';

// Загрузка переменных окружения
dotenv.config();

const port = Number(process.env.PORT) || 3000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@goaltracker.local';
const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';

// 1. ПРОВЕРКА СХЕМЫ И СОЗДАНИЕ АДМИНА
(async () => {
  try {
    console.log('🔧 Checking database schema...');
    
    const columnsToAdd = [
      { name: 'start_date', sql: 'ALTER TABLE goals ADD COLUMN start_date TEXT' },
      { name: 'status', sql: "ALTER TABLE goals ADD COLUMN status TEXT DEFAULT 'backlog'" },
      { name: 'is_today_goal', sql: 'ALTER TABLE goals ADD COLUMN is_today_goal INTEGER DEFAULT 0' },
      { name: 'completed_at', sql: 'ALTER TABLE goals ADD COLUMN completed_at TEXT' },
      { name: 'role', sql: "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'" },
    ];

    for (const col of columnsToAdd) {
      try {
        await db.run(col.sql);
        console.log(`✅ Added column: ${col.name}`);
      } catch (e: any) {
        const msg = (e.message || '').toLowerCase();
        if (msg.includes('duplicate') || msg.includes('already exists')) {
          console.log(`ℹ️ Column already exists: ${col.name}`);
        } else {
          console.error(`❌ Failed to add column ${col.name}:`, e.message);
        }
      }
    }
    
    console.log('✅ Database schema is ready!');

    // 2. АВТОМАТИЧЕСКОЕ СОЗДАНИЕ АДМИНА
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

  } catch (err) {
    console.error('⚠️ Initialization failed:', err);
  }
})();

// 3. НАСТРОЙКА СЕРВЕРА
const app = new Hono();

app.use('*', cors({
  origin: (origin) => {
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return origin || '*';
    }
    return clientOrigin;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'], 
}));

// Подключаем маршруты
app.route('/api/auth', authRoutes); 
app.route('/api', authRoutes); 
app.route('/api/admin', adminRoutes);

app.get('/api/health', (c) => c.json({ status: 'ok' }));

console.log(`🚀 Server is running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
