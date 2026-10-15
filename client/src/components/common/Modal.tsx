// client/src/components/common/Modal.tsx
import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          // Светлая тема
          'relative w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-200',
          // Темная тема
          'dark:bg-slate-800 dark:ring-slate-700 dark:shadow-black/50',
          className
        )}
      >
        {title && (
          <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}