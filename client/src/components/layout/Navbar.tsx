import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { 
  CalendarCheck, Target, Star, BarChart3, Settings, Lightbulb 
} from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';

const NAV_ITEMS = [
  { path: '/today', label: 'Сегодня', icon: CalendarCheck, tourId: 'today' },
  { path: '/goals', label: 'Цели', icon: Target, tourId: 'goals' },
  { path: '/vision-board', label: 'Мечты', icon: Star },
  { path: '/analytics', label: 'Обзор', icon: BarChart3, tourId: 'analytics' },
  { path: '/settings', label: 'Настройки', icon: Settings, tourId: 'settings' },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const restartTour = () => {
    localStorage.removeItem('hasSeenOnboarding');
    if (location.pathname !== '/goals') {
      navigate('/goals');
    }
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-4 py-2 md:left-0 md:top-0 md:h-screen md:w-72 md:border-r md:border-t-0 md:flex-col md:items-start md:justify-start md:p-6 dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300">
      
      <div className="hidden md:flex items-center justify-between mb-8 w-full gap-2">
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
      
      <ul className="flex justify-around md:flex-col md:space-y-2 w-full">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <li key={item.path} className="w-full">
              <button
                onClick={() => navigate(item.path)}
                data-tour={item.tourId || ''} 
                className={cn(
                  'flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-lg transition-colors w-full',
                  // Активная вкладка
                  isActive 
                    ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20' 
                    // Неактивная вкладка (светлая / темная)
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50'
                )}
              >
                <Icon className="h-6 w-6 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm font-medium mt-1 md:mt-0">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}