// client/src/App.tsx
import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'; // <-- ДОБАВЛЕН useLocation
import { Navbar } from '@/components/layout/Navbar';
import { TodayPage } from '@/pages/TodayPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { VisionBoardPage } from '@/pages/VisionBoardPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AdminPage } from '@/pages/AdminPage';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { Toast } from '@/components/common/Toast';
import { GoalCelebrationModal } from '@/components/goals/GoalCelebrationModal';
import { ProgressReminderBanner } from '@/components/common/ProgressReminderBanner';
import { useGoalStore } from '@/store/useGoalStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useCategoryStore } from '@/store/useCategoryStore';

// Компонент-защитник маршрутов
function ProtectedRoute() {
  const user = localStorage.getItem('user');
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AppContent() {
  const location = useLocation(); // <-- ПОЛУЧАЕМ ТЕКУЩИЙ ПУТЬ
  
  // Проверяем, находимся ли мы на странице авторизации или регистрации
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const fetchGoals = useGoalStore((state) => state.fetchGoals);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const user = localStorage.getItem('user');
    // Загружаем данные только если пользователь авторизован И мы НЕ на странице входа
    if (user && !isAuthPage) {
      fetchGoals();
      fetchTasks();
      fetchCategories();
    }

    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      setToastMessage(customEvent.detail?.message || 'Успешно!');
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, [fetchGoals, fetchTasks, fetchCategories, isAuthPage]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      {/* УСЛОВНЫЙ РЕНДЕРИНГ: Показываем Navbar только если это НЕ страница авторизации */}
      {!isAuthPage && <Navbar />}
      
      {/* УСЛОВНЫЙ ОТСТУП: Учитываем мобильный верхний хедер (включая safe-area на iOS) и нижнюю панель навигации */}
      <main className={!isAuthPage ? "pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-24 md:pt-6 md:pb-6 md:pl-72" : ""}>
        {!isAuthPage && Boolean(localStorage.getItem('user')) && <OnboardingTour />}
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Защищенные маршруты */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/vision-board" element={<VisionBoardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </main>

      <Toast 
        message={toastMessage || ''} 
        isVisible={!!toastMessage} 
        onClose={() => setToastMessage(null)} 
      />

      <GoalCelebrationModal />
      <ProgressReminderBanner />
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