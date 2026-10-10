import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { TodayPage } from '@/pages/TodayPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { VisionBoardPage } from '@/pages/VisionBoardPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { Toast } from '@/components/common/Toast'; // <-- ДОБАВЛЕН ИМПОРТ
import { useGoalStore } from '@/store/useGoalStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useCategoryStore } from '@/store/useCategoryStore';

function AppContent() {
  const fetchGoals = useGoalStore((state) => state.fetchGoals);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  
  // Состояние для глобального тоста
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchGoals();
    fetchTasks();
    fetchCategories();

    // Слушаем кастомное событие для показа тоста из любого места
    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      setToastMessage(customEvent.detail?.message || 'Успешно!');
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, [fetchGoals, fetchTasks, fetchCategories]);

  return (
<div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:pl-72 relative transition-colors duration-300">
      <OnboardingTour />
      <Navbar />
      <main className="pt-6">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/vision-board" element={<VisionBoardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {/* Глобальный тост */}
      <Toast 
        message={toastMessage || ''} 
        isVisible={!!toastMessage} 
        onClose={() => setToastMessage(null)} 
      />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}