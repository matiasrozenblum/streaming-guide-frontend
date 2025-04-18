import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';
import dayjs from 'dayjs';

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
    const fetchLiveStatus = async () => {
      try {
        const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
        const response = await api.get(`/schedules?day=${today}&live_status=true`);
        
        const newStatus: LiveStatus = {};
        response.data.forEach((schedule: ScheduleData) => {
          newStatus[schedule.id] = {
            is_live: schedule.program.is_live,
            stream_url: schedule.program.stream_url
          };
        });
        
        setLiveStatus(newStatus);
      } catch (err) {
        console.error('Error fetching live status:', err);
      }
    };

    fetchLiveStatus();
    const intervalId = setInterval(fetchLiveStatus, 10000);
    return () => clearInterval(intervalId);
  }, [currentHour]); // Add currentHour as a dependency

  return (
    <LiveStatusContext.Provider value={{ liveStatus, updateLiveStatus }}>
      {children}
    </LiveStatusContext.Provider>
  );
}; 