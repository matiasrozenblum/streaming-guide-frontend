'use client';

import { useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import { useLiveStatus } from '@/contexts/LiveStatusContext';
import { api } from '@/services/api';
import type { ChannelWithSchedules } from '@/types/channel';

export default function SmartLiveStatusPoller({ deviceId }: { deviceId: string }) {
  const { setLiveStatuses } = useLiveStatus();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const schedulesRef = useRef<ChannelWithSchedules[]>([]);

  const updateLiveStatuses = useCallback(async () => {
    try {
      const params: { live_status: boolean; deviceId?: string } = { live_status: true };
      if (deviceId) {
        params.deviceId = deviceId;
      }

      const resp = await api.get<ChannelWithSchedules[]>('/channels/with-schedules/week', {
        params
      });

      const weekData = resp.data;
      const liveMap: Record<string, { is_live: boolean; stream_url: string | null }> = {};
      weekData.forEach(ch =>
        ch.schedules.forEach(sch => {
          liveMap[sch.id.toString()] = {
            is_live: sch.program.is_live,
            stream_url: sch.program.stream_url,
          };
        })
      );

      setLiveStatuses(liveMap);
      schedulesRef.current = Array.isArray(weekData) ? weekData : [];
    } catch {
      // ignore
    }
  }, [deviceId, setLiveStatuses]);

  const getNextProgramStartTime = useCallback(() => {
    const now = dayjs();
    const today = now.format('dddd').toLowerCase();
    
    // Find the next program that starts within the next 10 minutes
    for (const channel of schedulesRef.current) {
      for (const schedule of channel.schedules) {
        if (schedule.day_of_week.toLowerCase() === today) {
          const [hours, minutes] = schedule.start_time.split(':').map(Number);
          const programStart = now.hour(hours).minute(minutes).second(0);
          const timeUntilStart = programStart.diff(now, 'minute');
          
          if (timeUntilStart >= 0 && timeUntilStart <= 10) {
            return programStart;
          }
        }
      }
    }
    return null;
  }, []);

  const adjustPollingInterval = useCallback(() => {
    const nextProgram = getNextProgramStartTime();
    
    if (nextProgram) {
      // If a program starts within 10 minutes, poll every 30 seconds
      const newInterval = 30_000;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        updateLiveStatuses();
        adjustPollingInterval(); // Re-evaluate after each update
      }, newInterval);
    } else {
      // Default polling every 5 minutes
      const newInterval = 300_000;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        updateLiveStatuses();
        adjustPollingInterval(); // Re-evaluate after each update
      }, newInterval);
    }
  }, [getNextProgramStartTime, updateLiveStatuses]);

  useEffect(() => {
    if (!deviceId) return;

    // Initial update
    updateLiveStatuses().then(() => {
      // Start smart polling after initial data load
      adjustPollingInterval();
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [deviceId, updateLiveStatuses, adjustPollingInterval]);

  return null;
} 