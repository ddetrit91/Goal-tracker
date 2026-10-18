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
import { useEventStore } from '@/store/useEventStore';
import { GOAL_GUIDES } from '@/data/guidesData';
import { getGamificationStats } from '@/utils/gamification';
import { checkAndNotifyUpcomingEvents } from '@/utils/eventNotifications';

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
  const fetchEvents = useEventStore((state) => state.fetchEvents);
  const goals = useGoalStore((state) => state.goals);
  const tasks = useTaskStore((state) => state.tasks);
  const events = useEventStore((state) => state.events);
  
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const user = localStorage.getItem('user');
    // Загружаем данные только если пользователь авторизован И мы НЕ на странице входа
    if (user && !isAuthPage) {
      fetchGoals();
      fetchTasks();
      fetchCategories();
      fetchEvents();
    }

    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      setToastMessage(customEvent.detail?.message || 'Успешно!');
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, [fetchGoals, fetchTasks, fetchCategories, fetchEvents, isAuthPage]);

  // Проверка и отправка системных уведомлений о предстоящих событиях (за 2 дня и сегодня)
  React.useEffect(() => {
    if (events && events.length > 0) {
      checkAndNotifyUpcomingEvents(events);
    }
  }, [events]);

  // Отслеживание разблокировки новых гайдов для всплывающего уведомления на любой странице
  React.useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || isAuthPage) return;

    // Ждем загрузки данных
    if (goals.length === 0 && tasks.length === 0) return;

    try {
      const parsedUser = JSON.parse(user);
      const userKey = parsedUser?.id || parsedUser?.email || 'user';
      const storageKey = `unlocked_guides_known_${userKey}`;

      const stats = getGamificationStats(goals, tasks);
      const unlockedAchievementIds = new Set(
        stats.achievements.filter((a) => a.isUnlocked).map((a) => a.id)
      );

      const currentUnlocked = GOAL_GUIDES.filter((guide) => {
        const { minLevel, achievementId } = guide.unlockCondition;
        const isLevelSufficient = minLevel === undefined || stats.level >= minLevel;
        const isAchievementEarned = !achievementId || unlockedAchievementIds.has(achievementId);
        return isLevelSufficient && isAchievementEarned;
      });

      const currentUnlockedIds = currentUnlocked.map((g) => g.id);
      const knownRaw = localStorage.getItem(storageKey);

      if (!knownRaw) {
        // Первый запуск для пользователя: фиксируем базовый уровень без всплывающего спама
        localStorage.setItem(storageKey, JSON.stringify(currentUnlockedIds));
        return;
      }

      const knownIds: string[] = JSON.parse(knownRaw);
      const newlyUnlocked = currentUnlocked.filter((g) => !knownIds.includes(g.id));

      if (newlyUnlocked.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(currentUnlockedIds));
        newlyUnlocked.forEach((guide, idx) => {
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent('show-toast', {
                detail: {
                  message: `🎉 Разблокирован новый гайд: «${guide.title}»! Изучите в разделе «Обзор → Гайды»`,
                },
              })
            );
          }, idx * 3200);
        });
      }
    } catch (e) {
      console.error('Error tracking guide unlocks:', e);
    }
  }, [goals, tasks, isAuthPage]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      {/* УСЛОВНЫЙ РЕНДЕРИНГ: Показываем Navbar только если это НЕ страница авторизации */}
      {!isAuthPage && <Navbar />}
      
      {/* УСЛОВНЫЙ ОТСТУП: Учитываем мобильный верхний хедер (включая safe-area на iOS) и нижнюю панель навигации */}
      <main className={!isAuthPage ? "w-full max-w-full overflow-x-hidden pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-24 md:pt-6 md:pb-6 md:pl-72" : "w-full max-w-full overflow-x-hidden"}>
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