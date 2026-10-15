import { serve } from '@hono/node-server';
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT) || 3000;

console.log(`🚀 Server is running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
