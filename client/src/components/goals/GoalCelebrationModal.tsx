// client/src/components/goals/GoalCelebrationModal.tsx
import * as React from 'react';
import { useGoalStore } from '@/store/useGoalStore';
import { Trophy, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

const PRAISE_MESSAGES = [
  'Отличная работа! Каждый завершённый шаг делает тебя сильнее.',
  'Потрясающий результат! Дисциплина и упорство побеждают любые сомнения.',
  'Великолепно! Ты стал ещё на шаг ближе к своей глобальной мечте.',
  'Гордись собой! Ещё одна важная вершина успешно покорена.',
  'Так держать! Твой фокус и регулярные действия принесли заслуженную победу.',
];

export function GoalCelebrationModal() {
  const { celebratingGoal, setCelebratingGoal } = useGoalStore();
  const [praise, setPraise] = React.useState('');

  React.useEffect(() => {
    if (celebratingGoal) {
      // Выбираем мотивирующую цитату
      const randomMsg = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)] ?? 'Отличная работа! Каждый шаг делает тебя сильнее.';
      setPraise(randomMsg);

      // Запуск салюта конфетти
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#3b82f6'],
        });

        // Дополнительный залп
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#6366f1', '#10b981', '#f59e0b'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#a855f7', '#10b981', '#f59e0b'],
          });
        }, 250);
      } catch (err) {
        console.error('Confetti error:', err);
      }
    }
  }, [celebratingGoal]);

  if (!celebratingGoal) return null;

  const handleClose = () => {
    setCelebratingGoal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-250"
      >
        {/* Декоративное сияние */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-amber-400/25 via-indigo-500/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Иконка кубка с анимацией */}
        <div className="relative mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/30 transform hover:rotate-6 transition-transform">
          <Trophy className="h-10 w-10 text-slate-950 fill-slate-950/20" />
          <Sparkles className="h-5 w-5 text-yellow-200 absolute -top-2 -right-2 animate-bounce" />
        </div>

        {/* Заголовок */}
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 mb-2">
          Цель достигнута! 🏆
        </span>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 px-2 mt-1">
          {celebratingGoal.title}
        </h3>

        {/* Похвала и мотивация */}
        <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {praise}
        </div>

        {/* Кнопка закрытия */}
        <button
          onClick={handleClose}
          className="mt-5 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Вперёд к новым победам</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
