import * as React from 'react';
import { Button } from '@/components/common/Button';
import { Download, Upload, RefreshCw, AlertTriangle, FileSpreadsheet, Volume2, VolumeX, Smartphone } from 'lucide-react';
import type { IBackupData } from '@/services/storage/storage.interface';
import { ExportExcelModal } from '@/components/analytics/ExportExcelModal';
import { useGoalStore } from '@/store/useGoalStore';
import { useTaskStore } from '@/store/useTaskStore';
import { cn } from '@/utils/cn';
import { 
  isSoundEnabled, 
  setSoundEnabled, 
  isHapticsEnabled, 
  setHapticsEnabled,
  playTaskCompleteSound,
  playLevelUpSound,
  playFrogFocusSound,
  playEveningChimeSound,
  triggerHaptic
} from '@/utils/soundEffects';

import { API_BASE } from '@/config/api';

const getUserId = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').id;
  } catch {
    return null;
  }
};

export function SettingsPage() {
  const { goals } = useGoalStore();
  const { tasks } = useTaskStore();
  const [isExcelModalOpen, setIsExcelModalOpen] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [soundActive, setSoundActive] = React.useState(isSoundEnabled());
  const [hapticsActive, setHapticsActive] = React.useState(isHapticsEnabled());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) {
      playTaskCompleteSound();
    }
  };

  const handleToggleHaptics = () => {
    const next = !hapticsActive;
    setHapticsActive(next);
    setHapticsEnabled(next);
    if (next) {
      triggerHaptic('medium');
    }
  };

  const handleExport = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        alert('Пожалуйста, войдите в систему для экспорта данных');
        return;
      }

      const res = await fetch(`${API_BASE}/backup`, {
        headers: { 'X-User-Id': userId }
      });
      if (!res.ok) throw new Error('Ошибка получения бэкапа');
      
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goal-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      alert('Ошибка при экспорте данных');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as IBackupData;
      
      // Валидация структуры
      if (!data.goals || !data.tasks) {
        throw new Error('Неверный формат файла');
      }

      if (window.confirm('Это действие заменит все текущие цели и задачи в базе данных. Продолжить?')) {
        const userId = getUserId();
        if (!userId) {
          alert('Пожалуйста, войдите в систему');
          return;
        }

        const res = await fetch(`${API_BASE}/backup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Ошибка восстановления бэкапа');
        }

        alert('Данные успешно импортированы!');
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Import failed', err);
      alert(err.message || 'Ошибка при импорте: неверный формат файла');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Вы уверены? Все ваши цели и задачи в базе данных будут удалены безвозвратно.')) {
      try {
        const userId = getUserId();
        if (userId) {
          await fetch(`${API_BASE}/user/data`, {
            method: 'DELETE',
            headers: { 'X-User-Id': userId },
          });
        }
        localStorage.removeItem('hasSeenOnboarding');
        alert('Данные успешно очищены.');
        window.location.reload();
      } catch (err) {
        console.error('Clear failed', err);
        alert('Ошибка при очистке данных');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-28 md:pb-6">
      <header className="mb-6 sm:mb-8">
        {/* <-- ДОБАВЛЕНО: dark:text-white для главного заголовка */}
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Настройки и Данные</h1>
        {/* <-- ДОБАВЛЕНО: dark:text-slate-400 для подзаголовка */}
        <p className="text-slate-500 mt-1 dark:text-slate-400">Управление резервными копиями и конфигурацией</p>
      </header>

      <section className="space-y-6">
        {/* Блок Резервного копирования */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          {/* <-- ДОБАВЛЕНО: dark:text-slate-200 для заголовка секции */}
          <h2 className="text-lg font-semibold text-slate-900 mb-4 dark:text-slate-200">Резервное копирование</h2>
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setIsExcelModalOpen(true)}
              className="gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Выгрузить данные в Excel (.xlsx)
            </Button>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleExport} variant="outline" className="gap-2 flex-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                <Download className="h-4 w-4" />
                Скачать бэкап (JSON)
              </Button>
              
              <Button 
                onClick={handleImportClick} 
                variant="outline" 
                className="gap-2 flex-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                isLoading={isImporting}
              >
                <Upload className="h-4 w-4" />
                Восстановить из файла
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>
          {/* <-- ДОБАВЛЕНО: dark:text-slate-400 для описания */}
          <p className="text-xs text-slate-500 mt-3 dark:text-slate-400">
            Экспортируйте данные в Excel для удобной аналитики или сохраняйте JSON-бэкапы, чтобы не потерять прогресс.
          </p>
        </div>

        {/* Блок Звуков и Тактильного отклика */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200">
              Звуки и вибрация
            </h2>
          </div>

          <div className="space-y-4">
            {/* Тумблер звука */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-3 pr-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  {soundActive ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-slate-400" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Звуковые эффекты</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Приятные щелчки чекбоксов, аккорды победы и звуки ритуалов
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  soundActive ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                )}
                role="switch"
                aria-checked={soundActive}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    soundActive ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Тумблер вибрации */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-3 pr-2">
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Тактильный отклик (вибрация)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Мягкий виброотклик на смартфонах при нажатии чекбоксов и победах
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleHaptics}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  hapticsActive ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-600"
                )}
                role="switch"
                aria-checked={hapticsActive}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    hapticsActive ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Кнопки проверки эффектов */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Прослушать звуки:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playTaskCompleteSound();
                    triggerHaptic('light');
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm text-center"
                >
                  ✓ Щелчок Pop
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playFrogFocusSound();
                    triggerHaptic('medium');
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm text-center"
                >
                  🐸 Лягушка дня
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playLevelUpSound();
                    triggerHaptic('success');
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm text-center"
                >
                  🏆 Новый уровень
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playEveningChimeSound();
                    triggerHaptic('light');
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm text-center"
                >
                  🌙 Вечерний звон
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Блок Опасной зоны */}
        <div className="bg-red-50 rounded-xl border border-red-100 p-6 dark:bg-red-900/10 dark:border-red-900/30">
          <h2 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
            Опасная зона
          </h2>
          {/* <-- ДОБАВЛЕНО: dark:text-red-300/80 для предупреждения */}
          <p className="text-sm text-red-700 mb-4 dark:text-red-300/80">
            Эти действия необратимы. Будьте осторожны.
          </p>
          
          <Button 
            onClick={handleClearData} 
            variant="danger" 
            size="sm"
            className="gap-2 dark:bg-red-800 dark:hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Очистить все данные приложения
          </Button>
        </div>

        {/* Информация о версии */}
        <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-700">
          {/* <-- ДОБАВЛЕНО: dark:text-slate-500 для текста версии */}
          <p className="text-sm text-slate-400 dark:text-slate-500">Goal & Action Tracker v0.1.0</p>
          <p className="text-xs text-slate-300 mt-1 dark:text-slate-600">Built with React 19 & Vite</p>
        </div>
      </section>

      <ExportExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        goals={goals}
        tasks={tasks}
      />
    </div>
  );
}