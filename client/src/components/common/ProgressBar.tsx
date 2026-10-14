import { cn } from '@/utils/cn';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ progress, className, showLabel = true, size = 'md' }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const getBarColor = () => {
    if (clampedProgress === 0) return 'bg-slate-200 dark:bg-slate-500'; // Чуть светлее в темной теме для контраста с белым треком
    if (clampedProgress === 100) return 'bg-emerald-500';
    return 'bg-indigo-600';
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          // Текст "Прогресс" - светлый в темной теме
          <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
            Прогресс
          </span>
        )}
        {showLabel && (
          // Проценты - белые/светлые в темной теме
          <span className="text-xs font-semibold text-slate-700 dark:text-white">
            {clampedProgress}%
          </span>
        )}
      </div>
      
      {/* Трек остается БЕЛЫМ (bg-slate-100) даже в темной теме, как ты просил */}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', getBarColor())}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}