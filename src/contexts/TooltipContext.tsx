'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TooltipContextType {
  openTooltipId: string | null;
  openTooltip: (id: string) => void;
  closeTooltip: (id?: string) => void;
  isTooltipOpen: (id: string) => boolean;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

interface TooltipProviderProps {
  children: ReactNode;
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  const openTooltip = (id: string) => {
    setOpenTooltipId(id);
  };

  const closeTooltip = (id?: string) => {
    if (!id || id === openTooltipId) {
      setOpenTooltipId(null);
    }
  };

  const isTooltipOpen = (id: string) => {
    return openTooltipId === id;
  };

  // Close tooltip when clicking outside
  React.useEffect(() => {
    const handleGlobalClick = (event: MouseEvent | TouchEvent) => {
      // Close any open tooltip when clicking outside
      if (openTooltipId) {
        const target = event.target as Element;
        // Don't close if clicking on a tooltip or its content
        if (!target.closest('[role="tooltip"]') && !target.closest('.program-block')) {
          setOpenTooltipId(null);
        }
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('click', handleGlobalClick, true);
      document.addEventListener('touchstart', handleGlobalClick, true);
      
      return () => {
        document.removeEventListener('click', handleGlobalClick, true);
        document.removeEventListener('touchstart', handleGlobalClick, true);
      };
    }
  }, [openTooltipId]);

  return (
    <TooltipContext.Provider value={{
      openTooltipId,
      openTooltip,
      closeTooltip,
      isTooltipOpen,
    }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (context === undefined) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
}; 