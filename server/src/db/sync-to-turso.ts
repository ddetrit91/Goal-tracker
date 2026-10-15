import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../../');
const localDbPath = path.join(rootDir, 'local.db');

const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

async function sync() {
  if (!tursoUrl || tursoUrl.startsWith('file:')) {
    console.error('❌ Ошибка: Переменная TURSO_DATABASE_URL не установлена или указывает на локальный файл.');
    console.log('Пожалуйста, добавьте TURSO_DATABASE_URL и TURSO_AUTH_TOKEN в файл server/.env');
    process.exit(1);
  }

  if (!fs.existsSync(localDbPath)) {
    console.error(`❌ Ошибка: Локальная база ${localDbPath} не найдена.`);
    process.exit(1);
  }

  console.log(`🔌 Подключение к локальной базе: ${localDbPath}`);
  const sqlite = new Database(localDbPath);

  console.log(`☁️ Подключение к Turso: ${tursoUrl}`);
  const turso = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  const tables = ['users', 'categories', 'goals', 'tasks', 'activity_logs', 'settings'];

  console.log('🚀 Начало переноса данных...');

  for (const table of tables) {
    try {
      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all() as Record<string, any>[];
      console.log(`📋 Таблица "${table}": найдено ${rows.length} записей.`);

      if (rows.length === 0) continue;

      for (const row of rows) {
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => row[col]);

        const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        await turso.execute({
          sql,
          args: values,
        });
      }
      console.log(`✅ Таблица "${table}" успешно перенесена в Turso!`);
    } catch (err: any) {
      console.warn(`⚠️ Внимание при обработке таблицы "${table}":`, err.message);
    }
  }

  console.log('🎉 Синхронизация данных в Turso успешно завершена!');
}

sync().catch((err) => {
  console.error('❌ Ошибка синхронизации:', err);
  process.exit(1);
});
