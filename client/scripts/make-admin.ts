// client/scripts/make-admin.ts
import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Введите email пользователя для назначения админом: ', async (email) => {
  try {
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    
    if (!user) {
      console.error(` Пользователь с email "${email}" не найден`);
      rl.close();
      process.exit(1);
    }

    await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
    console.log(`✅ Пользователю "${user.name || user.email}" назначена роль admin`);
  } catch (err) {
    console.error(' Ошибка:', err);
  } finally {
    rl.close();
  }
});