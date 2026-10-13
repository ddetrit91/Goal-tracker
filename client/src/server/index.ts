// client/src/server/index.ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import authRoutes from './auth';
import adminRoutes from './admin';
import { db } from '../db';
import { users } from '../db/schema';

// 1. ПРОВЕРКА СХЕМЫ И СОЗДАНИЕ АДМИНА
(async () => {
  try {
    console.log('🔧 Checking database schema...');
    
    const columnsToAdd = [
      { name: 'start_date', sql: 'ALTER TABLE goals ADD COLUMN start_date TEXT' },
      { name: 'status', sql: "ALTER TABLE goals ADD COLUMN status TEXT DEFAULT 'backlog'" },
      { name: 'is_today_goal', sql: 'ALTER TABLE goals ADD COLUMN is_today_goal INTEGER DEFAULT 0' },
      { name: 'role', sql: "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'" },
    ];

    for (const col of columnsToAdd) {
      try {
        await db.run(col.sql);
        console.log(`✅ Added column: ${col.name}`);
      } catch (e: any) {
        if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
          console.log(`ℹ️ Column already exists: ${col.name}`);
        } else {
          console.error(`❌ Failed to add column ${col.name}:`, e.message);
        }
      }
    }
    
    console.log('✅ Database schema is ready!');

    // 2. АВТОМАТИЧЕСКОЕ СОЗДАНИЕ АДМИНА
    const adminEmail = 'admin@goaltracker.local';
    const adminPassword = 'AdminPass123!';
    
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
      console.log('️ Admin account already exists and is active.');
    }

  } catch (err) {
    console.error('⚠️ Initialization failed:', err);
  }
})();

// 3. НАСТРОЙКА СЕРВЕРА (ЕДИНСТВЕННЫЙ БЛОК)
const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'], 
}));

// Подключаем авторизацию к /api/auth
app.route('/api/auth', authRoutes); 

// Подключаем ЦЕЛИ И ЗАДАЧИ к корню /api (чтобы фронтенд видел /api/goals)
app.route('/api', authRoutes); 

// Подключаем админку
app.route('/api/admin', adminRoutes);

app.get('/api/health', (c) => c.json({ status: 'ok' }));

const port = 3000;
console.log(` Server is running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });  