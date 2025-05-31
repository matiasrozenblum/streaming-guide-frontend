'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import dayjs from 'dayjs';

interface LiveStatus {
  [scheduleId: string]: {
    is_live: boolean;
    stream_url: string | null;
  };
}

interface LiveStatusContextType {
  liveStatus: LiveStatus;
  setLiveStatuses: (map: LiveStatus) => void;
}

const ctx = createContext<LiveStatusContextType>({
  liveStatus: {},
  setLiveStatuses: () => {},
});

export const useLiveStatus = () => useContext(ctx);

export const LiveStatusProvider: React.FC<{children:React.ReactNode}> = ({children}) => {
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({});
  const [currentHour, setCurrentHour] = useState(dayjs().hour());

  // Expuesto para inyectar batch desde HomeClient
  const setLiveStatuses = (map: LiveStatus) => {
    setLiveStatus(map);
  };

  // Solo reactuar a cambio de hora si quieres refrescar
  useEffect(() => {
    const id = setInterval(() => {
      const h = dayjs().hour();
      if (h !== currentHour) setCurrentHour(h);
    }, 60_000);
    return () => clearInterval(id);
  }, [currentHour]);

  return (
    <ctx.Provider value={{ liveStatus, setLiveStatuses }}>
      {children}
    </ctx.Provider>
  );
};