import { DataProvider, useData } from '@/store/DataContext';
import { NavProvider, useNav } from '@/store/NavContext';
import { ConfirmProvider } from '@/components/Modal';
import { ToastContainer } from '@/components/Toast';
import { Sidebar, MobileNav } from '@/components/Sidebar';
import { OverviewPage } from '@/pages/OverviewPage';
import { TodayPage } from '@/pages/TodayPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { HabitsPage } from '@/pages/HabitsPage';
import { RoutinesPage } from '@/pages/RoutinesPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useHabitReminders } from '@/hooks/useHabitReminders';
import { Flame, Loader2 } from 'lucide-react';

function PageContent() {
  const { page } = useNav();
  switch (page) {
    case 'overview': return <OverviewPage />;
    case 'today': return <TodayPage />;
    case 'calendar': return <CalendarPage />;
    case 'habits': return <HabitsPage />;
    case 'routines': return <RoutinesPage />;
    case 'analytics': return <AnalyticsPage />;
    case 'history': return <HistoryPage />;
    case 'settings': return <SettingsPage />;
    default: return <OverviewPage />;
  }
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
        <Flame size={24} className="text-white" />
      </div>
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading Momentum...
      </div>
    </div>
  );
}

function AppShell() {
  const { loading, habits, records } = useData();
  useHabitReminders(habits, records);

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <PageContent />
      </main>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <NavProvider>
        <ConfirmProvider>
          <AppShell />
          <ToastContainer />
        </ConfirmProvider>
      </NavProvider>
    </DataProvider>
  );
}
