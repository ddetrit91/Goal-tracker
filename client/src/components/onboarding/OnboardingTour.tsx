import * as React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Step {
  id: string;
  targetSelector: string;
  title: string;
  location: string;
  howItWorks: string;
  benefit: string;
  route?: string;
}

const TOUR_STEPS: Step[] = [
  {
    id: 'welcome',
    targetSelector: '[data-tour="logo"]',
    title: 'Добро пожаловать в Goal Tracker!',
    location: 'Центр управления целями',
    howItWorks: 'Персональная система для декомпозиции целей, баланса ключевых сфер жизни и ежедневного движения вперёд.',
    benefit: 'Ясная картина приоритетов, фокус на главном и уверенность в каждом следующем шаге.',
  },
  {
    id: 'today',
    targetSelector: '[data-tour="today-focus"]',
    route: '/today',
    title: 'Фокус дня и задачи на сегодня',
    location: 'Вкладка «Сегодня»',
    howItWorks: 'Здесь находятся главные фокусы дня и задачи. Нажмите звёздочку ⭐ у любой цели на странице «Цели» — и она вместе с подзадачами появится здесь. А при завершении цели отпразднуйте успех салютом конфетти 🎉!',
    benefit: 'Никакого паралича выбора: вы открываете день с ясными 1–3 ключевыми действиями.',
  },
  {
    id: 'goals',
    targetSelector: '[data-tour="goals"]',
    route: '/goals',
    title: 'Цели и декомпозиция',
    location: 'Вкладка «Цели»',
    howItWorks: 'Разбивайте масштабные цели по горизонтам (Год, Квартал, Месяц, Неделя). Добавляйте подцели и задачи: общий прогресс цели автоматически рассчитывается от выполненных подзадач.',
    benefit: 'Большая мечта перестаёт пугать, превращаясь в логичную и выполнимую лестницу шагов.',
  },
  {
    id: 'deadlines',
    targetSelector: '[data-tour="deadlines"]',
    route: '/goals',
    title: 'Ближайшие сроки выполнения',
    location: 'Страница «Цели» (над списком)',
    howItWorks: 'Информативные карточки с обратным отсчётом дней («Срок сегодня!», «Завтра», «Осталось X дн.» или «Просрочено»). Блок автоматически фильтруется по выбранному горизонту и скрывает выполненные цели.',
    benefit: 'Вы всегда контролируете приближающиеся сроки и держите фокус на самых срочных рубежах.',
  },
  {
    id: 'calendar',
    targetSelector: '[data-tour="calendar-toggle"]',
    route: '/goals',
    title: 'Календарь целей и задач',
    location: 'Страница «Цели» (кнопка «Календарь»)',
    howItWorks: 'Переключитесь в режим календаря, чтобы видеть интерактивную сетку месяца со сроками целей, выполненными достижениями и задачами на каждый день с удобной фильтрацией.',
    benefit: 'Наглядная хронология планов, баланс нагрузки по дням и история побед в одном месте.',
  },
  {
    id: 'vision',
    targetSelector: '[data-tour="vision-board"]',
    route: '/vision-board',
    title: 'Доска визуализации (Мечты)',
    location: 'Вкладка «Мечты»',
    howItWorks: 'Создавайте карточки заветных желаний с яркими фотографиями, стоимостью и шкалой накоплений. Любую мечту можно в один клик превратить в практическую цель!',
    benefit: 'Постоянное визуальное вдохновение и чёткий путь от абстрактной мечты к реальному плану.',
  },
  {
    id: 'analytics',
    targetSelector: '[data-tour="analytics"]',
    route: '/analytics',
    title: 'Колесо сфер жизни и аналитика',
    location: 'Вкладка «Обзор»',
    howItWorks: 'Круговая диаграмма баланса сфер (Здоровье, Карьера, Финансы, Семья и др.), процент закрытия целей и журнал побед.',
    benefit: 'Помогает избегать перекосов, замечать зоны роста и гармонично развиваться во всех сферах.',
  },
  {
    id: 'settings',
    targetSelector: '[data-tour="settings"]',
    route: '/settings',
    title: 'Настройки, экспорт и локальность',
    location: 'Вкладка «Настройки»',
    howItWorks: 'Экспорт и импорт базы в JSON, синхронизация с локальной SQLite базой, управление категориями и переключение тёмной темы.',
    benefit: 'Ваши данные на 100% принадлежат вам. Полная конфиденциальность и безопасность.',
  },
];

export function OnboardingTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const [tooltipRect, setTooltipRect] = React.useState<{ top: number; left: number; maxHeight: number }>({ 
    top: 60, 
    left: 16, 
    maxHeight: 480 
  });

  React.useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenTour) {
      setTimeout(() => setIsVisible(true), 800);
    }
  }, []);

  // Автоматический переход на нужную страницу тура при смене шага
  React.useEffect(() => {
    if (!isVisible) return;
    const step = TOUR_STEPS[currentStepIndex];
    if (step?.route && location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [isVisible, currentStepIndex, location.pathname, navigate]);

  React.useEffect(() => {
    if (!isVisible) return;
    const updatePosition = () => {
      const step = TOUR_STEPS[currentStepIndex];
      if (!step) return; 

      const isMobile = window.innerWidth < 640;
      const targetEl = document.querySelector(step.targetSelector);
      const tooltipWidth = isMobile ? window.innerWidth - 32 : Math.min(420, window.innerWidth - 32);

      // Прокручиваем к элементу, если он не виден на экране и не зафиксирован в навбаре/хедере
      if (targetEl && step.targetSelector !== '[data-tour="logo"]') {
        const isFixed = targetEl.closest('nav') !== null || targetEl.closest('header') !== null;
        if (!isFixed) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // МОБИЛЬНЫЙ РЕЖИМ (Ширина экрана < 640px)
      if (isMobile) {
        const left = 16;
        const topReserved = 56;
        const bottomReserved = 84;

        if (!targetEl || step.targetSelector === '[data-tour="logo"]') {
          const top = topReserved;
          const maxHeight = Math.max(220, window.innerHeight - top - bottomReserved);
          setTooltipRect({ top, left, maxHeight });
          return;
        }

        const rect = targetEl.getBoundingClientRect();
        const isTargetInBottomHalf = rect.top > (window.innerHeight / 2);

        if (isTargetInBottomHalf) {
          // Элемент внизу: тултип располагается сверху
          const top = topReserved;
          const maxHeight = Math.max(220, window.innerHeight - top - bottomReserved);
          setTooltipRect({ top, left, maxHeight });
        } else {
          // Элемент вверху: тултип располагается под ним (или выше нижнего навбара)
          const maxAvailableTop = window.innerHeight - bottomReserved - 280;
          const top = Math.max(topReserved, Math.min(rect.bottom + 12, maxAvailableTop));
          const maxHeight = Math.max(220, window.innerHeight - top - bottomReserved);
          setTooltipRect({ top, left, maxHeight });
        }
        return;
      }

      // ДЕСКТОПНЫЙ РЕЖИМ
      const edgeMargin = 20;
      const desiredHeight = 460;

      if (!targetEl || step.targetSelector === '[data-tour="logo"]') {
        const left = Math.max(edgeMargin, (window.innerWidth - tooltipWidth) / 2);
        const top = Math.max(edgeMargin, Math.min(window.innerHeight / 2 - 200, window.innerHeight - desiredHeight - edgeMargin));
        const maxHeight = Math.max(240, window.innerHeight - top - edgeMargin);
        setTooltipRect({ top, left, maxHeight });
        return;
      }

      const rect = targetEl.getBoundingClientRect();
      const gap = 16;

      const fitsRight = rect.right + gap + tooltipWidth < window.innerWidth - edgeMargin;
      const fitsLeft = rect.left - gap - tooltipWidth > edgeMargin;

      let left: number;
      let top: number;

      if (fitsRight) {
        left = rect.right + gap;
        top = Math.max(edgeMargin, Math.min(rect.top - 10, window.innerHeight - desiredHeight - edgeMargin));
      } else if (fitsLeft) {
        left = rect.left - gap - tooltipWidth;
        top = Math.max(edgeMargin, Math.min(rect.top - 10, window.innerHeight - desiredHeight - edgeMargin));
      } else {
        // Если справа и слева не помещается — центрируем по горизонтали
        left = Math.max(edgeMargin, Math.min(rect.left, window.innerWidth - tooltipWidth - edgeMargin));
        if (rect.bottom + gap + desiredHeight <= window.innerHeight - edgeMargin) {
          top = rect.bottom + gap;
        } else if (rect.top - gap - desiredHeight >= edgeMargin) {
          top = rect.top - gap - desiredHeight;
        } else {
          top = Math.max(edgeMargin, window.innerHeight - desiredHeight - edgeMargin);
        }
      }

      const maxHeight = Math.max(240, window.innerHeight - top - edgeMargin);
      setTooltipRect({ top, left, maxHeight });
    };

    updatePosition();
    const timer1 = setTimeout(updatePosition, 100);
    const timer2 = setTimeout(updatePosition, 300);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, currentStepIndex, location.pathname]);

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = React.useCallback(() => {
    if (isLast) {
      setIsVisible(false);
      localStorage.setItem('hasSeenOnboarding', 'true');
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [isLast]);

  const handlePrev = React.useCallback(() => {
    if (!isFirst) setCurrentStepIndex(prev => prev - 1);
  }, [isFirst]);

  const handleSkip = React.useCallback(() => {
    setIsVisible(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  }, []);

  React.useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleSkip, handleNext, handlePrev]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  if (!isVisible || !currentStep) return null;

  const getTargetCoords = () => {
    if (!currentStep || currentStep.targetSelector === '[data-tour="logo"]') return null;
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
          {/* <-- АДАПТАЦИЯ: Более глубокое затемнение в темной теме через opacity transition --> */}
          <rect 
            width="100%" 
            height="100%" 
            fill="#0f172a" 
            opacity="0.7"
            className="transition-opacity duration-300 dark:opacity-80"
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
          "fixed z-[9999] rounded-2xl shadow-2xl border overflow-hidden",
          "w-[400px] max-w-[calc(100vw-32px)] flex flex-col",
          "animate-in fade-in slide-in-from-bottom-4 duration-300",
          // Светлая тема
          "bg-white border-slate-200",
          // Темная тема <-- ДОБАВЛЕНО
          "dark:bg-slate-800 dark:border-slate-700"
        )}
        style={{ 
          top: tooltipRect.top, 
          left: tooltipRect.left,
          maxHeight: tooltipRect.maxHeight,
        }}
      >
        {/* Шапка тултипа (градиент остается одинаковым для обеих тем) */}
        <div className="shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 sm:py-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{currentStep.title}</h3>
            <button onClick={handleSkip} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Индикатор прогресса */}
          <div className="flex gap-1 mt-2.5 sm:mt-3">
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

        {/* Контент: 3 блока с заметным скроллбаром справа */}
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1 overscroll-contain tour-scrollbar pr-3 sm:pr-4 mr-0.5">
          <div className="flex gap-3">
            <span className="text-lg shrink-0">📍</span>
            <div>
              {/* <-- ДОБАВЛЕНО: dark:text-indigo-400 для меток секций --> */}
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5 dark:text-indigo-400">Где находится</p>
              {/* <-- ДОБАВЛЕНО: dark:text-slate-200 для основного текста --> */}
              <p className="text-sm text-slate-700 dark:text-slate-200">{currentStep.location}</p>
            </div>
          </div>

          {/* <-- ДОБАВЛЕНО: dark:border-slate-700 для разделителей --> */}
          <div className="border-t border-slate-100 pt-3 flex gap-3 dark:border-slate-700">
            <span className="text-lg shrink-0">⚙️</span>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5 dark:text-indigo-400">Как работает</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{currentStep.howItWorks}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex gap-3 dark:border-slate-700">
            <span className="text-lg shrink-0">💎</span>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5 dark:text-indigo-400">Зачем нужно & польза</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{currentStep.benefit}</p>
            </div>
          </div>
        </div>

        {/* Навигация */}
        {/* <-- ДОБАВЛЕНО: dark:bg-slate-900/50 и dark:border-slate-700 для футера --> */}
        <div className="shrink-0 px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between dark:bg-slate-900/50 dark:border-slate-700">
          <button 
            onClick={handlePrev}
            disabled={isFirst}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors",
              isFirst 
                ? "text-slate-300 cursor-not-allowed dark:text-slate-600" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700"
            )}
          >
            <ArrowLeft className="h-4 w-4" /> Назад
          </button>

          <div className="flex gap-2">
            <button 
              onClick={handleSkip}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700"
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