import { useContext } from 'react';
import { AppContext, AppContextType } from './AppContextBase';

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

