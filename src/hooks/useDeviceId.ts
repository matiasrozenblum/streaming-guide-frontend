'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import { api } from '@/services/api';
import type { SessionWithToken } from '@/types/session';

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;

  // Use localStorage to persist registration state across reloads
  const getRegistrationKey = (userId: string, deviceId: string) => `device_registered_${userId}_${deviceId}`;

  const registerDevice = useCallback(async (deviceId: string) => {
    if (!typedSession?.accessToken) return;

    const isLegacyUser = typedSession.user.id === 'public' || typedSession.user.id === 'backoffice' || isNaN(Number(typedSession.user.id));
    if (isLegacyUser) return;

    const registrationKey = getRegistrationKey(typedSession.user.id, deviceId);
    if (localStorage.getItem(registrationKey) === 'true') {
      return;
    }

    try {
      await api.post('/subscriptions/device', 
        { deviceId },
        {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }
      );
      localStorage.setItem(registrationKey, 'true');
    } catch (error) {
      console.error('❌ [useDeviceId] Failed to register device:', error);
    }
  }, [typedSession?.accessToken, typedSession?.user?.id]);

  useEffect(() => {
    let id = localStorage.getItem('device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('device_id', id);
    }
    setDeviceId(id);

    if (typedSession?.accessToken && id) {
      registerDevice(id);
    }
  }, [typedSession?.accessToken, typedSession?.user?.id, registerDevice]);

  return deviceId;
}