"use client";

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

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }

interface PushContextValue {
    subscribeAndRegister: () => Promise<PushSubscription | null>;
    scheduleForProgram: (programId: string, title: string, minutesBefore: number) => Promise<void>;
    promptInstall: () => Promise<void>;
}

interface PushProviderProps {
    children: ReactNode;
    enabled?: boolean;
    installPrompt: BeforeInstallPromptEvent | null;
}

// Contexto para Push API
const PushContext = createContext<PushContextValue | undefined>(undefined);

export const PushProvider: FC<PushProviderProps> = ({ children, enabled = false, installPrompt = null }) => {
  const deviceId = useDeviceId();
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const hasSubscribedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

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
  }, [enabled]);

  const subscribeAndRegister = async (): Promise<PushSubscription | null> => {
    if (!enabled) {
      console.warn('Push disabled: subscribeAndRegister no-op');
      return null;
    }
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

    hasSubscribedRef.current = true;
    return subscription;
  };

  const scheduleForProgram = async (
    programId: string,
    title: string,
    minutesBefore: number
  ): Promise<void> => {
    if (!enabled) {
      console.warn('Push disabled: scheduleForProgram no-op');
      return;
    }
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId, title, minutesBefore }),
    });
  };

  const promptInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      return;
    }
    // fallback iOS
    alert(
      "Para recibir notificaciones en iOS debes agregar la app a tu pantalla de inicio:\n" +
      "1. Abrir el menú de compartir\n" +
      "2. Seleccionar 'Añadir a pantalla de inicio'"
    );
  };

  return (
    <PushContext.Provider value={{ subscribeAndRegister, scheduleForProgram, promptInstall }}>
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