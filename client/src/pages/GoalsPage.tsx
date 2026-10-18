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

  // Автоматическое переключение на "Календарь" во время обучающего шага онбординга
  React.useEffect(() => {
    const handleTourStep = (e: Event) => {
      const customEvent = e as CustomEvent<{ stepId: string }>;
      if (customEvent.detail?.stepId === 'calendar') {
        setViewMode('calendar');
      } else if (customEvent.detail?.stepId === 'deadlines' || customEvent.detail?.stepId === 'goals') {
        setViewMode('tree');
      }
    };
    window.addEventListener('tour-step-change', handleTourStep);
    return () => window.removeEventListener('tour-step-change', handleTourStep);
  }, []);

  const filteredGoals = activeTab === 'all' 
    ? goals.filter(g => g.parentId === null)
    : getByHorizon(activeTab).filter(g => g.parentId === null);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 pb-28 md:pb-6 overflow-x-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Цели</h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Декомпозиция больших целей на маленькие шаги</p>
        </div>

        {/* МОБИЛЬНЫЙ ВИД КНОПОК: 3 колонки равной ширины */}
        <div className="grid grid-cols-3 gap-2 w-full sm:hidden">
          <div data-tour="calendar-toggle" className="col-span-2 grid grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-10 items-center">
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                "flex items-center justify-center gap-1.5 px-1.5 h-full rounded-lg text-xs font-medium transition-all text-center whitespace-nowrap",
                viewMode === 'tree'
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <List className="h-4.5 w-4.5 shrink-0" />
              <span>Список</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex items-center justify-center gap-1.5 px-1.5 h-full rounded-lg text-xs font-medium transition-all text-center whitespace-nowrap",
                viewMode === 'calendar'
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <CalendarIcon className="h-4.5 w-4.5 shrink-0" />
              <span>Календарь</span>
            </button>
          </div>

          <Button 
            onClick={() => { 
              setSelectedParentId(null); 
              setEditingGoal(null); 
              setIsModalOpen(true); 
            }} 
            className="col-span-1 h-10 flex items-center justify-center gap-1.5 px-1.5 text-xs whitespace-nowrap font-semibold rounded-xl text-center"
          >
            <Plus className="h-4.5 w-4.5 shrink-0" />
            <span>Новая цель</span>
          </Button>
        </div>

        {/* ДЕСКТОПНЫЙ ВИД КНОПОК: как было изначально */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 shrink-0">
          <div data-tour="calendar-toggle" className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                viewMode === 'tree'
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <List className="h-4.5 w-4.5" />
              <span>Список</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                viewMode === 'calendar'
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <CalendarIcon className="h-4.5 w-4.5" />
              <span>Календарь</span>
            </button>
          </div>

          <Button 
            onClick={() => { 
              setSelectedParentId(null); 
              setEditingGoal(null); 
              setIsModalOpen(true); 
            }} 
            className="gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
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
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-6 sm:flex sm:w-auto">
            {HORIZON_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "w-full sm:w-auto px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-center whitespace-nowrap",
                  activeTab === tab.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                )}
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