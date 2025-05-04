import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';
import dayjs from 'dayjs';
import { AuthService } from '@/services/auth';
import type { ChannelWithSchedules } from '@/types/channel';

interface LiveStatus {
  [scheduleId: string]: {
    is_live: boolean;
    stream_url: string | null;
  };
}

interface LiveStatusContextType {
  liveStatus: LiveStatus;
  updateLiveStatus: (
    scheduleId: string,
    status: { is_live: boolean; stream_url: string | null }
  ) => void;
}

const LiveStatusContext = createContext<LiveStatusContextType>({
  liveStatus: {},
  updateLiveStatus: () => {},
});

export const useLiveStatus = () => useContext(LiveStatusContext);

export const LiveStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({});
  const [currentHour, setCurrentHour] = useState(dayjs().hour());

  // Función para fetch -> unifica con /channels/with-schedules
  const fetchLiveStatus = async () => {
    try {
      const today = new Date()
        .toLocaleString('en-US', { weekday: 'long' })
        .toLowerCase();
      const token = AuthService.getCorrectToken(false);
      const { data } = await api.get<ChannelWithSchedules[]>(
        '/channels/with-schedules',
        {
          params: { day: today, live_status: true },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newStatus: LiveStatus = {};
      data.forEach((chEntry) => {
        chEntry.schedules.forEach((sch) => {
          newStatus[sch.id.toString()] = {
            is_live: sch.program.is_live,
            stream_url: sch.program.stream_url,
          };
        });
      });
      setLiveStatus(newStatus);
    } catch (e) {
      console.error('Error fetching live status:', e);
    }
  };

  // Refresca hora actual cada minuto (para disparar refetch)
  useEffect(() => {
    const id = setInterval(() => {
      const h = dayjs().hour();
      if (h !== currentHour) {
        setCurrentHour(h);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [currentHour]);

  // Polling de live-status condicionado a currentHour
  useEffect(() => {
    fetchLiveStatus();
    const id = setInterval(fetchLiveStatus, 60_000);
    return () => clearInterval(id);
  }, [currentHour]);

  const updateLiveStatus = (
    scheduleId: string,
    status: { is_live: boolean; stream_url: string | null }
  ) => {
    setLiveStatus((prev) => ({
      ...prev,
      [scheduleId]: status,
    }));
  };

  return (
    <LiveStatusContext.Provider value={{ liveStatus, updateLiveStatus }}>
      {children}
    </LiveStatusContext.Provider>
  );
};
