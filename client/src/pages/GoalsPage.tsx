// client/src/pages/GoalsPage.tsx
import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { useTaskStore } from '@/store/useTaskStore';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalFormModal } from '@/components/goals/GoalFormModal';
import { UpcomingDeadlines } from '@/components/goals/UpcomingDeadlines';
import { GoalsCalendar } from '@/components/goals/GoalsCalendar';
import { Button } from '@/components/common/Button';
import { Plus, Filter, List, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { GoalHorizon, Goal } from '@/types/goal';

const HORIZON_TABS: { value: GoalHorizon | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'annual', label: 'Год' },
  { value: 'quarterly', label: 'Квартал' },
  { value: 'monthly', label: 'Месяц' },
];

export function GoalsPage() {
  const { goals, fetchGoals, getByHorizon, deleteGoal } = useGoalStore();
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const [activeTab, setActiveTab] = React.useState<GoalHorizon | 'all'>('all');
  const [viewMode, setViewMode] = React.useState<'tree' | 'calendar'>('tree');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedParentId, setSelectedParentId] = React.useState<string | null>(null);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);

  React.useEffect(() => {
    Promise.all([fetchGoals(), fetchTasks()]);
  }, [fetchGoals, fetchTasks]);

  const filteredGoals = activeTab === 'all' 
    ? goals.filter(g => g.parentId === null)
    : getByHorizon(activeTab).filter(g => g.parentId === null);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24 md:pb-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Цели</h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">Декомпозиция больших целей на маленькие шаги</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Переключатель вида: Список целей / Календарь целей */}
          <div data-tour="calendar-toggle" className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                viewMode === 'tree'
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <List className="h-4 w-4" />
              <span>Список</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                viewMode === 'calendar'
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Календарь</span>
            </button>
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
            <span>Новая цель</span>
          </Button>
        </div>
      </header>

      {/* УСЛОВНЫЙ РЕНДЕРИНГ: КАЛЕНДАРЬ ИЛИ СПИСОК ЦЕЛЕЙ */}
      {viewMode === 'calendar' ? (
        <GoalsCalendar 
          onSelectGoal={(goal) => {
            setEditingGoal(goal);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {HORIZON_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }
                dark:border-slate-700 
                ${activeTab !== tab.value ? 'dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700' : ''}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div data-tour="deadlines">
            <UpcomingDeadlines 
              activeHorizon={activeTab}
              onOpenCreateGoal={() => { 
                setSelectedParentId(null); 
                setEditingGoal(null); 
                setIsModalOpen(true); 
              }} 
            />
          </div>

          <div className="space-y-6">
            {filteredGoals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <Filter className="h-8 w-8 text-slate-300 mx-auto mb-3 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400">В этой категории пока нет целей.</p>
                <Button 
                  variant="ghost" 
                  className="mt-2 text-indigo-600 dark:text-indigo-400 dark:hover:bg-slate-700"
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
                      await deleteGoal(id); // <-- ИСПОЛЬЗУЕМ deleteGoal из стора
                      window.dispatchEvent(new CustomEvent('show-toast', { 
                        detail: { message: 'Цель успешно удалена!' } 
                      }));
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </>
      )}

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