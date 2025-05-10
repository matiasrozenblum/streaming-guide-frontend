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

    const deviceId = useDeviceId();
    // Llamamos al hook al tope del componente
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
        if (!vapidKey) {
            console.warn('VAPID key not loaded yet');
            return null;
        }
        if (hasSubscribedRef.current) {
            return null; // ya suscrito
        }

        if (!deviceId) {
            console.warn('⏳ esperando a que se genere device_id…');
            return null;
        }
    
        // Leer directamente de localStorage
        const storedDeviceId = localStorage.getItem('device_id');
        if (!storedDeviceId) {
            console.warn('device_id not found in localStorage');
            return null;
        }
    
        // 1) Asegurarnos de tener el SW listo
        const registration = await navigator.serviceWorker.ready;
    
        // 2) Mirar si ya hay una subscripción
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            // 3) Si no, crearla
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
        }
    
        // 4) Enviar la subscripción al backend
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/subscribe`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId, subscription })
        }
        );
    
        hasSubscribedRef.current = true;
        console.log('✅ Subscribed & sent to server:', subscription);
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
