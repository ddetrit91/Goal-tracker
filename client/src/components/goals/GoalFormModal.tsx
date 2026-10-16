// client/src/components/goals/GoalFormModal.tsx
import * as React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useGoalStore } from '@/store/useGoalStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { GOAL_HORIZONS, GOAL_PRIORITIES, type GoalHorizon, type GoalPriority, type Goal } from '@/types/goal';
import type { CreateGoalInput, UpdateGoalInput } from '@/types/goal';
import { Info, Calendar, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/utils/useSpeechRecognition';
import { cn } from '@/utils/cn';
import { toISODateString } from '@/utils/date';
import { addDays, addMonths, addYears, parseISO } from 'date-fns';

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
          startDate: toISODateString(new Date()),
          targetDate: null,
        }));
      }
    }
  }, [isOpen, parentId, defaultHorizon, initialData, isEditing]);

  const setDeadlinePreset = (daysOrMonths: { days?: number; months?: number; years?: number; horizon?: GoalHorizon }) => {
    const base = formData.startDate ? parseISO(formData.startDate) : new Date();
    let target = base;
    if (daysOrMonths.days) target = addDays(target, daysOrMonths.days);
    if (daysOrMonths.months) target = addMonths(target, daysOrMonths.months);
    if (daysOrMonths.years) target = addYears(target, daysOrMonths.years);
    
    setFormData(prev => ({
      ...prev,
      horizon: daysOrMonths.horizon || prev.horizon,
      startDate: prev.startDate || toISODateString(new Date()),
      targetDate: toISODateString(target)
    }));
  };

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

  const handleVoiceTitle = React.useCallback((text: string) => {
    setFormData((prev) => ({
      ...prev,
      title: prev.title ? `${prev.title} ${text}` : text,
    }));
  }, []);

  const handleVoiceDescription = React.useCallback((text: string) => {
    setFormData((prev) => ({
      ...prev,
      description: prev.description ? `${prev.description} ${text}` : text,
    }));
  }, []);

  const speechTitle = useSpeechRecognition(handleVoiceTitle);
  const speechDesc = useSpeechRecognition(handleVoiceDescription);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Редактировать цель' : (parentId ? 'Новая подцель' : 'Новая цель')}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Название цели</label>
              <div className="group relative inline-flex items-center">
                <button 
                  type="button" 
                  tabIndex={0} 
                  aria-label="Подсказка к названию цели"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                >
                  <Info className="h-4 w-4 cursor-pointer" />
                </button>
                <div className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-1.5 w-60 sm:w-64 p-2.5 bg-slate-900/95 backdrop-blur-sm text-slate-100 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all pointer-events-none z-50 leading-relaxed border border-slate-700/60">
                  Формулируйте конкретно. Не «Учить язык», а «Сдать IELTS на 7.0».
                  <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>
            </div>

            {speechTitle.isSupported && (
              <button
                type="button"
                onClick={speechTitle.toggleListening}
                className={cn(
                  "p-1 rounded-md text-xs flex items-center gap-1 transition-colors",
                  speechTitle.isListening 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
                title={speechTitle.isListening ? "Остановить запись" : "Голосовой ввод названия"}
              >
                {speechTitle.isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                <span className="text-[11px] hidden sm:inline">{speechTitle.isListening ? "Слушаю..." : "Голос"}</span>
              </button>
            )}
          </div>
          <input 
            type="text" 
            required 
            value={formData.title} 
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={cn(
              "w-full rounded-lg border px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:text-white",
              speechTitle.isListening ? "border-red-500 bg-red-50/20" : "border-slate-300 dark:border-slate-700"
            )}
            placeholder={speechTitle.isListening ? "Говорите название цели..." : "Чего я хочу достичь?"} 
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Зачем мне это? (Мотивация)</label>
              <div className="group relative inline-flex items-center">
                <button 
                  type="button" 
                  tabIndex={0} 
                  aria-label="Подсказка к мотивации"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                >
                  <Info className="h-4 w-4 cursor-pointer" />
                </button>
                <div className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-1.5 w-60 sm:w-64 p-2.5 bg-slate-900/95 backdrop-blur-sm text-slate-100 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all pointer-events-none z-50 leading-relaxed border border-slate-700/60">
                  Это ваш «якорь». Когда будет лень, перечитайте это.
                  <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>
            </div>

            {speechDesc.isSupported && (
              <button
                type="button"
                onClick={speechDesc.toggleListening}
                className={cn(
                  "p-1 rounded-md text-xs flex items-center gap-1 transition-colors",
                  speechDesc.isListening 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
                title={speechDesc.isListening ? "Остановить запись" : "Голосовой ввод мотивации"}
              >
                {speechDesc.isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                <span className="text-[11px] hidden sm:inline">{speechDesc.isListening ? "Слушаю..." : "Голос"}</span>
              </button>
            )}
          </div>
          <textarea 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={cn(
              "w-full rounded-lg border px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none dark:bg-slate-900 dark:text-white",
              speechDesc.isListening ? "border-red-500 bg-red-50/20" : "border-slate-300 dark:border-slate-700"
            )}
            rows={3} 
            placeholder={speechDesc.isListening ? "Говорите описание цели..." : "Почему эта цель важна для меня?"} 
          />
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

        {/* БЛОК СРОКОВ (ДАТА НАЧАЛА И ОКОНЧАНИЯ) */}
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 dark:bg-slate-800/60 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <label className="text-sm font-semibold text-slate-900 dark:text-white">
                Срок выполнения
              </label>
            </div>
            {formData.targetDate && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, targetDate: null })}
                className="text-xs text-red-500 hover:underline"
              >
                Снять срок
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Дата начала
              </label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value || null })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Срок выполнения (завершение)
              </label>
              <input
                type="date"
                value={formData.targetDate || ''}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value || null })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* Быстрые пресеты для срока выполнения */}
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Быстрый срок:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '+1 нед', days: 7, horizon: 'weekly' as GoalHorizon },
                { label: '+1 мес', months: 1, horizon: 'monthly' as GoalHorizon },
                { label: '+1 кварт (3 мес)', months: 3, horizon: 'quarterly' as GoalHorizon },
                { label: '+полгода (6 мес)', months: 6, horizon: 'semi-annual' as GoalHorizon },
                { label: '+1 год', years: 1, horizon: 'annual' as GoalHorizon },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setDeadlinePreset(preset)}
                  className="px-2.5 py-1 text-xs rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

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

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100 mt-6 dark:border-slate-700">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">Отмена</Button>
          <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">{isEditing ? 'Сохранить изменения' : 'Создать цель'}</Button>
        </div>
      </form>
    </Modal>
  );
}