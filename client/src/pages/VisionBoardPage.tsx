import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { DreamCard } from '@/components/vision/DreamCard';
import { WishlistCard } from '@/components/vision/WishlistCard';
import { GoalFormModal } from '@/components/goals/GoalFormModal';
import { Button } from '@/components/common/Button';
import { Sparkles, Gift } from 'lucide-react';
import type { Goal } from '@/types/goal';

export function VisionBoardPage() {
  const { goals, fetchGoals } = useGoalStore();
  const [isConvertModalOpen, setIsConvertModalOpen] = React.useState(false);
  const [sourceGoal, setSourceGoal] = React.useState<Goal | null>(null);

  React.useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const dreams = goals.filter((g) => g.category === 'dream');
  const wishlist = goals.filter((g) => g.category === 'wishlist');

  const handleConvertClick = (goal: Goal) => {
    setSourceGoal(goal);
    setIsConvertModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-24 md:pb-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Доска желаний & Виш-лист</h1>
        <p className="text-slate-500 mt-1">Вдохновение для будущих достижений</p>
      </header>

      {/* Секция Мечт */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-slate-900">Мечты и Визион-борд</h2>
        </div>
        
        {dreams.length === 0 ? (
          <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200">
            Добавьте свою первую мечту, чтобы визуализировать будущее.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dreams.map((dream) => (
              <DreamCard 
                key={dream.id} 
                goal={dream} 
                onStartPlanning={handleConvertClick} 
              />
            ))}
          </div>
        )}
      </section>

      {/* Секция Вишлиста */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">Виш-лист</h2>
        </div>

        {wishlist.length === 0 ? (
          <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200">
            Здесь могут быть ваши материальные желания с трекингом бюджета.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <WishlistCard 
                key={item.id} 
                goal={item} 
                onConvertToGoal={handleConvertClick} 
              />
            ))}
          </div>
        )}
      </section>

      {/* Модальное окно конвертации */}
      <GoalFormModal
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setSourceGoal(null);
        }}
        parentId={null}
        defaultHorizon="annual" // По умолчанию предлагаем годовой горизонт для реализации мечты
      />
    </div>
  );
}