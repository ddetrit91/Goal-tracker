// client/src/components/analytics/GuideDetailModal.tsx
import * as React from 'react';
import type { GoalGuide } from '@/data/guidesData';
import { 
  X, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  Lightbulb, 
  CheckSquare, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuideDetailModalProps {
  guide: GoalGuide | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GuideDetailModal({ guide, isOpen, onClose }: GuideDetailModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'steps' | 'application' | 'checklist'>('steps');
  const [checkedItems, setCheckedItems] = React.useState<Record<string, boolean>>({});

  // Сброс состояния при смене гайда
  React.useEffect(() => {
    setActiveTab('steps');
    setCheckedItems({});
  }, [guide?.id]);

  // Закрытие по клавише Esc
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !guide) return null;

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAction = () => {
    if (guide.content.quickActionUrl) {
      onClose();
      navigate(guide.content.quickActionUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* ХЕДЕР С ГРАДИЕНТОМ И ИКОНКОЙ */}
        <div className={`p-6 pb-4 bg-gradient-to-br ${guide.bgGradient} border-b border-slate-100 dark:border-slate-800 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            title="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md ring-2 ring-white dark:ring-slate-800 shrink-0"
              style={{ backgroundColor: `${guide.color}20`, borderColor: guide.color }}
            >
              {guide.icon}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: guide.color }}
                >
                  {guide.categoryLabel}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {guide.readTime}
                </span>
                {guide.author && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                    • {guide.author}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {guide.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                {guide.subtitle}
              </p>
            </div>
          </div>

          {/* ВКЛАДКИ НАВИГАЦИИ ПО ГАЙДУ */}
          <div className="grid grid-cols-3 gap-1 mt-5 pt-1 w-full">
            {[
              { id: 'steps', label: 'Пошаговый метод', shortLabel: 'Метод', icon: BookOpen },
              { id: 'application', label: 'Как применять в трекере', shortLabel: 'В трекере', icon: Lightbulb },
              { id: 'checklist', label: 'Чек-лист & Совет', shortLabel: 'Чек-лист', icon: CheckSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center truncate ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline truncate">{tab.label}</span>
                  <span className="sm:hidden truncate">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ТЕЛО МОДАЛЬНОГО ОКНА С ПРОКРУТКОЙ */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200 flex-1">
          {/* ГЛАВНАЯ ИДЕЯ И НАУЧНОЕ ОБОСНОВАНИЕ */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/40 space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Суть методики</span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
              {guide.content.coreIdea}
            </p>
            <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <span><strong>Почему это работает:</strong> {guide.content.whyItWorks}</span>
            </div>
          </div>

          {/* ВКЛАДКА 1: ПОШАГОВЫЙ МЕТОД */}
          {activeTab === 'steps' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Алгоритм действий
              </h3>

              <div className="space-y-2.5">
                {guide.content.steps.map((step, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <div 
                      className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: guide.color }}
                    >
                      {step.number}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ПРИМЕР: КАК НАДО VS КАК НЕ НАДО */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 dark:bg-rose-950/25 dark:border-rose-900/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 mb-1.5">
                    <AlertCircle className="h-4 w-4" />
                    <span>Как НЕ надо:</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                    {guide.content.example.bad}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-950/25 dark:border-emerald-900/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Как НАДО:</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {guide.content.example.good}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 2: ПРИМЕНЕНИЕ В ТРЕКЕРЕ */}
          {activeTab === 'application' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <Lightbulb className="h-4 w-4" />
                  <span>Инструкция по использованию в трекере целей</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {guide.content.appApplication}
                </p>
              </div>

              {guide.content.quickActionUrl && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Готовы применить технику на практике?
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Закрепите новые знания действием прямо сейчас
                    </p>
                  </div>
                  <button
                    onClick={handleAction}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all transform active:scale-95 whitespace-nowrap"
                    style={{ backgroundColor: guide.color }}
                  >
                    <span>{guide.content.quickActionText || 'Перейти к действиям'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ВКЛАДКА 3: ЧЕК-ЛИСТ & ЛАЙФХАК */}
          {activeTab === 'checklist' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Контрольный чек-лист методики
              </h3>

              <div className="space-y-2">
                {guide.content.checklist.map((item, idx) => {
                  const isChecked = !!checkedItems[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheck(idx)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700/40'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                        isChecked 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                      }`}>
                        {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                      <span className={`text-xs font-medium ${
                        isChecked 
                          ? 'line-through text-emerald-800 dark:text-emerald-300' 
                          : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ЗОЛОТОЙ ЛАЙФХАК */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
                  <span>💡 Секретный совет мастеров</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 italic font-medium leading-relaxed">
                  «{guide.content.proTip}»
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ФУТЕР */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {guide.badge}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
          >
            Закрыть гайд
          </button>
        </div>
      </div>
    </div>
  );
}
