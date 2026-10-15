// client/src/config/api.ts
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const SERVER_URL = API_BASE.replace(/\/api\/?$/, '');
