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

function getUserName(): string {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return 'друг';
    const user = JSON.parse(userStr);
    if (user?.name && user.name.trim()) return user.name.trim();
    if (user?.email) return user.email.split('@')[0];
    return 'друг';
  } catch {
    return 'друг';
  }
}

function getTourSteps(userName: string): Step[] {
  return [
    {
      id: 'welcome',
      targetSelector: '[data-tour="logo"]',
      title: `Рады приветствовать тебя, ${userName}! 🎯`,
      location: 'Твой персональный центр достижений',
      howItWorks: 'Каждая великая победа начинается с одного ясного решения и ежедневных действий. Твои мечты заслуживают стать реальностью, а не оставаться в мыслях. Мы создали Goal Tracker, чтобы помочь тебе поставить дерзкие цели, разбить их на понятные шаги и действовать каждый день с максимальной отдачей.',
      benefit: 'Фокусируйся на главном, побеждай прокрастинацию и достигай масштабных результатов шаг за шагом. Пройди короткий тур, чтобы узнать все суперспособности приложения!',
    },
    {
      id: 'today',
      targetSelector: '[data-tour="today-focus"]',
      route: '/today',
      title: 'Фокус дня и всплывающий опыт XP',
      location: 'Вкладка «Сегодня»',
      howItWorks: 'Здесь находятся главные фокусы дня и задачи. Выполняйте задачи и получайте мгновенный опыт (+10 XP ✨). А при достижении цели на 100% празднуйте триумф салютом конфетти и наградой +50 XP 🏆! Чтобы цель появилась здесь, просто нажмите звёздочку ⭐ на странице «Цели».',
      benefit: 'Никакого паралича выбора: вы открываете день с ясными ключевыми действиями и моментальной наградой за каждый шаг.',
    },
    {
      id: 'events',
      targetSelector: '[data-tour="today-events-toggle"]',
      route: '/today',
      title: 'События, встречи и напоминания 📅',
      location: 'Вкладка «Сегодня» (переключатель «События и встречи»)',
      howItWorks: 'Планируйте важные события и визиты наперёд (стрижка, съёмка, визиты к врачу). Назначайте дату, точное время, категорию и напоминания (за 1, 2 или 3 дня). Поддерживается быстрый голосовой ввод 🎙. Если событие наступило сегодня, прямо над задачами дня появится аккуратная полоска с кнопкой «Я на месте!», приносящей +20 XP ✨.',
      benefit: 'Никаких забытых встреч: заблаговременные системные push-уведомления и удобное разделение ежедневных задач и будущих событий.',
    },
    {
      id: 'level-badge',
      targetSelector: '[data-tour="level-badge"]',
      route: '/today',
      title: 'Игровой уровень и ранг игрока',
      location: 'Хедер страницы «Сегодня»',
      howItWorks: 'Каждое выполненное действие прокачивает ваш персональный уровень (от Новичка до Мастера фокуса и Легенды продуктивности). Нажмите на значок уровня в любой момент, чтобы мгновенно перейти в раздел «Обзор» и увидеть шкалу прогресса и ачивки.',
      benefit: 'Геймификация превращает рутину в увлекательную игру, где каждый день делает вас сильнее.',
    },
    {
      id: 'goals',
      targetSelector: '[data-tour="goals"]',
      route: '/goals',
      title: 'Цели, декомпозиция и подзадачи',
      location: 'Вкладка «Цели»',
      howItWorks: 'Разбивайте масштабные цели по горизонтам (Год, Квартал, Месяц, Неделя). Добавляйте подцели и подзадачи: общий прогресс цели рассчитывается автоматически только от реально выполненных шагов.',
      benefit: 'Большая мечта перестаёт пугать, превращаясь в логичную и выполнимую лестницу действий.',
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
      title: 'Интерактивный календарь планов',
      location: 'Страница «Цели» (переключатель «Календарь»)',
      howItWorks: 'Переключитесь в режим календаря, чтобы видеть интерактивную сетку месяца: дедлайны целей (синие), выполненные достижения (зелёные), задачи дня (фиолетовые) и предстоящие события и встречи (оранжевые) с удобной легендой цветов.',
      benefit: 'Наглядный баланс нагрузки по дням, расписание событий и полная хронология достижений в одном месте.',
    },
    {
      id: 'vision',
      targetSelector: '[data-tour="vision-board"]',
      route: '/vision-board',
      title: 'Доска визуализации (Мечты)',
      location: 'Вкладка «Мечты»',
      howItWorks: 'Создавайте карточки заветных желаний с яркими фотографиями, стоимостью и шкалой накоплений. Любую мечту можно в один клик превратить в практическую цель со сроками и подзадачами!',
      benefit: 'Постоянное визуальное вдохновение и чёткий путь от абстрактной мечты к реальному плану.',
    },
    {
      id: 'analytics',
      targetSelector: '[data-tour="analytics"]',
      route: '/analytics',
      title: 'Обзор, Круговая аналитика и Гайды',
      location: 'Вкладка «Обзор»',
      howItWorks: 'Здесь объединены 3 мощных инструмента: 1) «Обзор» — уровни, очки XP, 16 уникальных ачивок и колесо баланса сфер жизни; 2) «Аналитика» — интерактивная круговая Donut-диаграмма сфер и статусов за неделю, месяц и квартал; 3) «Гайды» — Академия из 10 легендарных методик (SMART, OKR, Помодоро, GTD, Принцип 1%), открываемых за ачивки!',
      benefit: 'Глубокий анализ баланса жизни, честная статистика побед и доступ к проверенным мировым методикам продуктивности.',
    },
    {
      id: 'settings',
      targetSelector: '[data-tour="settings"]',
      route: '/settings',
      title: 'Настройки, экспорт в Excel/JSON и темы',
      location: 'Вкладка «Настройки»',
      howItWorks: 'Выгружайте аналитику в красивый Excel (.xlsx) или делайте резервную копию в JSON, настраивайте свои категории, управляйте паролем, переключайте тёмную тему и запускайте обучение снова в любой момент.',
      benefit: 'Полный контроль над своими данными, безопасность и комфортная персонализация приложения.',
    },
  ];
}

export function OnboardingTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = React.useState(getUserName());
  const steps = React.useMemo(() => getTourSteps(userName), [userName]);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const [tooltipRect, setTooltipRect] = React.useState<{ top: number; left: number; maxHeight: number }>({ 
    top: 60, 
    left: 16, 
    maxHeight: 480 
  });

  // Запуск тура ТОЛЬКО если пользователь авторизован и НЕ на странице логина/регистрации
  React.useEffect(() => {
    const isAuthPage = ['/login', '/register'].includes(location.pathname);
    const userStr = localStorage.getItem('user');

    if (!userStr || isAuthPage) {
      setIsVisible(false);
      return;
    }

    setUserName(getUserName());

    const hasSeenTour = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Слушатель для ручного запуска онбординга из настроек или меню
  React.useEffect(() => {
    const handleStart = () => {
      setUserName(getUserName());
      setCurrentStepIndex(0);
      setIsVisible(true);
    };

    window.addEventListener('start-onboarding', handleStart);
    return () => window.removeEventListener('start-onboarding', handleStart);
  }, []);

  // Автоматический переход на нужную страницу тура при смене шага
  React.useEffect(() => {
    if (!isVisible) return;
    const step = steps[currentStepIndex];
    if (step?.route && location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [isVisible, currentStepIndex, location.pathname, navigate, steps]);

  React.useEffect(() => {
    if (!isVisible) return;
    const updatePosition = () => {
      const step = steps[currentStepIndex];
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
          const top = topReserved;
          const maxHeight = Math.max(220, window.innerHeight - top - bottomReserved);
          setTooltipRect({ top, left, maxHeight });
        } else {
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
  }, [isVisible, currentStepIndex, location.pathname, steps]);

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

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

  const currentStep = steps[currentStepIndex];

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
          "w-[420px] max-w-[calc(100vw-32px)] flex flex-col",
          "animate-in fade-in slide-in-from-bottom-4 duration-300",
          "bg-white border-slate-200",
          "dark:bg-slate-800 dark:border-slate-700"
        )}
        style={{ 
          top: tooltipRect.top, 
          left: tooltipRect.left,
          maxHeight: tooltipRect.maxHeight,
        }}
      >
        {/* Шапка тултипа */}
        <div className="shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 sm:py-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{currentStep.title}</h3>
            <button onClick={handleSkip} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Индикатор прогресса */}
          <div className="flex gap-1 mt-2.5 sm:mt-3">
            {steps.map((_, idx) => (
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
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1 overscroll-contain tour-scrollbar pr-3 sm:pr-4 mr-0.5">
          <div className="flex gap-3">
            <span className="text-lg shrink-0">📍</span>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5 dark:text-indigo-400">Где находится</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{currentStep.location}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex gap-3 dark:border-slate-700">
            <span className="text-lg shrink-0">⚙️</span>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5 dark:text-indigo-400">Как работает</p>
              <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-200">{currentStep.howItWorks}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex gap-3 dark:border-slate-700">
            <span className="text-lg shrink-0">💎</span>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5 dark:text-indigo-400">Зачем нужно & польза</p>
              <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-200">{currentStep.benefit}</p>
            </div>
          </div>
        </div>

        {/* Навигация */}
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