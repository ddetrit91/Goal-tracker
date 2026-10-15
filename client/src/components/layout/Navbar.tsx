// client/src/components/layout/Navbar.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { 
  CalendarCheck, Target, Star, BarChart3, Settings, Lightbulb, LogOut, User, UserCog
} from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';

const NAV_ITEMS = [
  { path: '/today', label: 'Сегодня', icon: CalendarCheck, tourId: 'today' },
  { path: '/goals', label: 'Цели', icon: Target, tourId: 'goals' },
  { path: '/vision-board', label: 'Мечты', icon: Star, tourId: 'vision-board' },
  { path: '/analytics', label: 'Обзор', icon: BarChart3, tourId: 'analytics' },
  { path: '/settings', label: 'Настройки', icon: Settings, tourId: 'settings' },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Получаем данные пользователя один раз
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  const isAdmin = currentUser?.role === 'admin';

  const restartTour = () => {
    localStorage.removeItem('hasSeenOnboarding');
    navigate('/today');
    setTimeout(() => window.location.reload(), 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {/* МОБИЛЬНЫЙ ВЕРХНИЙ ХЕДЕР (md:hidden) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between transition-colors">
        <h1 className="text-base font-bold text-slate-900 flex items-center gap-2 dark:text-white" data-tour="logo">
          <Target className="h-5 w-5 text-indigo-600" />
          <span>Goal Tracker</span>
        </h1>

        <div className="flex items-center gap-1.5">
          <button
            onClick={restartTour}
            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition-colors"
            title="Повторить обучение"
            aria-label="Повторить обучение"
          >
            <Lightbulb className="h-5 w-5" />
          </button>
          
          <ThemeToggle />

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors ml-1"
            title="Выйти"
            aria-label="Выйти"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ОСНОВНАЯ НАВИГАЦИЯ (Десктоп - сайдбар слева, Мобилка - нижняя панель) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:left-0 md:top-0 md:h-screen md:w-72 md:border-r md:border-t-0 md:flex-col md:items-start md:justify-between md:p-6 dark:bg-slate-900/95 dark:border-slate-800 transition-colors duration-300">
        
        {/* ВЕРХНЯЯ ЧАСТЬ ДЛЯ ДЕСКТОПА: Логотип + Профиль пользователя */}
        <div className="hidden md:flex flex-col w-full gap-4 mb-6">
          
          {/* Логотип и переключатели */}
          <div className="flex items-center justify-between w-full">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap dark:text-white" data-tour="logo">
              <Target className="h-6 w-6 shrink-0 text-indigo-600" />
              <span className="truncate">Goal Tracker</span>
            </h1>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={restartTour}
                className="group flex items-center justify-center p-2 rounded-lg transition-all duration-200 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:hover:bg-indigo-900/50"
                title="Повторить обучение"
              >
                <Lightbulb className="h-5 w-5 text-indigo-600 group-hover:text-indigo-700 transition-colors dark:text-indigo-400" />
              </button>
              
              <ThemeToggle />
            </div>
          </div>

          {/* БЛОК ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ */}
          <div className="flex items-center gap-3 p-3 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
                {currentUser.name || 'Пользователь'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                {currentUser.email || ''}
              </span>
            </div>
          </div>

          {/* Тонкий разделитель перед меню */}
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
        </div>
        
        {/* Центральная часть: Навигация */}
        <ul className="flex items-center justify-around md:flex-col md:space-y-1 w-full">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.path} className="flex-1 md:flex-initial md:w-full">
                <button
                  onClick={() => navigate(item.path)}
                  data-tour={item.tourId || ''} 
                  className={cn(
                    'flex flex-col md:flex-row items-center justify-center md:justify-start md:gap-3 p-2 md:px-4 md:py-2.5 rounded-xl transition-all w-full',
                    isActive 
                      ? 'text-indigo-600 bg-indigo-50/80 font-semibold dark:text-indigo-400 dark:bg-indigo-900/30' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50'
                  )}
                >
                  <Icon className="h-6 w-6 shrink-0" />
                  <span className="text-xs md:text-sm mt-1 md:mt-0 font-medium truncate">{item.label}</span>
                </button>
              </li>
            );
          })}

          {/* ПУНКТ МЕНЮ: Админ панель */}
          {isAdmin && (
            <li key="/admin" className="flex-1 md:flex-initial md:w-full">
              <button
                onClick={() => navigate('/admin')}
                className={cn(
                  'flex flex-col md:flex-row items-center justify-center md:justify-start md:gap-3 p-2 md:px-4 md:py-2.5 rounded-xl transition-all w-full',
                  location.pathname === '/admin'
                    ? 'text-indigo-600 bg-indigo-50/80 font-semibold dark:text-indigo-400 dark:bg-indigo-900/30'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50'
                )}
              >
                <UserCog className="h-6 w-6 shrink-0" />
                <span className="text-xs md:text-sm mt-1 md:mt-0 font-medium truncate">Админ</span>
              </button>
            </li>
          )}
        </ul>

        {/* Нижняя часть для десктопа: Только кнопка выхода */}
        <div className="hidden md:flex w-full mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors rounded-lg"
            title="Выйти из аккаунта"
          >
            <LogOut className="h-6 w-6" />
            <span className="text-sm font-medium">Выйти</span>
          </button>
        </div>
      </nav>
    </>
  );
}