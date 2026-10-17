import * as React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, isVisible, onClose }: ToastProps) {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000); // Автозакрытие через 4 сек
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[10000] w-[calc(100%-1.5rem)] sm:w-auto max-w-md px-2 pointer-events-none animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={cn(
        "pointer-events-auto flex items-center gap-2.5 sm:gap-3 p-3 sm:px-4 sm:py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all",
        "bg-white/95 dark:bg-slate-900/95 border-emerald-500/40 text-slate-800 dark:text-slate-100 shadow-emerald-500/10"
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500 text-white shrink-0 shadow-sm">
          <CheckCircle2 className="h-4.5 w-4.5" />
        </div>
        <p className="text-xs sm:text-sm font-medium flex-1 leading-snug">
          {message}
        </p>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
          aria-label="Закрыть уведомление"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}