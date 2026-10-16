// client/src/utils/excelExport.ts
import * as XLSX from 'xlsx';
import type { Goal } from '@/types/goal';
import type { Task } from '@/types/task';
import { SYSTEM_CATEGORY_MAP } from '@/types/category';

export interface ExcelExportFilter {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  includeGoals: boolean;
  includeTasks: boolean;
  statusFilter?: 'all' | 'active' | 'completed';
}

const PRIORITY_MAP: Record<string, string> = {
  critical: 'Критический',
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

const STATUS_MAP: Record<string, string> = {
  completed: 'Достигнута 🏆',
  in_progress: 'В процессе 🚀',
  backlog: 'Запланирована 📋',
};

const HORIZON_MAP: Record<string, string> = {
  daily: 'День',
  weekly: 'Неделя',
  monthly: 'Месяц',
  quarterly: 'Квартал',
  yearly: 'Год',
  vision: 'Видение (Мечта)',
};

export function exportToExcel(
  goals: Goal[],
  tasks: Task[],
  filter: ExcelExportFilter
) {
  const wb = XLSX.utils.book_new();

  const isDateInRange = (dateStr?: string | null) => {
    if (!filter.startDate && !filter.endDate) return true;
    if (!dateStr) return false;
    const itemDate = dateStr.slice(0, 10);
    if (filter.startDate && itemDate < filter.startDate) return false;
    if (filter.endDate && itemDate > filter.endDate) return false;
    return true;
  };

  // 1. Лист ЦЕЛЕЙ
  if (filter.includeGoals) {
    const filteredGoals = goals.filter((g) => {
      // Фильтр по статусу
      if (filter.statusFilter === 'completed' && g.status !== 'completed') return false;
      if (filter.statusFilter === 'active' && g.status === 'completed') return false;

      // Фильтр по дате: проверяем targetDate, completedAt, или createdAt
      if (filter.startDate || filter.endDate) {
        const hasDateMatch =
          isDateInRange(g.targetDate) ||
          isDateInRange(g.completedAt) ||
          isDateInRange(g.createdAt);
        if (!hasDateMatch) return false;
      }
      return true;
    });

    const goalsData = filteredGoals.map((g, idx) => ({
      '№': idx + 1,
      'Название цели': g.title,
      'Категория (Сфера)': SYSTEM_CATEGORY_MAP[g.category]?.label || g.category,
      'Приоритет': PRIORITY_MAP[g.priority] || g.priority,
      'Горизонт': HORIZON_MAP[g.horizon] || g.horizon,
      'Статус': STATUS_MAP[g.status] || g.status,
      'Прогресс (%)': `${g.progress ?? 0}%`,
      'Дедлайн': g.targetDate || '—',
      'Дата завершения': g.completedAt ? g.completedAt.slice(0, 10) : '—',
      'Дата создания': g.createdAt ? g.createdAt.slice(0, 10) : '—',
      'Бюджет / Стоимость': g.estimatedCost ? `${g.estimatedCost} ${g.currency || 'UZS'}` : '—',
      'Описание / Заметки': g.description || '—',
    }));

    const wsGoals = XLSX.utils.json_to_sheet(goalsData.length > 0 ? goalsData : [
      { 'Сообщение': 'Нет данных по выбранным фильтрам' }
    ]);

    // Устанавливаем ширину колонок
    wsGoals['!cols'] = [
      { wch: 5 },  // №
      { wch: 35 }, // Название
      { wch: 20 }, // Категория
      { wch: 15 }, // Приоритет
      { wch: 15 }, // Горизонт
      { wch: 18 }, // Статус
      { wch: 14 }, // Прогресс
      { wch: 14 }, // Дедлайн
      { wch: 16 }, // Дата завершения
      { wch: 16 }, // Дата создания
      { wch: 20 }, // Бюджет
      { wch: 45 }, // Описание
    ];

    XLSX.utils.book_append_sheet(wb, wsGoals, 'Цели');
  }

  // 2. Лист ЗАДАЧ
  if (filter.includeTasks) {
    const goalTitleMap = new Map<string, string>();
    goals.forEach((g) => goalTitleMap.set(g.id, g.title));

    const filteredTasks = tasks.filter((t) => {
      // Фильтр по статусу
      if (filter.statusFilter === 'completed' && !t.isCompleted) return false;
      if (filter.statusFilter === 'active' && t.isCompleted) return false;

      // Фильтр по дате: проверяем dueDate, completedAt, или createdAt
      if (filter.startDate || filter.endDate) {
        const hasDateMatch =
          isDateInRange(t.dueDate) ||
          isDateInRange(t.completedAt) ||
          isDateInRange(t.createdAt);
        if (!hasDateMatch) return false;
      }
      return true;
    });

    const tasksData = filteredTasks.map((t, idx) => ({
      '№': idx + 1,
      'Название задачи': t.title,
      'Связанная цель': (t.goalId && goalTitleMap.get(t.goalId)) || '—',
      'Статус': t.isCompleted ? 'Выполнена ✅' : 'В работе ⏳',
      'Приоритет': PRIORITY_MAP[t.priority] || t.priority,
      'Категория': t.category ? (SYSTEM_CATEGORY_MAP[t.category]?.label || t.category) : '—',
      'Срок (Дедлайн)': t.dueDate || '—',
      'Дата закрытия': t.completedAt ? t.completedAt.slice(0, 10) : '—',
      'Главный фокус': t.isDailyFocus ? 'Да ⭐' : 'Нет',
      'Дата создания': t.createdAt ? t.createdAt.slice(0, 10) : '—',
    }));

    const wsTasks = XLSX.utils.json_to_sheet(tasksData.length > 0 ? tasksData : [
      { 'Сообщение': 'Нет данных по выбранным фильтрам' }
    ]);

    wsTasks['!cols'] = [
      { wch: 5 },  // №
      { wch: 40 }, // Название задачи
      { wch: 30 }, // Связанная цель
      { wch: 16 }, // Статус
      { wch: 14 }, // Приоритет
      { wch: 18 }, // Категория
      { wch: 16 }, // Срок
      { wch: 16 }, // Дата закрытия
      { wch: 14 }, // Главный фокус
      { wch: 16 }, // Дата создания
    ];

    XLSX.utils.book_append_sheet(wb, wsTasks, 'Задачи');
  }

  // 3. Лист СВОДНОЙ АНАЛИТИКИ
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  const summaryData = [
    { 'Параметр': 'Дата формирования отчёта', 'Значение': new Date().toLocaleDateString('ru-RU') },
    { 'Параметр': 'Период выборки', 'Значение': (filter.startDate || filter.endDate) ? `${filter.startDate || 'начало'} — ${filter.endDate || 'наст. время'}` : 'За всё время' },
    { 'Параметр': 'Фильтр статуса', 'Значение': filter.statusFilter === 'completed' ? 'Только выполненные' : filter.statusFilter === 'active' ? 'Только активные' : 'Все статусы' },
    { 'Параметр': 'Всего целей в системе', 'Значение': totalGoals },
    { 'Параметр': 'Достигнуто целей', 'Значение': completedGoals },
    { 'Параметр': 'Общая конверсия целей (%)', 'Значение': totalGoals > 0 ? `${Math.round((completedGoals / totalGoals) * 100)}%` : '0%' },
    { 'Параметр': 'Всего задач в системе', 'Значение': totalTasks },
    { 'Параметр': 'Закрыто задач', 'Значение': completedTasks },
    { 'Параметр': 'Эффективность задач (%)', 'Значение': totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%' },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводная аналитика');

  // Скачивание файла
  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `GoalTracker_Analytics_${todayStr}.xlsx`);
}
