// client/src/pages/AdminPage.tsx
import * as React from 'react';
import { adminService } from '@/services/adminService';
import { 
  Users, BarChart3, Settings, UserCog, Key, Trash2, CheckCircle2, XCircle, 
  Plus, Activity, CalendarDays, LogIn 
} from 'lucide-react';
import { cn } from '@/utils/cn';

type Tab = 'users' | 'stats' | 'settings' | 'activity';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  goalCount: number;
  createdAt: string;
  lastLogin?: string;
}

interface Stats {
  totalUsers: number;
  activeToday: number;
  requestsToday: number;
  registrationsByDay: { date: string; count: number }[];
  requestsByDay: { date: string; count: number }[];
}

interface ActivityLog {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  lastLogin: string;
  requestCount: number;
}

export function AdminPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>('users');
  const [users, setUsers] = React.useState<User[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [activityLogs, setActivityLogs] = React.useState<ActivityLog[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [roleModalUser, setRoleModalUser] = React.useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = React.useState<User | null>(null);
  const [newPassword, setNewPassword] = React.useState('');
  const [createUserModalOpen, setCreateUserModalOpen] = React.useState(false);
  const [newUserForm, setNewUserForm] = React.useState({ email: '', password: '', name: '', role: 'user' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
      setError(null);
    } catch {
      setError('Не удалось загрузить пользователей');
      showToast('Ошибка загрузки пользователей', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = React.useCallback(async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  const fetchActivity = React.useCallback(async () => {
    try {
      const data = await adminService.getActivity();
      setActivityLogs(data);
    } catch (err) {
      console.error('Failed to load activity', err);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'activity') fetchActivity();
  }, [activeTab, fetchUsers, fetchStats, fetchActivity]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      showToast(`Роль успешно обновлена`, 'success');
      setRoleModalUser(null);
      fetchUsers();
    } catch {
      showToast('Не удалось обновить роль', 'error');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      showToast('Пароль должен быть не менее 6 символов', 'error');
      return;
    }
    try {
      await adminService.resetPassword(userId, newPassword);
      showToast('Пароль успешно изменен', 'success');
      setResetPasswordUser(null);
      setNewPassword('');
    } catch {
      showToast('Не удалось изменить пароль', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    try {
      await adminService.deleteUser(userId);
      showToast('Пользователь удален', 'success');
      fetchUsers();
    } catch {
      showToast('Не удалось удалить пользователя', 'error');
    }
  };

  const handleCreateUser = async () => {
    try {
      await adminService.createUser(newUserForm.email, newUserForm.password, newUserForm.name, newUserForm.role);
      showToast('Пользователь создан', 'success');
      setCreateUserModalOpen(false);
      setNewUserForm({ email: '', password: '', name: '', role: 'user' });
      fetchUsers();
    } catch {
      showToast('Не удалось создать пользователя', 'error');
    }
  };

  const tabs = [
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'stats', label: 'Статистика', icon: BarChart3 },
    { id: 'activity', label: 'Активность', icon: Activity },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-28 md:pb-6">
      {/* Заголовок */}
      <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5 sm:gap-3">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Панель администратора</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Управление пользователями и системными настройками</p>
        </div>
        
        {activeTab === 'users' && (
          <button
            onClick={() => setCreateUserModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm w-full sm:w-auto shrink-0 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Создать пользователя</span>
          </button>
        )}
      </header>

      {/* Вкладки */}
      <div className="flex gap-1.5 sm:gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-none pb-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors border-b-2 shrink-0",
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Вкладка: Пользователи */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">Загрузка...</div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">Нет пользователей</div>
          ) : (
            <>
              {/* МОБИЛЬНЫЙ ВИД: Карточки пользователей */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
                {users.map((user) => (
                  <div key={user.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                          {user.name || 'Без имени'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0",
                        user.role === 'admin' 
                          ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50" 
                          : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/80 dark:text-slate-200 dark:border-slate-600"
                      )}>
                        {user.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg">
                      <div>
                        <span>Целей: </span>
                        <strong className="text-slate-900 dark:text-white font-mono">{user.goalCount}</strong>
                      </div>
                      <div>
                        <span>Рег: </span>
                        <span>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                      <button
                        onClick={() => setRoleModalUser(user)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <UserCog className="h-3.5 w-3.5" /> Роль
                      </button>
                      <button
                        onClick={() => setResetPasswordUser(user)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        <Key className="h-3.5 w-3.5" /> Пароль
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ДЕСКТОПНЫЙ ВИД: Таблица */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Имя</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Роль</th>
                      <th className="px-6 py-4 font-semibold">Записей</th>
                      <th className="px-6 py-4 font-semibold">Дата регистрации</th>
                      <th className="px-6 py-4 font-semibold">Последняя активность</th>
                      <th className="px-6 py-4 font-semibold text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.name || '—'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            user.role === 'admin' 
                              ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50" 
                              : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/80 dark:text-slate-200 dark:border-slate-600"
                          )}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-mono font-bold">{user.goalCount}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {new Date(user.createdAt).toLocaleString('ru-RU')}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString('ru-RU') : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setRoleModalUser(user)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="Изменить роль">
                              <UserCog className="h-4 w-4" />
                            </button>
                            <button onClick={() => setResetPasswordUser(user)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Сбросить пароль">
                              <Key className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Удалить">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Вкладка: Статистика */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Всего пользователей', value: stats?.totalUsers ?? '...', icon: Users, color: 'indigo' },
              { label: 'Активных сегодня', value: stats?.activeToday ?? '...', icon: CheckCircle2, color: 'emerald' },
              { label: 'Запросов за день', value: stats?.requestsToday ?? '...', icon: BarChart3, color: 'blue' },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</span>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-500" />
                Регистрации по дням
              </h3>
              <div className="space-y-3">
                {(() => {
                  const maxRegs = Math.max(1, ...(stats?.registrationsByDay?.map(r => r.count) || [1]));
                  return stats?.registrationsByDay.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                      <span className="text-slate-500 dark:text-slate-400 w-20 sm:w-24 shrink-0">{new Date(item.date).toLocaleDateString('ru-RU')}</span>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${Math.min((item.count / maxRegs) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white w-7 sm:w-8 text-right shrink-0">{item.count}</span>
                    </div>
                  ));
                })()}
                {(!stats?.registrationsByDay || stats.registrationsByDay.length === 0) && (
                  <p className="text-sm text-slate-400 italic">Нет данных за последние дни</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500 shrink-0" />
                <span>Запросы по дням</span>
              </h3>
              <div className="space-y-3">
                {(() => {
                  const maxRequests = Math.max(1, ...(stats?.requestsByDay?.map(r => r.count) || [1]));
                  return stats?.requestsByDay.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                      <span className="text-slate-500 dark:text-slate-400 w-20 sm:w-24 shrink-0">{new Date(item.date).toLocaleDateString('ru-RU')}</span>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${Math.min((item.count / maxRequests) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white w-7 sm:w-8 text-right shrink-0">{item.count}</span>
                    </div>
                  ));
                })()}
                {(!stats?.requestsByDay || stats.requestsByDay.length === 0) && (
                  <p className="text-sm text-slate-400 italic">Нет данных за последние дни</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Вкладка: Активность */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 truncate">
              <LogIn className="h-5 w-5 text-blue-500 shrink-0" /> 
              <span>Активность пользователей</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600 whitespace-nowrap shrink-0">
              Пользователей: {activityLogs.length}
            </span>
          </div>

          {/* МОБИЛЬНЫЙ ВИД: Карточки логов */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
            {activityLogs.length > 0 ? activityLogs.map((log, index) => (
              <div key={index} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                      {log.userName || (log.userEmail ? log.userEmail.split('@')[0] : 'Пользователь')}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{log.userEmail || '—'}</p>
                  </div>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0",
                    log.userRole === 'admin' 
                      ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50" 
                      : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/80 dark:text-slate-200 dark:border-slate-600"
                  )}>
                    {log.userRole || 'user'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between pt-1">
                  <span>Последняя активность</span>
                  <span>{log.lastLogin ? new Date(log.lastLogin).toLocaleString('ru-RU') : '—'}</span>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-400 text-sm">Нет данных о пользователях.</div>
            )}
          </div>

          {/* ДЕСКТОПНЫЙ ВИД: Таблица логов */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Пользователь</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Роль</th>
                  <th className="px-6 py-4 font-semibold">Последняя активность</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {activityLogs.length > 0 ? activityLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {log.userName || (log.userEmail ? log.userEmail.split('@')[0] : 'Пользователь')}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{log.userEmail || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        log.userRole === 'admin' 
                          ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50" 
                          : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/80 dark:text-slate-200 dark:border-slate-600"
                      )}>
                        {log.userRole || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {log.lastLogin ? new Date(log.lastLogin).toLocaleString('ru-RU') : '—'}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Нет данных о входах.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Вкладка: Настройки */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Системные настройки</h3>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div>
              <div className="font-medium text-slate-900 dark:text-white">Разрешить регистрацию</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Новые пользователи смогут создавать аккаунты</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      )}

      {/* МОДАЛКА: Создание пользователя */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Создать пользователя</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input 
                  type="email" 
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Пароль</label>
                <input 
                  type="password" 
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                  placeholder="Минимум 6 символов"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Имя</label>
                <input 
                  type="text" 
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                  placeholder="Иван Иванов"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Роль</label>
                <select 
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setCreateUserModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Отмена
              </button>
              <button onClick={handleCreateUser} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА: Изменение роли */}
      {roleModalUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Изменить роль</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Пользователь: <strong>{roleModalUser.name || roleModalUser.email}</strong>
            </p>
            <select
              defaultValue={roleModalUser.role}
              onChange={(e) => handleUpdateRole(roleModalUser.id, e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setRoleModalUser(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА: Сброс пароля */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Установить новый пароль</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Для пользователя: <strong>{resetPasswordUser.name || resetPasswordUser.email}</strong>
            </p>
            <input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Введите новый пароль (мин. 6 символов)"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setResetPasswordUser(null); setNewPassword(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Отмена
              </button>
              <button
                onClick={() => handleResetPassword(resetPasswordUser.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast уведомления */}
      {toast && (
        <div className={cn(
          "fixed bottom-20 md:bottom-6 right-4 sm:right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300 z-[70]",
          toast.type === 'success' ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}