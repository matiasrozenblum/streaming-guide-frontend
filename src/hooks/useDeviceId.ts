'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import { api } from '@/services/api';
import type { SessionWithToken } from '@/types/session';

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const registeredRef = useRef<string | null>(null);

  const registerDevice = useCallback(async (deviceId: string) => {

    if (!typedSession?.accessToken) {
      return;
    }
    
    // Only register devices for real users (with numeric IDs), not legacy users
    const isLegacyUser = typedSession.user.id === 'public' || typedSession.user.id === 'backoffice' || isNaN(Number(typedSession.user.id));
    if (isLegacyUser) {
      return;
    }

    // Prevent duplicate registrations for the same device/user combination
    const registrationKey = `${typedSession.user.id}-${deviceId}`;
    if (registeredRef.current === registrationKey) {
      return;
    }
    
    
    try {
      await api.post('/subscriptions/device', 
        { deviceId },
        {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }
      );
      registeredRef.current = registrationKey;
    } catch (error) {
      console.error('❌ [useDeviceId] Failed to register device:', error);
    }
  }, [typedSession?.accessToken, typedSession?.user?.id, typedSession?.user?.role]);

  useEffect(() => {

    let id = localStorage.getItem('device_id');
    if (!id) {
      // crypto.randomUUID() funciona en navegadores modernos
      id = crypto.randomUUID();
      localStorage.setItem('device_id', id);
    } else {
    }
    setDeviceId(id);

    // Register device when user is authenticated (this has correct browser user-agent)
    if (typedSession?.accessToken && id) {
      registerDevice(id);
    }
  }, [typedSession?.accessToken, typedSession?.user?.id, typedSession?.user?.role, registerDevice]);

  return deviceId;
}