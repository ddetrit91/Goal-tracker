import * as React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/utils/cn';

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Инициализация темы при монтировании (чтобы избежать гидратации)
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Предотвращаем мигание до определения темы
  if (!mounted) return <div className="w-10 h-10 rounded-lg" />;

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
        "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
        "dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      )}
      aria-label="Переключить тему"
    >
      {/* Анимированная смена иконок */}
      <div className="relative w-5 h-5">
        <Sun 
          className={cn(
            "absolute inset-0 w-5 h-5 transition-all duration-300 rotate-0 scale-100",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )} 
        />
        <Moon 
          className={cn(
            "absolute inset-0 w-5 h-5 transition-all duration-300 -rotate-90 scale-0",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )} 
        />
      </div>
    </button>
  );
}