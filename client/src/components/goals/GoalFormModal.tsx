// client/src/components/goals/GoalFormModal.tsx
import * as React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useGoalStore } from '@/store/useGoalStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { GOAL_HORIZONS, GOAL_PRIORITIES, type GoalHorizon, type GoalPriority, type Goal } from '@/types/goal';
import type { CreateGoalInput, UpdateGoalInput } from '@/types/goal';
import { Info } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: string | null;
  defaultHorizon?: GoalHorizon;
  initialData?: Goal | null;
}

const HORIZON_LABELS: Record<GoalHorizon, string> = {
  life: 'Жизнь / Мечта', annual: 'Год', 'semi-annual': 'Полгода',
  quarterly: 'Квартал', monthly: 'Месяц', weekly: 'Неделя', daily: 'День',
};

const PRIORITY_LABELS: Record<GoalPriority, string> = {
  low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический',
};

export function GoalFormModal({ 
  isOpen, onClose, parentId = null, defaultHorizon, initialData 
}: GoalFormModalProps) {
  const { createGoal, updateGoal } = useGoalStore();
  const { allCategories } = useCategoryStore();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const isEditing = !!initialData;

  const [formData, setFormData] = React.useState<CreateGoalInput>({
    title: '', description: '', horizon: 'quarterly', category: 'self-development',
    status: 'backlog', priority: 'medium', startDate: null, targetDate: null,
    completedAt: null, progress: 0, isProgressCalculated: true,
    estimatedCost: null, currency: 'UZS', parentId,
  });

  React.useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setFormData({
          title: initialData.title, description: initialData.description,
          horizon: initialData.horizon, category: initialData.category,
          status: initialData.status, priority: initialData.priority,
          startDate: initialData.startDate, targetDate: initialData.targetDate,
          completedAt: initialData.completedAt, progress: initialData.progress,
          isProgressCalculated: initialData.isProgressCalculated,
          estimatedCost: initialData.estimatedCost,
          currency: initialData.currency || 'UZS', parentId: initialData.parentId,
        });
      } else {
        setFormData(prev => ({
          ...prev, parentId, horizon: defaultHorizon || prev.horizon,
          title: '', description: '', status: 'backlog', progress: 0,
        }));
      }
    }
  }, [isOpen, parentId, defaultHorizon, initialData, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setIsLoading(true);
    try {
      if (isEditing && initialData) {
        await updateGoal(initialData.id, formData as UpdateGoalInput);
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { message: 'Цель успешно обновлена!' } 
        }));
      } else {
        await createGoal(formData);
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { message: 'Цель успешно создана!' } 
        }));
      }
      onClose();
    } catch (err) { console.error('Failed to save goal', err); } 
    finally { setIsLoading(false); }
  };

  // Проверяем, выбрана ли категория Виш-лист или legacy custom
  const isWishlist = formData.category === 'wishlist' || formData.category === 'custom';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Редактировать цель' : (parentId ? 'Новая подцель' : 'Новая цель')}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {/* <-- ДОБАВЛЕНО: dark:text-slate-300 для лейбла --> */}
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Название цели</label>
            <div className="group relative"><Info className="h-4 w-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                Формулируйте конкретно. Не «Учить язык», а «Сдать IELTS на 7.0».
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </div>
          {/* <-- ДОБАВЛЕНО: dark:bg-slate-900, dark:border-slate-700, dark:text-white, dark:placeholder-slate-500 --> */}
          <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" placeholder="Чего я хочу достичь?" />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {/* <-- ДОБАВЛЕНО: dark:text-slate-300 для лейбла --> */}
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Зачем мне это? (Мотивация)</label>
            <div className="group relative"><Info className="h-4 w-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                Это ваш «якорь». Когда будет лень, перечитайте это.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </div>
          {/* <-- ДОБАВЛЕНО: dark:bg-slate-900, dark:border-slate-700, dark:text-white, dark:placeholder-slate-500 --> */}
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" rows={3} placeholder="Почему эта цель важна для меня?" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            {/* <-- ДОБАВЛЕНО: dark:text-slate-300 для лейбла --> */}
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Горизонт</label>
            {/* <-- ДОБАВЛЕНО: dark:bg-slate-900, dark:border-slate-700, dark:text-white --> */}
            <select value={formData.horizon} onChange={(e) => setFormData({ ...formData, horizon: e.target.value as GoalHorizon })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white">
              {GOAL_HORIZONS.map((h) => (<option key={h} value={h}>{HORIZON_LABELS[h]}</option>))}
            </select>
          </div>
          <div>
            {/* <-- ДОБАВЛЕНО: dark:text-slate-300 для лейбла --> */}
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Категория</label>
            {/* <-- ДОБАВЛЕНО: dark:bg-slate-900, dark:border-slate-700, dark:text-white --> */}
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white">
              {allCategories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>
        </div>

        {/* БЛОК БЮДЖЕТА - ПОКАЗЫВАЕТСЯ ТОЛЬКО ДЛЯ ВИШ-ЛИСТА */}
        {isWishlist && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div>
              {/* <-- ДОБАВЛЕНО: dark:text-slate-300 для лейбла --> */}
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Бюджет (стоимость)</label>
              {/* <-- ДОБАВЛЕНО: dark:bg-slate-900, dark:border-slate-700, dark:text-white --> */}
              <input
                type="number"
                min="0"
                step="100"
                value={formData.estimatedCost ?? ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimatedCost: e.target.value ? Number(e.target.value) : null 
                })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              {/* <-- ДОБАВЛЕНО: dark:text-slate-300 для лейбла --> */}
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Валюта</label>
              {/* <-- ДОБАВЛЕНО: dark:bg-slate-900, dark:border-slate-700, dark:text-white --> */}
              <select
                value={formData.currency || 'UZS'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              >
                <option value="UZS">UZS (сум)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        )}

        <div>
          {/* <-- ДОБАВЛЕНО: dark:text-slate-300 для лейбла --> */}
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Приоритет</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GOAL_PRIORITIES.map((p) => {
              const isSelected = formData.priority === p;
              let activeClass = '';
              if (p === 'critical') activeClass = 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500 shadow-sm dark:bg-red-900/20 dark:border-red-500 dark:text-red-300';
              else if (p === 'high') activeClass = 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500 shadow-sm dark:bg-orange-900/20 dark:border-orange-500 dark:text-orange-300';
              else if (p === 'medium') activeClass = 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 shadow-sm dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300';
              else activeClass = 'bg-slate-50 border-slate-400 text-slate-700 ring-1 ring-slate-400 shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300';
              
              const inactiveClass = 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:border-slate-600';
              
              return (
                <button key={p} type="button" onClick={() => setFormData({ ...formData, priority: p })}
                  className={cn("px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200", isSelected ? activeClass : inactiveClass)}>
                  {PRIORITY_LABELS[p]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6 dark:border-slate-700">
          <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
          <Button type="submit" isLoading={isLoading}>{isEditing ? 'Сохранить изменения' : 'Создать цель'}</Button>
        </div>
      </form>
    </Modal>
  );
}