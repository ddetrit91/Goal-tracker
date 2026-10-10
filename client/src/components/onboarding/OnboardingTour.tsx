import * as React from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ArrowLeft, X, CheckCircle2 } from 'lucide-react'; // <-- Убран HelpCircle
import { cn } from '@/utils/cn';

interface Step {
  id: string;
  targetSelector: string;
  title: string;
  location: string;
  howItWorks: string;
  benefit: string;
}

const TOUR_STEPS: Step[] = [
  {
    id: 'welcome',
    targetSelector: '[data-tour="logo"]',
    title: 'Добро пожаловать в Goal Tracker!',
    location: 'Шапка приложения',
    howItWorks: 'Это твой личный центр управления целями. Здесь ты видишь баланс всех сфер жизни.',
    benefit: 'Ты всегда знаешь, насколько близко к мечтам, без хаоса и бумажных блокнотов.',
  },
  {
    id: 'today',
    targetSelector: '[data-tour="today"]',
    title: 'Фокус на сегодня',
    location: 'Нижнее меню (моб.) / Боковая панель (деск.)',
    howItWorks: 'Здесь задачи на текущий день. Используй "Фокус дня" для главного приоритета. Сортировка автоматическая.',
    benefit: 'Никакого паралича выбора. Ты сразу видишь, что делать прямо сейчас.',
  },
  {
    id: 'goals',
    targetSelector: '[data-tour="goals"]',
    title: 'Цели и декомпозиция',
    location: 'Вкладка "Цели"',
    howItWorks: 'Разбивай большие мечты на подцели и задачи. Прогресс считается автоматически по выполненным шагам.',
    benefit: 'Большие цели перестают пугать. Каждый маленький шаг приближает к результату.',
  },
  {
    id: 'deadlines',
    targetSelector: '[data-tour="deadlines"]',
    title: 'Ближайшие дедлайны',
    location: 'Над списком целей',
    howItWorks: 'Показывает топ-3 самых срочных целей. Красный = просрочено, оранжевый < 7 дней.',
    benefit: 'Ты никогда не пропустишь важный срок. Мотивация через визуальную срочность.',
  },
  {
    id: 'analytics',
    targetSelector: '[data-tour="analytics"]',
    title: 'Аналитика баланса',
    location: 'Вкладка "Обзор"',
    howItWorks: 'Круговая диаграмма заполненности сфер жизни + журнал побед за неделю.',
    benefit: 'Видишь дисбаланс сразу. Здоровье проседает? Карьера растет? Данные, а не ощущения.',
  },
  {
    id: 'settings',
    targetSelector: '[data-tour="settings"]',
    title: 'Настройки и экспорт',
    location: 'Вкладка "Настройки"',
    howItWorks: 'Экспорт/импорт JSON-бэкапа, сброс данных, управление категориями.',
    benefit: 'Твои данные принадлежат тебе. Никакой привязки к облаку, полный контроль.',
  },
];

export function OnboardingTour() {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const [tooltipRect, setTooltipRect] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  React.useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenTour) {
      setTimeout(() => setIsVisible(true), 800);
    }
  }, []);

  React.useEffect(() => {
    if (!isVisible) return;
    const updatePosition = () => {
      const step = TOUR_STEPS[currentStepIndex];
      // ИСПРАВЛЕНИЕ: Безопасная проверка на undefined
      if (!step) return; 
      
      const targetEl = document.querySelector(step.targetSelector);
      
      if (!targetEl || step.targetSelector === '[data-tour="logo"]') {
        setTooltipRect({ 
          top: window.innerHeight / 2 - 150, 
          left: window.innerWidth / 2 - 200 
        });
        return;
      }

      const rect = targetEl.getBoundingClientRect();
      const tooltipWidth = 400;
      const gap = 16;

      let top = rect.bottom + gap;
      let left = rect.left;

      if (rect.right + gap + tooltipWidth < window.innerWidth) {
        top = rect.top;
        left = rect.right + gap;
      } else if (rect.left - gap - tooltipWidth > 0) {
        top = rect.top;
        left = rect.left - gap - tooltipWidth;
      } else {
        top = rect.bottom + gap;
        left = Math.max(16, Math.min(rect.left, window.innerWidth - tooltipWidth - 16));
        
        if (top + 300 > window.innerHeight) {
          top = window.innerHeight - 320;
        }
      }

      setTooltipRect({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, currentStepIndex]);

  React.useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, currentStepIndex]);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setIsVisible(false);
      localStorage.setItem('hasSeenOnboarding', 'true');
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentStepIndex(prev => prev - 1);
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  if (!isVisible || !currentStep) return null;

  const getTargetCoords = () => {
    const targetEl = document.querySelector(currentStep.targetSelector);
    if (!targetEl) return null;
    const rect = targetEl.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    };
  };

  const targetCoords = getTargetCoords();

  return createPortal(
    <>
      {/* Spotlight overlay */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetCoords && (
                <rect
                  x={targetCoords.x - targetCoords.width / 2 - 8}
                  y={targetCoords.y - targetCoords.height / 2 - 8}
                  width={targetCoords.width + 16}
                  height={targetCoords.height + 16}
                  rx={12}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect 
            width="100%" 
            height="100%" 
            fill="rgba(15, 23, 42, 0.7)" 
            mask="url(#spotlight-mask)" 
          />
        </svg>
      </div>

      {/* Пульсирующая стрелка-указатель */}
      {targetCoords && (
        <div 
          className="fixed z-[9999] pointer-events-none animate-pulse"
          style={{ 
            left: targetCoords.x - 12, 
            top: targetCoords.y - 12 
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#6366f1" opacity="0.3" />
            <circle cx="12" cy="12" r="6" fill="#6366f1" />
          </svg>
        </div>
      )}

      {/* Тултип */}
      <div 
        className={cn(
          "fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden",
          "w-[400px] max-w-[calc(100vw-32px)] animate-in fade-in slide-in-from-bottom-4 duration-300"
        )}
        style={{ top: tooltipRect.top, left: tooltipRect.left }}
      >
        {/* Шапка тултипа */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{currentStep.title}</h3>
            <button onClick={handleSkip} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Индикатор прогресса */}
          <div className="flex gap-1 mt-3">
            {TOUR_STEPS.map((_, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  idx === currentStepIndex ? "w-8 bg-white" : "w-2 bg-white/40"
                )}
              />
            ))}
          </div>
        </div>

        {/* Контент: 3 блока */}
        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <span className="text-lg shrink-0">📍</span>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Где находится</p>
              <p className="text-sm text-slate-700">{currentStep.location}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex gap-3">
            <span className="text-lg shrink-0">⚙️</span>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Как работает</p>
              <p className="text-sm text-slate-700">{currentStep.howItWorks}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex gap-3">
            <span className="text-lg shrink-0">💎</span>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Зачем нужно & польза</p>
              <p className="text-sm text-slate-700">{currentStep.benefit}</p>
            </div>
          </div>
        </div>

        {/* Навигация */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button 
            onClick={handlePrev}
            disabled={isFirst}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors",
              isFirst 
                ? "text-slate-300 cursor-not-allowed" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            )}
          >
            <ArrowLeft className="h-4 w-4" /> Назад
          </button>

          <div className="flex gap-2">
            <button 
              onClick={handleSkip}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Пропустить
            </button>
            <button 
              onClick={handleNext}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Завершить
                </>
              ) : (
                <>
                  Далее <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}