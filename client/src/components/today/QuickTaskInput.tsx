import * as React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { toISODateString } from '@/utils/date';
import { Plus } from 'lucide-react';

export function QuickTaskInput() {
  const [title, setTitle] = React.useState('');
  const { createTask } = useTaskStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createTask({
      title: title.trim(),
      description: '',
      horizon: 'daily',
      category: 'custom', // Категория по умолчанию, можно изменить в настройках
      dueDate: toISODateString(new Date()),
      isCompleted: false,
      completedAt: null,
      priority: 'medium',
      estimatedMinutes: null,
      isRecurring: false,
      recurrenceRule: null,
      isDailyFocus: false,
      tags: [],
      goalId: null,
    });

    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-6">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Добавить новую задачу (Enter)..."
        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-12 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-slate-400"
      />
      <button
        type="submit"
        disabled={!title.trim()}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none"
      >
        <Plus className="h-4 w-4" />
      </button>
    </form>
  );
}