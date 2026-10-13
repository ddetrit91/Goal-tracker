// client/src/components/vision/WishlistCard.tsx
import { ProgressBar } from '@/components/common/ProgressBar';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { Button } from '@/components/common/Button';
import { Target, Wallet } from 'lucide-react';
import type { Goal } from '@/types/goal';

interface WishlistCardProps {
  goal: Goal;
  onConvertToGoal?: (goal: Goal) => void;
}

export function WishlistCard({ goal, onConvertToGoal }: WishlistCardProps) {
  const currentAmount = goal.estimatedCost ? (goal.progress / 100) * goal.estimatedCost : 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 dark:bg-slate-800 dark:border-slate-700">
      {/* Фоновая иконка кошелька */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Wallet className="h-16 w-16 text-slate-900 dark:text-white" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <CategoryBadge category={goal.category} size="md" />
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full dark:bg-slate-900 dark:text-slate-500">
            Виш-лист
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-white">{goal.title}</h3>
        
        {goal.description && (
          <p className="text-sm text-slate-500 mb-4 line-clamp-2 dark:text-slate-400">{goal.description}</p>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-600 font-medium dark:text-slate-200">
              {currentAmount.toLocaleString('ru-RU')} {goal.currency || 'UZS'}
            </span>
            
            <span className="text-slate-400 dark:text-slate-500">
              из {goal.estimatedCost?.toLocaleString('ru-RU') || 0} {goal.currency || 'UZS'}
            </span>
          </div>
          <ProgressBar progress={goal.progress} size="sm" showLabel={false} />
        </div>

        {onConvertToGoal && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            onClick={() => onConvertToGoal(goal)}
          >
            <Target className="h-4 w-4" />
            Превратить в цель
          </Button>
        )}
      </div>
    </div>
  );
}