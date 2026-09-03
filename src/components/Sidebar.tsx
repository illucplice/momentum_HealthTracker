import { LayoutDashboard, Calendar, ListChecks, Repeat, BarChart3, History, Settings, Flame } from 'lucide-react';
import { useNav, type Page } from '@/store/NavContext';

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'today', label: 'Today', icon: ListChecks },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'habits', label: 'Habits', icon: Flame },
  { id: 'routines', label: 'Routines', icon: Repeat },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'history', label: 'History', icon: History },
];

export function Sidebar() {
  const { page, setPage } = useNav();

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen border-r border-subtle bg-surface flex-shrink-0">
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Flame size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Momentum</h1>
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Habit Tracker</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-hover'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-subtle space-y-0.5">
        <button
          onClick={() => setPage('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            page === 'settings' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-hover'
          }`}
        >
          <Settings size={18} />
          Settings
        </button>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">My Account</p>
            <p className="text-xs text-zinc-500">Local profile</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

const MOBILE_NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  ...NAV_ITEMS,
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  const { page, setPage } = useNav();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-subtle">
      <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
        {MOBILE_NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                active ? 'text-indigo-400' : 'text-zinc-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
