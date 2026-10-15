// client/src/config/api.ts
export const API_BASE = import.meta.env.VITE_API_URL || '/api';
export const SERVER_URL = API_BASE.replace(/\/api\/?$/, '');
