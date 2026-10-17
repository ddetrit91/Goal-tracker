// client/src/components/analytics/GuidesAcademyView.tsx
import * as React from 'react';
import type { Goal } from '@/types/goal';
import type { Task } from '@/types/task';
import { GOAL_GUIDES, type GoalGuide } from '@/data/guidesData';
import { getGamificationStats } from '@/utils/gamification';
import { GuideDetailModal } from '@/components/analytics/GuideDetailModal';
import { 
  BookOpen, 
  Lock, 
  Unlock, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  GraduationCap, 
  Trophy
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface GuidesAcademyViewProps {
  goals: Goal[];
  tasks: Task[];
}

export function GuidesAcademyView({ goals, tasks }: GuidesAcademyViewProps) {
  const [selectedGuide, setSelectedGuide] = React.useState<GoalGuide | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'unlocked' | 'locked'>('all');

  // Получаем статистику геймификации, уровень игрока и разблокированные ачивки
  const gamificationStats = React.useMemo(() => getGamificationStats(goals, tasks), [goals, tasks]);

  const unlockedAchievementIds = React.useMemo(() => {
    return new Set(
      gamificationStats.achievements
        .filter((a) => a.isUnlocked)
        .map((a) => a.id)
    );
  }, [gamificationStats.achievements]);

  // Функция проверки разблокировки конкретного гайда
  const checkIsUnlocked = React.useCallback(
    (guide: GoalGuide): boolean => {
      const { minLevel, achievementId } = guide.unlockCondition;
      const isLevelSufficient = minLevel === undefined || gamificationStats.level >= minLevel;
      const isAchievementEarned = !achievementId || unlockedAchievementIds.has(achievementId);
      return isLevelSufficient && isAchievementEarned;
    },
    [gamificationStats.level, unlockedAchievementIds]
  );

  // Подсчёт количества открытых гайдов
  const unlockedCount = React.useMemo(() => {
    return GOAL_GUIDES.filter((g) => checkIsUnlocked(g)).length;
  }, [checkIsUnlocked]);

  const progressPercent = Math.round((unlockedCount / GOAL_GUIDES.length) * 100);

  // Фильтрация гайдов
  const filteredGuides = React.useMemo(() => {
    return GOAL_GUIDES.filter((guide) => {
      const isUnlocked = checkIsUnlocked(guide);

      // Фильтр по статусу
      if (statusFilter === 'unlocked' && !isUnlocked) return false;
      if (statusFilter === 'locked' && isUnlocked) return false;

      // Фильтр по категории
      if (categoryFilter !== 'all' && guide.category !== categoryFilter) return false;

      return true;
    });
  }, [checkIsUnlocked, statusFilter, categoryFilter]);

  const handleOpenGuide = (guide: GoalGuide) => {
    if (checkIsUnlocked(guide)) {
      setSelectedGuide(guide);
      setIsModalOpen(true);
    } else {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            message: `🔒 Гайд заблокирован. ${guide.unlockCondition.description}`,
          },
        })
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-full overflow-hidden">
      {/* ВЕРХНИЙ БАННЕР АКАДЕМИИ С ПРОГРЕССОМ РАЗБЛОКИРОВКИ */}
      <div className="relative overflow-hidden p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-800/60 w-full max-w-full">
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 backdrop-blur-sm">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-300" />
              <span>Магазин знаний & Секретные техники</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              Академия достижения целей 📚
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Коллекция легендарных методик (SMART, OKR, Помодоро, GTD, Принцип 1%). Открывайте секретные гайды за достижение ачивок и повышение уровня в игре!
            </p>
          </div>

          {/* ПЛАШКА СЧЁТЧИКА И ПРОГРЕСС-БАРА */}
          <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0 w-full md:w-auto md:min-w-[220px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-indigo-200 font-semibold flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Открыто знаний
              </span>
              <span className="font-black text-white text-sm">
                {unlockedCount} из {GOAL_GUIDES.length}
              </span>
            </div>

            <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-700 rounded-full shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-[11px] text-indigo-300/80">
              <span>{progressPercent}% разблокировано</span>
              <span className="flex items-center gap-1 font-bold text-amber-300">
                <Trophy className="h-3 w-3" />
                Ур. {gamificationStats.level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ПАНЕЛЬ ФИЛЬТРОВ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm w-full max-w-full">
        {/* Фильтр по статусу: МОБИЛЬНЫЙ (3 колонки с полными надписями) */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 w-full sm:hidden">
          {[
            { id: 'all', label: `Все (${GOAL_GUIDES.length})` },
            { id: 'unlocked', label: `Разблокированы (${unlockedCount})` },
            { id: 'locked', label: `Ждут открытия (${GOAL_GUIDES.length - unlockedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={cn(
                "px-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all text-center leading-tight truncate",
                statusFilter === tab.id
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Фильтр по статусу: ДЕСКТОПНЫЙ (100% как было раньше) */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
          {[
            { id: 'all', label: `Все (${GOAL_GUIDES.length})` },
            { id: 'unlocked', label: `Разблокированы (${unlockedCount})` },
            { id: 'locked', label: `Ждут открытия (${GOAL_GUIDES.length - unlockedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                statusFilter === tab.id
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Фильтр по направлениям: МОБИЛЬНЫЙ (2 аккуратных ряда на всю ширину) */}
        <div className="flex flex-col gap-1.5 w-full sm:hidden">
          {/* Верхний ряд: Все, Цели, Фокус */}
          <div className="grid grid-cols-3 gap-1.5 w-full">
            {[
              { id: 'all', label: 'Все' },
              { id: 'goals', label: 'Цели' },
              { id: 'focus', label: 'Фокус' },
            ].map((cat) => {
              const isSelected = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "px-2 py-1.5 rounded-xl text-xs font-medium transition-all border text-center truncate",
                    isSelected
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 font-bold shadow-sm"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Нижний ряд: Время, Привычки */}
          <div className="grid grid-cols-2 gap-1.5 w-full">
            {[
              { id: 'time', label: 'Время' },
              { id: 'habits', label: 'Привычки' },
            ].map((cat) => {
              const isSelected = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "px-2 py-1.5 rounded-xl text-xs font-medium transition-all border text-center truncate",
                    isSelected
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 font-bold shadow-sm"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Фильтр по направлениям: ДЕСКТОПНЫЙ (100% как было раньше) */}
        <div className="hidden sm:flex items-center gap-1.5 self-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Все сферы' },
            { id: 'goals', label: 'Цели' },
            { id: 'focus', label: 'Фокус' },
            { id: 'time', label: 'Время' },
            { id: 'habits', label: 'Привычки' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap border",
                categoryFilter === cat.id
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 font-bold"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* СЕТКА КАРТОЧЕК ГАЙДОВ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGuides.map((guide) => {
          const isUnlocked = checkIsUnlocked(guide);

          return (
            <div
              key={guide.id}
              onClick={() => handleOpenGuide(guide)}
              className={cn(
                "rounded-3xl border transition-all p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer",
                isUnlocked
                  ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/80 opacity-90"
              )}
            >
              {/* ФОНОВЫЙ ДЕКОРАТИВНЫЙ БЛИК */}
              {isUnlocked && (
                <div 
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-30"
                  style={{ backgroundColor: guide.color }}
                />
              )}

              <div>
                {/* ВЕРХНЯЯ СТРОКА: ИКОНКА, КАТЕГОРИЯ И СТАТУС ЗАМКА */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border",
                        isUnlocked
                          ? "bg-slate-50 dark:bg-slate-700/50 border-slate-200/80 dark:border-slate-600"
                          : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 grayscale"
                      )}
                    >
                      {guide.icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: isUnlocked ? guide.color : '#94a3b8' }}
                        >
                          {guide.categoryLabel}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {guide.readTime}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">
                        {guide.badge}
                      </span>
                    </div>
                  </div>

                  {/* БЕЙДЖ СТАТУСА: ЗАМОК ИЛИ ГАЛОЧКА */}
                  {isUnlocked ? (
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm border border-emerald-200 dark:border-emerald-800">
                      <Unlock className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                      <Lock className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* НАЗВАНИЕ И ОПИСАНИЕ */}
                <h3 className={cn(
                  "text-base sm:text-lg font-bold leading-tight mb-1.5 transition-colors",
                  isUnlocked 
                    ? "text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400" 
                    : "text-slate-600 dark:text-slate-400"
                )}>
                  {guide.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {guide.subtitle}
                </p>
              </div>

              {/* НИЖНИЙ БЛОК: КНОПКА ИЛИ ТРЕБОВАНИЕ РАЗБЛОКИРОВКИ */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                {isUnlocked ? (
                  <>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Доступно
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Читать гайд</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 w-full">
                    <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="line-clamp-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      {guide.unlockCondition.description}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* МОДАЛЬНОЕ ОКНО ЧТЕНИЯ ГАЙДА */}
      <GuideDetailModal
        guide={selectedGuide}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGuide(null);
        }}
      />
    </div>
  );
}
