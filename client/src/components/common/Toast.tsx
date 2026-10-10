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
      const timer = setTimeout(onClose, 3000); // Автозакрытие через 3 сек
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={cn(
        "flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border",
        "bg-emerald-50 border-emerald-200 text-emerald-900"
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white shrink-0">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium pr-2">{message}</p>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-emerald-200/50 rounded-full transition-colors text-emerald-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}