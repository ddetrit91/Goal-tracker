import * as React from 'react';
import { Button } from '@/components/common/Button';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { Goal } from '@/types/goal';

interface DreamCardProps {
  goal: Goal;
  onStartPlanning?: (goal: Goal) => void;
}

export function DreamCard({ goal, onStartPlanning }: DreamCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
      {/* Декоративный элемент */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl transition-all group-hover:bg-white/20" />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <Sparkles className="h-6 w-6 text-yellow-300" />
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
              Мечта
            </span>
          </div>

          <h3 className="text-xl font-bold mb-2 leading-tight">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-indigo-100 line-clamp-3 mb-4">
              {goal.description}
            </p>
          )}
        </div>

        {onStartPlanning && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2 bg-white/10 text-white hover:bg-white/20 border-0"
            onClick={() => onStartPlanning(goal)}
          >
            Начать планирование
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}