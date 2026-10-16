// client/src/components/analytics/GamificationBanner.tsx
import * as React from 'react';
import { Trophy, Zap, Award, Sparkles, ChevronDown, ChevronUp, CheckCircle2, Lock } from 'lucide-react';
import { getGamificationStats } from '@/utils/gamification';
import type { Goal } from '@/types/goal';
import type { Task } from '@/types/task';
import { cn } from '@/utils/cn';

interface GamificationBannerProps {
  goals: Goal[];
  tasks: Task[];
  onOpenGuides?: () => void;
}

export function GamificationBanner({ goals, tasks, onOpenGuides }: GamificationBannerProps) {
  const [showAchievements, setShowAchievements] = React.useState(false);
  const [achFilter, setAchFilter] = React.useState<'all' | 'unlocked' | 'locked'>('all');
  const stats = React.useMemo(() => getGamificationStats(goals, tasks), [goals, tasks]);

  const unlockedCount = stats.achievements.filter((a) => a.isUnlocked).length;
  
  const displayedAchievements = React.useMemo(() => {
    if (achFilter === 'unlocked') return stats.achievements.filter((a) => a.isUnlocked);
    if (achFilter === 'locked') return stats.achievements.filter((a) => !a.isUnlocked);
    return stats.achievements;
  }, [stats.achievements, achFilter]);

  return (
    <section className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white p-5 sm:p-6 shadow-xl border border-indigo-500/20 relative overflow-hidden">
      {/* Фоновые декоративные сферы */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Верхний блок: Ранг и уровень */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          {/* Иконка уровня */}
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/25 shrink-0 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950/80 rounded-[14px] flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl">{stats.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mt-0.5">
                Ур. {stats.level}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Уровень {stats.level}
              </span>
              <span className="text-xs text-indigo-200 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-300" />
                {stats.title}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              {stats.totalXP} <span className="text-xs font-semibold text-indigo-300">XP Очков</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {stats.xpToNext > 0 ? (
                <>Ещё <span className="text-amber-300 font-semibold">{stats.xpToNext} XP</span> до «{stats.nextTitle}»</>
              ) : (
                'Достигнут максимальный ранг!'
              )}
            </p>
          </div>
        </div>

        {/* 3 статистических блока */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
              <Trophy className="h-4 w-4" />
              <span className="text-sm sm:text-base font-bold">{stats.cupsCount}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">Кубки</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-indigo-400 mb-0.5">
              <Zap className="h-4 w-4" />
              <span className="text-sm sm:text-base font-bold">{stats.completedTasksCount}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">Задач</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
              <Award className="h-4 w-4" />
              <span className="text-sm sm:text-base font-bold">{stats.completedGoalsCount}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">Целей</span>
          </div>
        </div>
      </div>

      {/* Шкала прогресса уровня */}
      <div className="relative z-10 mt-5 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-slate-300">
            Прогресс текущего уровня: {stats.xpInCurrentLevel} / {stats.xpNeededForLevel} XP
          </span>
          <span className="text-amber-300 font-bold">{stats.progressPercent}%</span>
        </div>
        <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Кнопка показа достижений и переход в магазин гайдов */}
      <div className="relative z-10 mt-4 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-300">
            Награды: <strong className="text-white">{unlockedCount}</strong> из {stats.achievements.length} открыто
          </span>
          {onOpenGuides && (
            <button
              onClick={onOpenGuides}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>Магазин гайдов 📚</span>
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAchievements(!showAchievements)}
          className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1 transition-colors py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10"
        >
          <span>{showAchievements ? 'Скрыть награды' : 'Открыть награды'}</span>
          {showAchievements ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Список ачивок */}
      {showAchievements && (
        <div className="relative z-10 mt-4 pt-4 border-t border-white/10 animate-in fade-in duration-300">
          {/* Фильтры достижений */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setAchFilter('all')}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap",
                achFilter === 'all'
                  ? "bg-white/20 text-white font-semibold"
                  : "bg-white/5 text-slate-400 hover:text-white"
              )}
            >
              Все ({stats.achievements.length})
            </button>
            <button
              onClick={() => setAchFilter('unlocked')}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap",
                achFilter === 'unlocked'
                  ? "bg-amber-400/25 text-amber-300 font-semibold border border-amber-400/40"
                  : "bg-white/5 text-slate-400 hover:text-white"
              )}
            >
              Открытые ({unlockedCount})
            </button>
            <button
              onClick={() => setAchFilter('locked')}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap",
                achFilter === 'locked'
                  ? "bg-white/20 text-white font-semibold"
                  : "bg-white/5 text-slate-400 hover:text-white"
              )}
            >
              В процессе ({stats.achievements.length - unlockedCount})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {displayedAchievements.map((ach) => (
              <div
                key={ach.id}
                className={cn(
                  "p-3 rounded-xl border transition-all text-left flex items-start gap-3",
                  ach.isUnlocked
                    ? "bg-white/10 border-amber-400/30 text-white"
                    : "bg-white/5 border-white/5 text-slate-400 opacity-60"
                )}
              >
                <div className="text-2xl shrink-0 p-1 rounded-lg bg-black/20">
                  {ach.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className="text-xs font-bold text-white truncate">{ach.title}</h4>
                    {ach.isUnlocked ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5 shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        +{ach.xpReward} XP
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0">
                        <Lock className="h-3 w-3" />
                        +{ach.xpReward} XP
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                    {ach.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          ach.isUnlocked ? "bg-amber-400" : "bg-slate-500"
                        )}
                        style={{ width: `${Math.round((ach.current / ach.total) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ach.current}/{ach.total}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
