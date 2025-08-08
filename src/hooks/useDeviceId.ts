'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import { api } from '@/services/api';
import type { SessionWithToken } from '@/types/session';

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const registrationAttempted = useRef<Set<string>>(new Set());

  // Use localStorage to persist registration state across reloads
  const getRegistrationKey = (userId: string, deviceId: string) => `device_registered_${userId}_${deviceId}`;

  const registerDevice = useCallback(async (deviceId: string) => {
    if (!typedSession?.accessToken) return;

    const isLegacyUser = typedSession.user.id === 'public' || typedSession.user.id === 'backoffice' || isNaN(Number(typedSession.user.id));
    if (isLegacyUser) return;

    const registrationKey = getRegistrationKey(typedSession.user.id, deviceId);
    
    // Check if already registered in localStorage
    if (localStorage.getItem(registrationKey) === 'true') {
      return;
    }

    // Check if registration is already in progress for this session
    const sessionKey = `${typedSession.user.id}_${deviceId}`;
    if (registrationAttempted.current.has(sessionKey)) {
      return;
    }

    // Mark as attempted to prevent duplicate calls
    registrationAttempted.current.add(sessionKey);

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
      // Remove from attempted set on failure so it can retry
      registrationAttempted.current.delete(sessionKey);
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