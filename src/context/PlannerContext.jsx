import { createContext, useContext } from 'react';

// The shared space for planner data. The provider lives in PlannerProvider.jsx.
export const PlannerContext = createContext(null);

// Lets any component inside <PlannerProvider> read and change planner data.
export function usePlanner() {
  const context = useContext(PlannerContext);

  if (context === null) {
    throw new Error('usePlanner() must be used inside <PlannerProvider>.');
  }

  return context;
}