import * as React from 'react';
import { getStorageAdapter } from '@/services/storage/repository.factory';
import { Button } from '@/components/common/Button';
import { Download, Upload, RefreshCw, AlertTriangle } from 'lucide-react';
import type { IBackupData } from '@/services/storage/storage.interface';

export function SettingsPage() {
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const adapter = getStorageAdapter();
      const data = await adapter.exportAll();
      
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
      
      // Простая валидация структуры
      if (!data.goals || !data.tasks || !data.categories) {
        throw new Error('Неверный формат файла');
      }

      if (window.confirm('Это действие заменит все текущие данные. Продолжить?')) {
        const adapter = getStorageAdapter();
        await adapter.importAll(data);
        window.location.reload(); // Перезагрузка для применения новых данных
      }
    } catch (err) {
      console.error('Import failed', err);
      alert('Ошибка при импорте: неверный формат файла');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearData = () => {
    if (window.confirm('Вы уверены? Все данные будут удалены безвозвратно.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 pb-24 md:pb-6">
      <header className="mb-8">
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
          
          <div className="flex flex-col sm:flex-row gap-4">
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
          {/* <-- ДОБАВЛЕНО: dark:text-slate-400 для описания */}
          <p className="text-xs text-slate-500 mt-3 dark:text-slate-400">
            Экспортируйте данные регулярно, чтобы не потерять прогресс при смене устройства.
          </p>
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
    </div>
  );
}