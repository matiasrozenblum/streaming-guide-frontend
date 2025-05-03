import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';
import dayjs from 'dayjs';
import { AuthService } from '@/services/auth';
interface LiveStatus {
  [scheduleId: string]: {
    is_live: boolean;
    stream_url: string | null;
  };
}

interface ScheduleData {
  id: string;
  program: {
    is_live: boolean;
    stream_url: string | null;
  };
}

interface LiveStatusContextType {
  liveStatus: LiveStatus;
  updateLiveStatus: (scheduleId: string, status: { is_live: boolean; stream_url: string | null }) => void;
}

const LiveStatusContext = createContext<LiveStatusContextType>({
  liveStatus: {},
  updateLiveStatus: () => {},
});

export const useLiveStatus = () => useContext(LiveStatusContext);

export const LiveStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({});
  const [currentHour, setCurrentHour] = useState(dayjs().hour());

  const updateLiveStatus = (scheduleId: string, status: { is_live: boolean; stream_url: string | null }) => {
    setLiveStatus(prev => ({
      ...prev,
      [scheduleId]: status
    }));
  };

  // Update current hour every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      const newHour = dayjs().hour();
      if (newHour !== currentHour) {
        setCurrentHour(newHour);
      }
    }, 60000);
    return () => clearInterval(intervalId);
  }, [currentHour]);

  // Fetch live status periodically and when hour changes
  useEffect(() => {
    let pollId: NodeJS.Timeout;

    const fetchLiveStatus = async () => {
      try {
        const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
        const token = AuthService.getCorrectToken(false);
        const { data } = await api.get<ScheduleData[]>(`/schedules?day=${today}&live_status=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newStatus: LiveStatus = {};
        data.forEach(sch => {
          newStatus[sch.id] = {
            is_live: sch.program.is_live,
            stream_url: sch.program.stream_url,
          };
        });
        setLiveStatus(newStatus);
      } catch (e) {
        console.error('Error fetching live status:', e);
      }
    };

    // Arranca polling
    const start = () => {
      fetchLiveStatus();
      pollId = setInterval(fetchLiveStatus, 60_000);
    };
    // Detiene polling
    const stop = () => {
      clearInterval(pollId);
    };

    // Si la pestaña está activa, arrancamos
    if (document.visibilityState === 'visible') start();
    // Escuchamos cambios de visibilidad
    const onVis = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    document.addEventListener('visibilitychange', onVis);

    // Cleanup
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [currentHour]);

  return (
    <LiveStatusContext.Provider value={{ liveStatus, updateLiveStatus }}>
      {children}
    </LiveStatusContext.Provider>
  );
}; 