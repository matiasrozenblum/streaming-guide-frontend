'use client';

import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import { urlBase64ToUint8Array } from '@/utils/push';
import { useDeviceId } from '@/hooks/useDeviceId';

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

// Contexto para Push API
const PushContext = createContext<PushContextValue | undefined>(undefined);

export const PushProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Llamamos al hook al tope del componente
  const deviceId = useDeviceId();
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const hasSubscribedRef = useRef(false);

  useEffect(() => {
    // 1) Registro del Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('SW registration failed:', err));
    }
    // 2) Obtención de la clave VAPID desde el backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/vapidPublicKey`)
      .then((res) => res.json())
      .then(({ publicKey }) => setVapidKey(publicKey))
      .catch((err) => console.error('Error fetching VAPID key:', err));
  }, []);

  const subscribeAndRegister = async (): Promise<PushSubscription | null> => {
    // Aseguramos que tenemos clave y deviceId antes de suscribir
    if (!vapidKey) {
      console.warn('VAPID key not loaded yet');
      return null;
    }
    if (hasSubscribedRef.current) {
      return null; // ya suscrito en esta sesión
    }
    if (!deviceId) {
      console.warn('deviceId not available yet');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, subscription }),
    });

    hasSubscribedRef.current = true;
    return subscription;
  };

  const scheduleForProgram = async (
    programId: string,
    title: string,
    minutesBefore: number
  ): Promise<void> => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/schedule`, {
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
 * Hook para consumir funcionalidades de Push.
 * Debe usarse dentro de <PushProvider>.
 */
export function usePush(): PushContextValue {
  const context = useContext(PushContext);
  if (!context) {
    throw new Error('usePush must be used within a PushProvider');
  }
  return context;
}
