import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

function clean(val?: string) {
  if (!val) return val;
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultLocalDbPath = `file:${path.resolve(__dirname, '../../local.db').replace(/\\/g, '/')}`;

const rawUrl = clean(process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL);
let url = rawUrl;

if (!url) {
  url = defaultLocalDbPath;
} else if (url.startsWith('file:') && !path.isAbsolute(url.slice(5))) {
  url = `file:${path.resolve(__dirname, '../../', url.slice(5)).replace(/\\/g, '/')}`;
} else if (url.startsWith('./') || url.startsWith('../')) {
  url = `file:${path.resolve(__dirname, '../../', url).replace(/\\/g, '/')}`;
}

const authToken = clean(process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN);

console.log(`🔌 Database connecting to: ${url?.startsWith('libsql://') ? url.slice(0, 25) + '...' : url}`);

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });
