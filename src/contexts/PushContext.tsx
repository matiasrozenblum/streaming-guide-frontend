'use client';

import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { urlBase64ToUint8Array } from '@/utils/push';

interface PushContextValue {
  /**
   * Subscribes the user to Push Service and registers the subscription with the backend.
   * Only runs once per session.
   */
  subscribeAndRegister: () => Promise<PushSubscription | null>;

  /**
   * Requests the backend to schedule a push notification for a specific program.
   */
  scheduleForProgram: (
    programId: string,
    title: string,
    minutesBefore: number
  ) => Promise<void>;
}

// Create context with undefined to enforce usage inside provider
const PushContext = createContext<PushContextValue | undefined>(undefined);

export const PushProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const hasSubscribedRef = React.useRef(false);

  useEffect(() => {
    // 1) Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err);
      });
    }
    // 2) Fetch VAPID public key from backend
    fetch('/push/vapidPublicKey')
      .then((res) => res.json())
      .then(({ publicKey }) => setVapidKey(publicKey))
      .catch((err) => {
        console.error('Error fetching VAPID key:', err);
      });
  }, []);

  const subscribeAndRegister = async (): Promise<PushSubscription | null> => {
    if (!vapidKey) {
      console.warn('VAPID key not loaded yet');
      return null;
    }
    if (hasSubscribedRef.current) {
      return null; // already subscribed this session
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      console.warn('No device_id found in localStorage');
    }

    await fetch('/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        subscription,
      }),
    });

    hasSubscribedRef.current = true;
    return subscription;
  };

  const scheduleForProgram = async (
    programId: string,
    title: string,
    minutesBefore: number
  ): Promise<void> => {
    await fetch('/push/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId, title, minutesBefore }),
    });
  };

  return (
    <PushContext.Provider value={{ subscribeAndRegister, scheduleForProgram }}>
      {children}
    </PushContext.Provider>
  );
};

/**
 * Hook to access push functionality.
 * Must be used within a PushProvider.
 */
export function usePush(): PushContextValue {
  const context = useContext(PushContext);
  if (!context) {
    throw new Error('usePush must be used within a PushProvider');
  }
  return context;
}
