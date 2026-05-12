import React, { createContext, useContext, type ReactNode } from 'react';
import { useGetActiveCycleQuery } from '../services/kpiApi';

interface ActiveCycleContextType {
  activeCycleId: number | null;
  activeCycleName: string | null;
  isLoading: boolean;
}

const ActiveCycleContext = createContext<ActiveCycleContextType | undefined>(undefined);

export const ActiveCycleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: cycleResponse, isLoading } = useGetActiveCycleQuery();

  const data = cycleResponse?.data || (cycleResponse as any);
  const activeCycleId = data?.cycleId || data?.id || null;
  const activeCycleName = data?.cycleName || data?.name || null;

  return (
    <ActiveCycleContext.Provider value={{ activeCycleId, activeCycleName, isLoading }}>
      {children}
    </ActiveCycleContext.Provider>
  );
};

export const useActiveCycle = () => {
  const context = useContext(ActiveCycleContext);
  if (context === undefined) {
    throw new Error('useActiveCycle must be used within an ActiveCycleProvider');
  }
  return context;
};
