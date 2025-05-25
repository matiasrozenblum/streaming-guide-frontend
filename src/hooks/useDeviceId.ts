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
    console.log('🔍 [useDeviceId] registerDevice called with:', { 
      deviceId, 
      hasAccessToken: !!typedSession?.accessToken,
      userId: typedSession?.user?.id,
      userRole: typedSession?.user?.role 
    });

    if (!typedSession?.accessToken) {
      console.log('⏭️ [useDeviceId] No access token, skipping registration');
      return;
    }
    
    // Only register devices for real users (with numeric IDs), not legacy users
    const isLegacyUser = typedSession.user.id === 'public' || typedSession.user.id === 'backoffice' || isNaN(Number(typedSession.user.id));
    if (isLegacyUser) {
      console.log('⏭️ [useDeviceId] Skipping device registration for legacy user:', typedSession.user.id);
      return;
    }

    // Prevent duplicate registrations for the same device/user combination
    const registrationKey = `${typedSession.user.id}-${deviceId}`;
    if (registeredRef.current === registrationKey) {
      console.log('⏭️ [useDeviceId] Device already registered for this user:', registrationKey);
      return;
    }
    
    console.log('📡 [useDeviceId] Attempting to register device with backend:', { registrationKey });
    
    try {
      await api.post('/subscriptions/device', 
        { deviceId },
        {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }
      );
      registeredRef.current = registrationKey;
      console.log('✅ [useDeviceId] Device registered with backend:', deviceId);
    } catch (error) {
      console.error('❌ [useDeviceId] Failed to register device:', error);
    }
  }, [typedSession?.accessToken, typedSession?.user?.id, typedSession?.user?.role]);

  useEffect(() => {
    console.log('🔄 [useDeviceId] useEffect triggered, session state:', {
      hasAccessToken: !!typedSession?.accessToken,
      userId: typedSession?.user?.id,
      userRole: typedSession?.user?.role
    });

    let id = localStorage.getItem('device_id');
    if (!id) {
      // crypto.randomUUID() funciona en navegadores modernos
      id = crypto.randomUUID();
      localStorage.setItem('device_id', id);
      console.log('🆕 [useDeviceId] Generated new device ID:', id);
    } else {
      console.log('📱 [useDeviceId] Using existing device ID:', id);
    }
    setDeviceId(id);

    // Register device when user is authenticated (this has correct browser user-agent)
    if (typedSession?.accessToken && id) {
      console.log('🚀 [useDeviceId] User authenticated, registering device with correct user-agent');
      registerDevice(id);
    }
  }, [typedSession?.accessToken, typedSession?.user?.id, typedSession?.user?.role, registerDevice]);

  return deviceId;
}