'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AppMode } from '@/lib/app-mode';

interface AppModeContextValue {
  mode: AppMode;
  setMode: (next: AppMode) => void;
}

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({
  initialMode,
  children,
}: {
  initialMode: AppMode;
  children: ReactNode;
}) {
  const [mode, setModeState] = useState<AppMode>(initialMode);
  const setMode = useCallback((next: AppMode) => setModeState(next), []);
  return (
    <AppModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode(): AppModeContextValue {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error('useAppMode must be used inside <AppModeProvider>');
  return ctx;
}
