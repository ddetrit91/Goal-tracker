// client/src/components/goals/TaskEditModal.tsx
import * as React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTaskStore } from '@/store/useTaskStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import type { Task, TaskPriority } from '@/types/task';
import { Calendar, Tag, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/utils/useSpeechRecognition';
import { cn } from '@/utils/cn';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export function TaskEditModal({ isOpen, onClose, task }: TaskEditModalProps) {
  const { updateTask } = useTaskStore();
  const { allCategories } = useCategoryStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const [title, setTitle] = React.useState('');
  const [dueDate, setDueDate] = React.useState<string | null>(null);
  const [priority, setPriority] = React.useState<TaskPriority>('medium');
  const [category, setCategory] = React.useState<string>('self-development');

  const handleVoiceResult = React.useCallback((text: string) => {
    setTitle((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const { isListening, isSupported, toggleListening } = useSpeechRecognition(handleVoiceResult);

  React.useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setDueDate(task.dueDate || null);
      setPriority(task.priority || 'medium');
      setCategory(task.category || 'self-development');
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title.trim()) return;

    setIsLoading(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        dueDate,
        priority,
        category,
      });
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { message: 'Задача успешно обновлена!' },
        })
      );
      onClose();
    } catch (err: any) {
      console.error('Failed to update task:', err);
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { message: err.message || 'Ошибка обновления задачи' },
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редактировать задачу">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Название задачи
            </label>
            {isSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={cn(
                  "p-1 rounded-md text-xs flex items-center gap-1 transition-colors",
                  isListening 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
                title={isListening ? "Остановить запись" : "Голосовой ввод"}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                <span className="text-[11px] hidden sm:inline">{isListening ? "Слушаю..." : "Голос"}</span>
              </button>
            )}
          </div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:text-white",
              isListening ? "border-red-500 bg-red-50/20" : "border-slate-300 dark:border-slate-700"
            )}
            placeholder={isListening ? "Слушаю... говорите..." : "Что нужно сделать?"}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span>Срок выполнения</span>
            </label>
            <input
              type="date"
              value={dueDate || ''}
              onChange={(e) => setDueDate(e.target.value || null)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Приоритет
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            >
              <option value="low">{PRIORITY_LABELS.low}</option>
              <option value="medium">{PRIORITY_LABELS.medium}</option>
              <option value="high">{PRIORITY_LABELS.high}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-indigo-500" />
            <span>Категория</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          >
            {allCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button type="submit" disabled={isLoading || !title.trim()}>
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
