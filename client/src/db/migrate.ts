// client/src/db/migrate.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.join(__dirname, '../../drizzle');

// Проверяем существование папки и файлов
if (fs.existsSync(migrationsFolder)) {
  const files = fs.readdirSync(migrationsFolder).filter(f => f.endsWith('.sql'));
  
  if (files.length > 0) {
    console.log(`🔧 Applying ${files.length} migration(s)...`);
    try {
      migrate(db, { migrationsFolder });
      console.log('✅ Migrations applied successfully!');
    } catch (err) {
      console.error('❌ Migration failed:', err);
    }
  } else {
    console.log('ℹ️ No pending migrations found. Database is up to date.');
  }
} else {
  console.log('ℹ️ Migrations folder not found. Skipping migration step.');
}