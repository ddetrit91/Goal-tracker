import { handle } from 'hono/vercel';
import app from '../server/src/app';

export default handle(app);
