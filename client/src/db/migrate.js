// client/src/db/migrate.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var migrationsFolder = path.join(__dirname, '../../drizzle');
// Проверяем существование папки и файлов
if (fs.existsSync(migrationsFolder)) {
    var files = fs.readdirSync(migrationsFolder).filter(function (f) { return f.endsWith('.sql'); });
    if (files.length > 0) {
        console.log("\uD83D\uDD27 Applying ".concat(files.length, " migration(s)..."));
        try {
            migrate(db, { migrationsFolder: migrationsFolder });
            console.log('✅ Migrations applied successfully!');
        }
        catch (err) {
            console.error('❌ Migration failed:', err);
        }
    }
    else {
        console.log('ℹ️ No pending migrations found. Database is up to date.');
    }
}
else {
    console.log('ℹ️ Migrations folder not found. Skipping migration step.');
}
