import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalFormModal } from '@/components/goals/GoalFormModal';
import { UpcomingDeadlines } from '@/components/goals/UpcomingDeadlines';
import { Button } from '@/components/common/Button';
import { Plus, Filter } from 'lucide-react';
import type { GoalHorizon, Goal } from '@/types/goal';

const HORIZON_TABS: { value: GoalHorizon | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'annual', label: 'Год' },
  { value: 'quarterly', label: 'Квартал' },
  { value: 'monthly', label: 'Месяц' },
];

export function GoalsPage() {
  const { goals, fetchGoals, getByHorizon } = useGoalStore();
  const [activeTab, setActiveTab] = React.useState<GoalHorizon | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedParentId, setSelectedParentId] = React.useState<string | null>(null);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);

  React.useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const filteredGoals = activeTab === 'all' 
    ? goals.filter(g => g.parentId === null)
    : getByHorizon(activeTab).filter(g => g.parentId === null);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24 md:pb-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Цели</h1>
          <p className="text-slate-500 mt-1">Декомпозиция больших целей на маленькие шаги</p>
        </div>
        <Button 
          onClick={() => { 
            setSelectedParentId(null); 
            setEditingGoal(null);
            setIsModalOpen(true); 
          }} 
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Новая цель
        </Button>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {HORIZON_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Блок ближайших дедлайнов */}
      <div data-tour="deadlines">
        <UpcomingDeadlines />
      </div>

      <div className="space-y-6">
        {filteredGoals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
            <Filter className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">В этой категории пока нет целей.</p>
            <Button 
              variant="ghost" 
              className="mt-2 text-indigo-600"
              onClick={() => { setSelectedParentId(null); setEditingGoal(null); setIsModalOpen(true); }}
            >
              Создать первую цель
            </Button>
          </div>
        ) : (
          filteredGoals.map((goal) => (
            <div key={goal.id} className="relative">
              <GoalCard 
                goal={goal} 
                onAddSubgoal={(parentId) => {
                  setSelectedParentId(parentId);
                  setEditingGoal(null);
                  setIsModalOpen(true);
                }}
                onEditGoal={(goalToEdit) => {
                  setEditingGoal(goalToEdit);
                  setIsModalOpen(true);
                }}
                onDeleteGoal={async (id) => {
                  await useGoalStore.getState().deleteGoal(id);
                  window.dispatchEvent(new CustomEvent('show-toast', { 
                    detail: { message: 'Цель успешно удалена!' } 
                  }));
                }}
              />
            </div>
          ))
        )}
      </div>

      <GoalFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(null);
          setSelectedParentId(null);
        }}
        parentId={selectedParentId}
        defaultHorizon={activeTab === 'all' ? undefined : activeTab}
        initialData={editingGoal}
      />
    </div>
  );
}