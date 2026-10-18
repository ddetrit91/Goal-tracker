// client/src/utils/gamification.ts
import type { Goal } from '@/types/goal';
import type { Task } from '@/types/task';
import type { AppEvent } from '@/types/event';

export function calculateTaskXP(task: Task): number {
  let xp = 10;
  if (task.isDailyFocus) xp += 5;
  if (task.priority === 'high') xp += 5;
  return xp;
}

export function calculateGoalXP(goal: Goal): number {
  let xp = 50;
  if (goal.priority === 'high') xp += 20;
  if (goal.priority === 'critical') xp += 30;
  return xp;
}

export function calculateEventXP(_event?: AppEvent): number {
  return 20; // 20 XP за посещение / выполнение запланированного события
}

export interface RankItem {
  level: number;
  title: string;
  minXP: number;
  icon: string;
}

export const RANKS: RankItem[] = [
  { level: 0, title: 'Новичок', minXP: 0, icon: '🌱' },
  { level: 1, title: 'Искатель', minXP: 100, icon: '🎯' },
  { level: 2, title: 'Действователь', minXP: 250, icon: '⚡' },
  { level: 3, title: 'Мастер фокуса', minXP: 500, icon: '🔥' },
  { level: 4, title: 'Стратег', minXP: 900, icon: '🛡️' },
  { level: 5, title: 'Покоритель вершин', minXP: 1500, icon: '🏆' },
  { level: 6, title: 'Мастер дисциплины', minXP: 2300, icon: '⭐' },
  { level: 7, title: 'Титан побед', minXP: 3300, icon: '💎' },
  { level: 8, title: 'Легенда продуктивности', minXP: 4500, icon: '👑' },
];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  current: number;
  total: number;
  xpReward: number;
}

export function getGamificationStats(goals: Goal[], tasks: Task[], events: AppEvent[] = []) {
  // Цель считается завершённой только если её статус 'completed' И прогресс достиг 100%
  const completedGoals = goals.filter((g) => g.status === 'completed' && (g.progress ?? 0) >= 100);
  const completedTasks = tasks.filter((t) => t.isCompleted);
  const completedEvents = events.filter((e) => e.isCompleted);
  const completedFocusTasks = completedTasks.filter((t) => t.isDailyFocus);
  const visionGoals = goals.filter((g) => g.category === 'dream' || g.category === 'wishlist' || g.horizon === 'life');
  const highPriorityTasks = completedTasks.filter((t) => t.priority === 'high');
  const usedCategories = new Set([
    ...goals.map((g) => g.category).filter(Boolean),
    ...tasks.map((t) => t.category).filter(Boolean),
  ]);

  // Подсчёт базового опыта
  let baseXP = 0;
  completedTasks.forEach((t) => {
    baseXP += calculateTaskXP(t);
  });
  completedGoals.forEach((g) => {
    baseXP += calculateGoalXP(g);
  });
  completedEvents.forEach((e) => {
    baseXP += calculateEventXP(e);
  });

  // Расширенная коллекция достижений (16 ачивок)
  const achievements: Achievement[] = [
    {
      id: 'first-task',
      title: 'Первый шаг',
      description: 'Выполнить первую задачу',
      icon: '🎯',
      isUnlocked: completedTasks.length >= 1,
      current: Math.min(1, completedTasks.length),
      total: 1,
      xpReward: 30,
    },
    {
      id: 'focus-starter',
      title: 'В фокусе',
      description: 'Закрыть первую задачу главного фокуса дня',
      icon: '🌟',
      isUnlocked: completedFocusTasks.length >= 1,
      current: Math.min(1, completedFocusTasks.length),
      total: 1,
      xpReward: 35,
    },
    {
      id: 'first-goal',
      title: 'В яблочко',
      description: 'Достичь первую цель',
      icon: '🏆',
      isUnlocked: completedGoals.length >= 1,
      current: Math.min(1, completedGoals.length),
      total: 1,
      xpReward: 50,
    },
    {
      id: 'task-sprinter',
      title: 'Набирая темп',
      description: 'Успешно завершить 10 задач',
      icon: '🚀',
      isUnlocked: completedTasks.length >= 10,
      current: Math.min(10, completedTasks.length),
      total: 10,
      xpReward: 60,
    },
    {
      id: 'focus-hero',
      title: 'Мастер фокуса',
      description: 'Закрыть 5 главных задач дня',
      icon: '⚡',
      isUnlocked: completedFocusTasks.length >= 5,
      current: Math.min(5, completedFocusTasks.length),
      total: 5,
      xpReward: 75,
    },
    {
      id: 'vision-dreamer',
      title: 'Визионер',
      description: 'Создать мечту или желание на Доске визуализации',
      icon: '🌌',
      isUnlocked: visionGoals.length >= 1,
      current: Math.min(1, visionGoals.length),
      total: 1,
      xpReward: 40,
    },
    {
      id: 'life-balance',
      title: 'Колесо баланса',
      description: 'Задействовать минимум 4 разные сферы жизни',
      icon: '⚖️',
      isUnlocked: usedCategories.size >= 4,
      current: Math.min(4, usedCategories.size),
      total: 4,
      xpReward: 70,
    },
    {
      id: 'task-machine',
      title: 'Марафонец',
      description: 'Успешно завершить 25 задач',
      icon: '🔥',
      isUnlocked: completedTasks.length >= 25,
      current: Math.min(25, completedTasks.length),
      total: 25,
      xpReward: 100,
    },
    {
      id: 'priority-master',
      title: 'Бесстрашный',
      description: 'Выполнить 5 задач высокого приоритета',
      icon: '🦁',
      isUnlocked: highPriorityTasks.length >= 5,
      current: Math.min(5, highPriorityTasks.length),
      total: 5,
      xpReward: 90,
    },
    {
      id: 'goal-duo',
      title: 'Двойной триумф',
      description: 'Успешно достичь 2 цели',
      icon: '🥈',
      isUnlocked: completedGoals.length >= 2,
      current: Math.min(2, completedGoals.length),
      total: 2,
      xpReward: 80,
    },
    {
      id: 'goal-crusher',
      title: 'Триумфатор',
      description: 'Достичь 3 глобальные цели',
      icon: '🥇',
      isUnlocked: completedGoals.length >= 3,
      current: Math.min(3, completedGoals.length),
      total: 3,
      xpReward: 150,
    },
    {
      id: 'focus-titan',
      title: 'Стальной фокус',
      description: 'Закрыть 15 задач главного фокуса дня',
      icon: '🛡️',
      isUnlocked: completedFocusTasks.length >= 15,
      current: Math.min(15, completedFocusTasks.length),
      total: 15,
      xpReward: 130,
    },
    {
      id: 'vision-collector',
      title: 'Магнит желаний',
      description: 'Собрать 3 мечты на Доске визуализации',
      icon: '✨',
      isUnlocked: visionGoals.length >= 3,
      current: Math.min(3, visionGoals.length),
      total: 3,
      xpReward: 85,
    },
    {
      id: 'task-centurion',
      title: 'Центурион',
      description: 'Успешно выполнить 50 задач',
      icon: '⚔️',
      isUnlocked: completedTasks.length >= 50,
      current: Math.min(50, completedTasks.length),
      total: 50,
      xpReward: 200,
    },
    {
      id: 'goal-legend',
      title: 'Покоритель вершин',
      description: 'Успешно покорить 5 целей',
      icon: '👑',
      isUnlocked: completedGoals.length >= 5,
      current: Math.min(5, completedGoals.length),
      total: 5,
      xpReward: 250,
    },
    {
      id: 'grandmaster',
      title: 'Грандмастер',
      description: 'Выполнить 100 задач и 7 глобальных целей',
      icon: '💎',
      isUnlocked: completedTasks.length >= 100 && completedGoals.length >= 7,
      current: Math.min(100, completedTasks.length) + Math.min(7, completedGoals.length),
      total: 107,
      xpReward: 400,
    },
    {
      id: 'focus-zen',
      title: 'Глубокое погружение',
      description: 'Завершить 1 сессию Помодоро-фокуса (25 мин)',
      icon: '⏱',
      isUnlocked: (typeof window !== 'undefined' ? Number(localStorage.getItem('completed_focus_sessions_count') || '0') : 0) >= 1,
      current: Math.min(1, typeof window !== 'undefined' ? Number(localStorage.getItem('completed_focus_sessions_count') || '0') : 0),
      total: 1,
      xpReward: 30,
    },
    {
      id: 'focus-monk',
      title: 'Дзен-мастер',
      description: 'Завершить 5 сессий глубокого фокуса',
      icon: '🧘',
      isUnlocked: (typeof window !== 'undefined' ? Number(localStorage.getItem('completed_focus_sessions_count') || '0') : 0) >= 5,
      current: Math.min(5, typeof window !== 'undefined' ? Number(localStorage.getItem('completed_focus_sessions_count') || '0') : 0),
      total: 5,
      xpReward: 80,
    },
  ];

  // Бонусные очки за разблокированные достижения
  const unlockedBonusXP = achievements
    .filter((a) => a.isUnlocked)
    .reduce((sum, a) => sum + a.xpReward, 0);

  // Бонусные очки за сессии глубокого фокуса (+15 XP за каждую сессию)
  const focusSessionsCount = typeof window !== 'undefined'
    ? Number(localStorage.getItem('completed_focus_sessions_count') || '0')
    : 0;
  const focusXP = focusSessionsCount * 15;

  const totalXP = baseXP + unlockedBonusXP + focusXP;

  // Определение уровня
  let currentRank: RankItem = RANKS[0] ?? { level: 0, title: 'Новичок', minXP: 0, icon: '🌱' };
  let nextRank: RankItem | null = RANKS[1] ?? null;

  for (let i = RANKS.length - 1; i >= 0; i--) {
    const rank = RANKS[i];
    if (rank && totalXP >= rank.minXP) {
      currentRank = rank;
      nextRank = RANKS[i + 1] ?? null;
      break;
    }
  }

  const currentLevelMin = currentRank.minXP;
  const nextLevelMin = nextRank ? nextRank.minXP : currentLevelMin + 1500;
  const xpInCurrentLevel = totalXP - currentLevelMin;
  const xpNeededForLevel = nextLevelMin - currentLevelMin;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100))
  );
  const xpToNext = Math.max(0, nextLevelMin - totalXP);

  // Общее число кубков: завершенные цели + разблокированные достижения
  const cupsCount = completedGoals.length + achievements.filter((a) => a.isUnlocked).length;

  return {
    level: currentRank.level,
    title: currentRank.title,
    icon: currentRank.icon,
    totalXP,
    xpInCurrentLevel,
    xpNeededForLevel,
    progressPercent,
    xpToNext,
    nextTitle: nextRank ? nextRank.title : 'Легендарный статус',
    cupsCount,
    completedGoalsCount: completedGoals.length,
    completedTasksCount: completedTasks.length,
    focusSessionsCount,
    achievements,
  };
}
