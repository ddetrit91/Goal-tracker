import * as React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { toISODateString } from '@/utils/date';
import { Plus, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/utils/useSpeechRecognition';
import { cn } from '@/utils/cn';

export function QuickTaskInput() {
  const [title, setTitle] = React.useState('');
  const { createTask } = useTaskStore();

  const handleVoiceResult = React.useCallback((text: string) => {
    setTitle((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const { isListening, isSupported, toggleListening } = useSpeechRecognition(handleVoiceResult);

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
        placeholder={isListening ? "Слушаю... говорите..." : "Добавить новую задачу (Enter)..."}
        className={cn(
          "w-full rounded-xl border bg-white py-3 pl-4 pr-24 text-sm shadow-sm transition-all outline-none",
          "placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500",
          isListening 
            ? "border-red-500 ring-2 ring-red-500/20 animate-pulse bg-red-50/20 dark:bg-red-950/20"
            : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700"
        )}
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {/* Кнопка голосового ввода */}
        {isSupported && (
          <button
            type="button"
            onClick={toggleListening}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              isListening
                ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30"
                : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400"
            )}
            title={isListening ? "Остановить запись" : "Голосовой ввод"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}

        {/* Кнопка добавления задачи */}
        <button
          type="submit"
          disabled={!title.trim()}
          className="p-1.5 rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}