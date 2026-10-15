// client/src/config/api.ts
const envUrl = import.meta.env.VITE_API_URL;

// В продакшене никогда не используем localhost
export const API_BASE = (import.meta.env.PROD && envUrl && envUrl.includes('localhost'))
  ? '/api'
  : (envUrl || '/api');

export const SERVER_URL = API_BASE.replace(/\/api\/?$/, '');
