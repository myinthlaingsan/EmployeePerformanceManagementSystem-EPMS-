import React, { createContext, useContext, ReactNode } from 'react';
import { useGetActiveCycleQuery } from '../features/kpi/kpiApi';

interface ActiveCycleContextType {
  activeCycleId: number;
  activeCycleName: string;
  isLoading: boolean;
}

const ActiveCycleContext = createContext<ActiveCycleContextType | undefined>(undefined);

export const ActiveCycleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: cycleResponse, isLoading } = useGetActiveCycleQuery();
  
  // Default to 1 if no active cycle is found (backward compatibility)
  const activeCycleId = cycleResponse?.data?.cycleId || 1;
  const activeCycleName = cycleResponse?.data?.cycleName || 'Current Appraisal Cycle';

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
