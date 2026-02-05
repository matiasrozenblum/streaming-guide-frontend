'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import { api } from '@/services/api';
import type { SessionWithToken } from '@/types/session';
import { v4 as uuidv4 } from 'uuid';

// Global device registration state to prevent multiple registrations across components
const globalDeviceRegistrationState = new Map<string, boolean>();

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const registrationAttempted = useRef<Set<string>>(new Set());
  const isRegistering = useRef(false);

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

    // Check global registration state
    if (globalDeviceRegistrationState.get(registrationKey)) {
      return;
    }

    // Check if registration is already in progress globally
    if (isRegistering.current) {
      return;
    }

    // Check if registration is already in progress for this session
    const sessionKey = `${typedSession.user.id}_${deviceId}`;
    if (registrationAttempted.current.has(sessionKey)) {
      return;
    }

    // Mark as attempting to prevent duplicate calls
    isRegistering.current = true;
    globalDeviceRegistrationState.set(registrationKey, true);
    registrationAttempted.current.add(sessionKey);

    try {
      // First check if device already exists (backend might have created it during signup)
      try {
        const checkResponse = await api.get('/subscriptions/device', {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        });

        // If device exists, mark as registered
        if (checkResponse.data && checkResponse.data.deviceId) {
          localStorage.setItem(registrationKey, 'true');
          console.log('✅ [useDeviceId] Device already exists, marked as registered');
          return;
        }
      } catch {
        // Device doesn't exist, proceed with creation
        console.log('📱 [useDeviceId] Device not found, proceeding with creation');
      }

      // Create the device
      await api.post('/subscriptions/device',
        { deviceId },
        {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }
      );
      localStorage.setItem(registrationKey, 'true');
      console.log('✅ [useDeviceId] Device registered successfully');
    } catch (error) {
      console.error('❌ [useDeviceId] Failed to register device:', error);
      // Remove from attempted set on failure so it can retry
      registrationAttempted.current.delete(sessionKey);
      globalDeviceRegistrationState.delete(registrationKey);
    } finally {
      isRegistering.current = false;
    }
  }, [typedSession?.accessToken, typedSession?.user?.id]);

  useEffect(() => {


    let id = localStorage.getItem('device_id');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('device_id', id);
    }
    setDeviceId(id);

    // Only register device if we have a valid session and haven't attempted yet
    if (typedSession?.accessToken && id && typedSession.user.id && !isNaN(Number(typedSession.user.id))) {
      const registrationKey = getRegistrationKey(typedSession.user.id, id);
      const alreadyRegistered = localStorage.getItem(registrationKey) === 'true';

      if (!alreadyRegistered && !isRegistering.current && !globalDeviceRegistrationState.get(registrationKey)) {
        // Add a small delay to allow backend device creation to complete first
        // This prevents race conditions during signup
        const timeoutId = setTimeout(() => {
          registerDevice(id);
        }, 1000); // 1 second delay

        return () => clearTimeout(timeoutId);
      }
    }
  }, [typedSession?.accessToken, typedSession?.user?.id, deviceId, registerDevice]);

  return deviceId;
}