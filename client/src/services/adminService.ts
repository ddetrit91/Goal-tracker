import { API_BASE } from '@/config/api';

const getUserId = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').id;
  } catch { 
    return null; 
  }
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-User-Id': getUserId() || '',
});

export const adminService = {
  // Получить всех пользователей
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  // Создать нового пользователя
  createUser: async (email: string, password: string, name?: string, role?: string) => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, name, role }),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  },

  // Изменить роль пользователя
  updateUserRole: async (userId: string, role: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update role');
    return res.json();
  },

  // Сбросить/установить пароль (теперь принимает newPassword)
  resetPassword: async (userId: string, newPassword: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) throw new Error('Failed to reset password');
    return res.json();
  },

  // Удалить пользователя
  deleteUser: async (userId: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete user');
  },

  // Получить статистику системы
  getStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Получить настройки
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/admin/settings`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  // Обновить настройку
  updateSetting: async (key: string, value: string) => {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error('Failed to update setting');
    return res.json();
  },

  // <-- ДОБАВЛЕНО: Получить журнал активности
  getActivity: async () => {
    const res = await fetch(`${API_BASE}/admin/activity`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch activity');
    return res.json();
  },
};