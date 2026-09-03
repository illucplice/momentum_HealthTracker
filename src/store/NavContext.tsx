import { createContext, useContext, useState, type ReactNode } from 'react';

export type Page = 'overview' | 'today' | 'calendar' | 'habits' | 'routines' | 'analytics' | 'history' | 'settings';

interface NavContextValue {
  page: Page;
  setPage: (p: Page) => void;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('overview');
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <NavContext.Provider value={{ page, setPage, selectedDate, setSelectedDate }}>
      {children}
    </NavContext.Provider>
  );
}
