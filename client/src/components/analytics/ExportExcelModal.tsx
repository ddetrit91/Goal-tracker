// client/src/components/analytics/ExportExcelModal.tsx
import * as React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FileSpreadsheet, Download } from 'lucide-react';
import { exportToExcel, type ExcelExportFilter } from '@/utils/excelExport';
import type { Goal } from '@/types/goal';
import type { Task } from '@/types/task';
import { format, startOfMonth, startOfYear } from 'date-fns';

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  tasks: Task[];
}

export function ExportExcelModal({ isOpen, onClose, goals, tasks }: ExportExcelModalProps) {
  const [datePreset, setDatePreset] = React.useState<'all' | 'month' | 'year' | 'custom'>('all');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [includeGoals, setIncludeGoals] = React.useState(true);
  const [includeTasks, setIncludeTasks] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'completed'>('all');
  const [isExporting, setIsExporting] = React.useState(false);

  // Обработка пресетов дат
  const handlePresetChange = (preset: 'all' | 'month' | 'year' | 'custom') => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'month') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setEndDate(todayStr);
    } else if (preset === 'year') {
      setStartDate(format(startOfYear(today), 'yyyy-MM-dd'));
      setEndDate(todayStr);
    }
  };

  const handleDownload = () => {
    if (!includeGoals && !includeTasks) {
      alert('Выберите хотя бы один тип данных (цели или задачи)');
      return;
    }

    setIsExporting(true);
    try {
      const filter: ExcelExportFilter = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        includeGoals,
        includeTasks,
        statusFilter,
      };

      exportToExcel(goals, tasks, filter);
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      alert('Ошибка при формировании Excel-отчёта');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Выгрузка данных в Excel (.xlsx)">
      <div className="space-y-5 py-1">
        {/* Описание */}
        <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-300 text-xs">
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Структурированный отчёт по ячейкам</p>
            <p className="text-emerald-800/80 dark:text-emerald-400/80">
              Создаётся полноценный файл Microsoft Excel с отдельными листами «Цели», «Задачи» и сводными показателями эффективности.
            </p>
          </div>
        </div>

        {/* Что выгружать */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Что включить в отчёт
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-emerald-500 transition-colors">
              <input
                type="checkbox"
                checked={includeGoals}
                onChange={(e) => setIncludeGoals(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                Цели ({goals.length})
              </span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-emerald-500 transition-colors">
              <input
                type="checkbox"
                checked={includeTasks}
                onChange={(e) => setIncludeTasks(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                Задачи ({tasks.length})
              </span>
            </label>
          </div>
        </div>

        {/* Фильтр по статусу */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Статус выполнения
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'all', label: 'Все записи' },
              { id: 'active', label: 'В процессе' },
              { id: 'completed', label: 'Только выполненные' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id as any)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                  statusFilter === item.id
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Период дат */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Период дат
          </label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { id: 'all', label: 'Всё время' },
              { id: 'month', label: 'Этот месяц' },
              { id: 'year', label: 'Этот год' },
              { id: 'custom', label: 'Свой период' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id as any)}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all text-center ${
                  datePreset === p.id
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {datePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">С даты</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">По дату</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <Button variant="ghost" onClick={onClose} type="button">
            Отмена
          </Button>
          <Button
            onClick={handleDownload}
            isLoading={isExporting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            type="button"
          >
            <Download className="h-4 w-4" />
            Скачать в Excel (.xlsx)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
