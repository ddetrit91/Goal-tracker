import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
// Файл local.db создастся автоматически в корне папки client
var sqlite = new Database('./local.db');
sqlite.pragma('journal_mode = WAL'); // Включаем WAL для производительности
export var db = drizzle(sqlite, { schema: schema });
