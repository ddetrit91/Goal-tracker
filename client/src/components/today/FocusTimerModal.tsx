// client/src/components/today/FocusTimerModal.tsx
import * as React from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { toISODateString } from '@/utils/date';
import { playLevelUpSound, triggerHaptic } from '@/utils/soundEffects';
import {
  playAmbientSound,
  stopAmbientSound,
  setAmbientVolume,
  type AmbientSoundType,
} from '@/utils/ambientSound';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sparkles,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Target,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import confetti from 'canvas-confetti';
import type { Task } from '@/types/task';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task | null;
}

type TimerPreset = 25 | 50 | 5 | 15;

const PRESET_DURATIONS: Record<TimerPreset, number> = {
  25: 25 * 60,
  50: 50 * 60,
  5: 5 * 60,
  15: 15 * 60,
};

export function FocusTimerModal({ isOpen, onClose, initialTask }: FocusTimerModalProps) {
  const today = toISODateString(new Date());
  const { tasks, toggleComplete } = useTaskStore();

  const [preset, setPreset] = React.useState<TimerPreset>(25);
  const [timeLeft, setTimeLeft] = React.useState(25 * 60);
  const [isRunning, setIsRunning] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(initialTask ?? null);
  const [ambientType, setAmbientType] = React.useState<AmbientSoundType>('none');
  const [ambientVol, setAmbientVol] = React.useState(0.5);
  const [isZenMode, setIsZenMode] = React.useState(false);
  const [isCompletedSession, setIsCompletedSession] = React.useState(false);

  // Список невыполненных задач на сегодня
  const todaysTasks = React.useMemo(() => {
    return tasks.filter((t) => t.dueDate === today && !t.isCompleted);
  }, [tasks, today]);

  // Обновляем выбранную задачу при изменении initialTask
  React.useEffect(() => {
    if (initialTask) {
      setSelectedTask(initialTask);
    } else if (!selectedTask && todaysTasks.length > 0) {
      const firstFocus = todaysTasks.find((t) => t.isDailyFocus) || todaysTasks[0];
      setSelectedTask(firstFocus || null);
    }
  }, [initialTask, todaysTasks]);

  // Сброс таймера при смене пресета
  const handleSelectPreset = (newPreset: TimerPreset) => {
    setPreset(newPreset);
    setTimeLeft(PRESET_DURATIONS[newPreset]);
    setIsRunning(false);
    setIsCompletedSession(false);
  };

  // Тик таймера
  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer!);
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft]);

  // Управление звуком окружения: играет при выборе звука и сразу замолкает при 'none' или закрытии
  React.useEffect(() => {
    if (isOpen && ambientType !== 'none') {
      playAmbientSound(ambientType, ambientVol);
    } else {
      stopAmbientSound();
    }
    return () => {
      stopAmbientSound();
    };
  }, [isOpen, ambientType]);

  // Гарантированная мгновенная тишина при закрытии модального окна
  React.useEffect(() => {
    if (!isOpen) {
      stopAmbientSound();
      setIsRunning(false);
      setAmbientType('none');
    }
  }, [isOpen]);

  const handleTogglePlay = () => {
    triggerHaptic('light');
    if (!isRunning && timeLeft === 0) {
      setTimeLeft(PRESET_DURATIONS[preset]);
      setIsCompletedSession(false);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    triggerHaptic('light');
    setIsRunning(false);
    setTimeLeft(PRESET_DURATIONS[preset]);
    setIsCompletedSession(false);
  };

  const handleAmbientChange = (type: AmbientSoundType) => {
    triggerHaptic('light');
    setAmbientType(type);
    if (type === 'none') {
      stopAmbientSound();
    } else {
      playAmbientSound(type, ambientVol);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAmbientVol(val);
    setAmbientVolume(val);
  };

  // Завершение сессии фокуса
  const handleSessionEnd = () => {
    setIsRunning(false);
    setAmbientType('none');
    stopAmbientSound();
    setIsCompletedSession(true);

    // Начисление XP за фокус (+15 XP)
    try {
      const currentCount = Number(localStorage.getItem('completed_focus_sessions_count') || '0');
      localStorage.setItem('completed_focus_sessions_count', String(currentCount + 1));
      window.dispatchEvent(new CustomEvent('focus-session-completed', { detail: { xp: 15 } }));
    } catch {}

    playLevelUpSound();
    triggerHaptic('success');

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
    });
  };

  const handleCompleteCurrentTask = async () => {
    if (!selectedTask) return;
    triggerHaptic('success');
    await toggleComplete(selectedTask.id);
    setSelectedTask(null);
  };

  const handleClose = () => {
    if (isRunning) {
      const confirmClose = window.confirm('Фокус-сессия ещё активна. Вы уверены, что хотите прервать?');
      if (!confirmClose) return;
    }
    setIsRunning(false);
    setAmbientType('none');
    stopAmbientSound();
    onClose();
  };

  if (!isOpen) return null;

  const totalDuration = PRESET_DURATIONS[preset];
  const isRestMode = preset === 5 || preset === 15;
  const progressRatio = Math.max(0, Math.min(1, 1 - timeLeft / totalDuration));
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Ring расчет
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Визуализация в центре круга: Дерево Forest (для фокуса) или Дзен-восстановление (для отдыха)
  const getDisplayStage = () => {
    if (isRestMode) {
      if (progressRatio < 0.25) return { icon: '☕', label: 'Чашка чая и расслабление' };
      if (progressRatio < 0.6) return { icon: '🪷', label: 'Лотос чистоты мыслей и спокойствия' };
      if (progressRatio < 0.95) return { icon: '🍃', label: 'Восстановление сил' };
      return { icon: '⚡', label: 'Энергия восстановлена!' };
    }
    // Режим глубокого фокуса (25 / 50 мин):
    if (progressRatio < 0.25) return { icon: '🌱', label: 'Прорастание ростка' };
    if (progressRatio < 0.6) return { icon: '🌿', label: 'Молодое деревце' };
    if (progressRatio < 0.95) return { icon: '🌲', label: 'Крепкое дерево' };
    return { icon: '🌳', label: 'Цветущее древо мудрости' };
  };

  const displayStage = getDisplayStage();

  const PRESET_OPTIONS = [
    { id: 25, time: '25 мин', label: 'Помодоро', icon: '🎯', isRest: false },
    { id: 50, time: '50 мин', label: 'Спринт', icon: '⚡', isRest: false },
    { id: 5, time: '5 мин', label: 'Отдых', icon: '☕', isRest: true },
    { id: 15, time: '15 мин', label: 'Релакс', icon: '🪷', isRest: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          "relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border overflow-y-auto flex flex-col transition-all duration-300",
          isRestMode
            ? "border-teal-200/60 dark:border-teal-900/40"
            : "border-indigo-200/50 dark:border-indigo-900/40",
          isZenMode ? "max-w-lg p-6 sm:p-10 max-h-[92vh]" : "max-h-[92vh]"
        )}
      >
        {/* Фоновые мягкие градиенты атмосферы */}
        <div className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b to-transparent blur-3xl pointer-events-none rounded-full transition-colors",
          isRestMode
            ? "from-teal-500/15 via-emerald-500/10"
            : "from-indigo-500/15 via-purple-500/10"
        )} />

        {/* Верхняя панель: Режим Дзен и Закрытие */}
        <div className="relative p-4 sm:p-5 pb-2 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl select-none">{isRestMode ? '☕' : '⏱'}</span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {isRestMode ? 'Перерыв и восстановление сил' : 'Режим глубокого фокуса'}
                <span className={cn(
                  "text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full transition-colors",
                  isRestMode
                    ? "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                )}>
                  {isRestMode ? '🪷 Релакс' : '+15 XP'}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsZenMode(!isZenMode)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isZenMode ? "Обычный режим" : "Дзен-режим (минимум отвлечений)"}
            >
              {isZenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Выбор пресета времени: наглядные 2-строчные карточки на мобильных и десктопе */}
        {(!isZenMode || !isRunning) && (
          <div className="px-3 sm:px-6 py-2 grid grid-cols-4 gap-1.5 z-10">
            {PRESET_OPTIONS.map((item) => {
              const isSelected = preset === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectPreset(item.id as TimerPreset)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all border text-center active:scale-95",
                    isSelected
                      ? item.isRest
                        ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/25 ring-2 ring-teal-400/50"
                        : "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/50"
                      : item.isRest
                        ? "bg-teal-50/70 dark:bg-teal-950/25 border-teal-200/80 dark:border-teal-900/40 text-teal-900 dark:text-teal-200 hover:bg-teal-100/70"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
                  )}
                >
                  <span className="text-xs sm:text-sm font-black leading-tight">
                    {item.time}
                  </span>
                  <span className={cn(
                    "text-[10px] sm:text-[11px] font-bold leading-none mt-1 flex items-center gap-0.5",
                    isSelected
                      ? "text-white/95"
                      : item.isRest
                        ? "text-teal-700 dark:text-teal-300"
                        : "text-slate-500 dark:text-slate-400"
                  )}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ЦЕНТР: Круговой SVG-таймер и дерево Forest / Дзен-отдых */}
        <div className="relative py-2 sm:py-6 flex flex-col items-center justify-center z-10">
          <div className="relative w-52 h-52 sm:w-68 sm:h-68 flex items-center justify-center">
            {/* SVG Круг прогресса */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
              <circle
                cx="140"
                cy="140"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="140"
                cy="140"
                r={radius}
                className={cn(
                  "transition-all duration-1000 ease-linear",
                  isRestMode
                    ? "stroke-teal-500 dark:stroke-teal-400"
                    : "stroke-indigo-600 dark:stroke-indigo-400"
                )}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Внутреннее содержимое круга */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
              <span className={cn(
                "text-4xl sm:text-5xl mb-1 filter drop-shadow transition-transform duration-500",
                isRunning && "animate-pulse"
              )}>
                {displayStage.icon}
              </span>

              <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                {timeFormatted}
              </div>

              <span className={cn(
                "text-xs font-bold mt-1",
                isRestMode ? "text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"
              )}>
                {displayStage.label}
              </span>
            </div>
          </div>

          {/* Текущая задача в фокусе или статус отдыха */}
          <div className="mt-3 px-6 text-center max-w-sm">
            {isRestMode ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/80 text-xs font-semibold text-teal-900 dark:text-teal-200">
                <span className="text-sm">🍃</span>
                <span>Время перезагрузки: отвлекитесь от экрана и разомнитесь</span>
              </div>
            ) : selectedTask ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                <Target className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span className="truncate max-w-[240px]">{selectedTask.title}</span>
                <button
                  onClick={handleCompleteCurrentTask}
                  className="ml-1 p-0.5 rounded-full hover:bg-emerald-500 hover:text-white text-emerald-600 transition-colors"
                  title="Отметить задачу выполненной"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Свободный фокус (без привязки к конкретной задаче)
              </p>
            )}
          </div>
        </div>

        {/* Экран триумфа при завершении таймера */}
        {isCompletedSession && (
          <div className={cn(
            "mx-4 sm:mx-6 mb-4 p-4 rounded-2xl border text-center animate-in zoom-in-95 duration-200 z-10",
            isRestMode
              ? "bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-cyan-500/15 border-teal-300 dark:border-teal-700/60"
              : "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border-emerald-300 dark:border-emerald-700/60"
          )}>
            <div className={cn(
              "inline-flex items-center gap-1.5 font-black text-sm mb-1",
              isRestMode ? "text-teal-700 dark:text-teal-300" : "text-emerald-700 dark:text-emerald-300"
            )}>
              <Sparkles className="h-4 w-4" />
              {isRestMode ? 'Отдых завершён! Силы восстановлены ⚡' : 'Сессия фокуса завершена! +15 XP 🏆'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {isRestMode
                ? 'Вы отлично восстановили силы. Время возвращаться к вашим главным целям дня!'
                : 'Ваше древо фокуса выросло! Отличная концентрация. Время немного отдохнуть.'}
            </p>
          </div>
        )}

        {/* Кнопки управления (Старт / Пауза / Сброс) */}
        <div className="px-6 py-2 flex items-center justify-center gap-4 z-10">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Сбросить таймер"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            onClick={handleTogglePlay}
            className={cn(
              "px-8 py-3.5 rounded-2xl font-black text-base text-white shadow-xl transition-all duration-200 flex items-center gap-2.5 active:scale-95",
              isRunning
                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                : isRestMode
                ? "bg-teal-600 hover:bg-teal-700 shadow-teal-600/30 hover:scale-105"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30 hover:scale-105"
            )}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5 fill-current" /> Пауза
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current" />{' '}
                {timeLeft === totalDuration
                  ? isRestMode
                    ? 'Начать отдых'
                    : 'Начать фокус'
                  : 'Продолжить'}
              </>
            )}
          </button>
        </div>

        {/* Панель звуков продуктивности (Endel Ambient Audio) */}
        {!isZenMode && (
          <div className="p-3.5 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 z-10 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5" /> Фоновые звуки:
              </span>

              {ambientType !== 'none' && (
                <div className="flex items-center gap-2 w-24 sm:w-28">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVol}
                    onChange={handleVolumeChange}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    title={`Громкость: ${Math.round(ambientVol * 100)}%`}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
              {[
                { id: 'none', label: 'Тишина', icon: '🔇' },
                { id: 'rain', label: 'Дождь', icon: '🌧️' },
                { id: 'fire', label: 'Костёр', icon: '🔥' },
                { id: 'waves', label: 'Волны', icon: '🌊' },
                { id: 'noise', label: 'Шум', icon: '💨' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAmbientChange(item.id as AmbientSoundType)}
                  className={cn(
                    "p-1.5 sm:p-2 rounded-xl border font-semibold flex flex-col items-center gap-0.5 sm:gap-1 transition-all",
                    ambientType === item.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750"
                  )}
                >
                  <span className="text-sm sm:text-base select-none">{item.icon}</span>
                  <span className="text-[9px] sm:text-[10px] truncate max-w-full">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Выбор задачи из списка на сегодня */}
            {todaysTasks.length > 0 && (
              <div className="pt-1">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block mb-1">
                  Привязать другую задачу на сегодня:
                </label>
                <div className="relative">
                  <select
                    value={selectedTask?.id || ''}
                    onChange={(e) => {
                      const found = todaysTasks.find((t) => t.id === e.target.value);
                      setSelectedTask(found || null);
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none pr-8 truncate"
                  >
                    <option value="">Без привязки (Свободный фокус)</option>
                    {todaysTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.isDailyFocus ? '⭐ ' : ''}{t.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
