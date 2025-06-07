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
    isIOSDevice: boolean;
    isPWAInstalled: boolean;
    notificationPermission: NotificationPermission | null;
}

interface PushProviderProps {
    children: ReactNode;
    enabled?: boolean;
    installPrompt: BeforeInstallPromptEvent | null;
}

// Contexto para Push API
const PushContext = createContext<PushContextValue | undefined>(undefined);

// iOS detection utility
const isIOSDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// PWA installation detection
const isPWAInstalled = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for iOS standalone mode
  const isIOSStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  
  // Check for generic PWA standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check if launched from home screen (iOS specific)
  const isIOSHomescreen = isIOSDevice() && isIOSStandalone;
  
  console.log('PWA Detection:', {
    isIOSStandalone,
    isStandalone,
    isIOSHomescreen,
    userAgent: navigator.userAgent
  });
  
  return isStandalone || isIOSStandalone;
};

export const PushProvider: FC<PushProviderProps> = ({ children, enabled = false, installPrompt = null }) => {
  const deviceId = useDeviceId();
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const hasSubscribedRef = useRef(false);

  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Set client-side only values
    setIsIOS(isIOSDevice());
    setIsPWA(isPWAInstalled());

    // Check PWA status periodically (useful for iOS when user installs after opening the app)
    const checkPWAStatus = () => {
      const currentPWAStatus = isPWAInstalled();
      setIsPWA(currentPWAStatus);
    };

    const interval = setInterval(checkPWAStatus, 2000); // Check every 2 seconds

    if (!enabled) return;

    // 1) Registro del Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully');
          // For iOS, ensure service worker is active
          const currentIsIOS = isIOSDevice();
          if (currentIsIOS && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch((err) => console.error('SW registration failed:', err));
    }

    // 2) Obtención de la clave VAPID desde el backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/vapidPublicKey`)
      .then((res) => res.json())
      .then(({ publicKey }) => setVapidKey(publicKey))
      .catch((err) => console.error('Error fetching VAPID key:', err));

    // 3) Check notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Cleanup interval
    return () => {
      clearInterval(interval);
    };
  }, [enabled]);

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    // For iOS, we need to request permission explicitly
    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    setNotificationPermission(permission);
    
    if (permission !== 'granted') {
      throw new Error(`Notification permission ${permission}`);
    }
    
    return permission;
  };

  const subscribeAndRegister = async (): Promise<PushSubscription | null> => {
    if (!enabled) {
      console.warn('Push disabled: subscribeAndRegister no-op');
      return null;
    }

    // iOS Safari requires PWA installation for push notifications
    if (isIOS && !isPWA) {
      throw new Error('iOS requires app to be installed to home screen for push notifications');
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

    try {
      // 1) Request notification permission first
      await requestNotificationPermission();

      // 2) Asegurarnos de tener el SW listo
      const registration = await navigator.serviceWorker.ready;

      // 3) Mirar si ya hay una subscripción
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // 4) Si no, crearla
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      hasSubscribedRef.current = true;
      console.log('Push subscription successful:', {
        endpoint: subscription.endpoint,
        isIOS,
        isPWA
      });
      
      return subscription;
    } catch (error) {
      console.error('Failed to create push subscription:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('home screen')) {
          throw new Error('Para recibir notificaciones en iOS, primero debes añadir la app a tu pantalla de inicio');
        } else if (error.message.includes('permission')) {
          throw new Error('Debes permitir las notificaciones para suscribirte');
        }
      }
      
      throw error;
    }
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
    
    // iOS-specific installation instructions
    if (isIOS) {
      alert(
        "Para recibir notificaciones en iOS debes agregar la app a tu pantalla de inicio:\n\n" +
        "1. Toca el botón de compartir (📤) en Safari\n" +
        "2. Desplázate hacia abajo y selecciona 'Añadir a pantalla de inicio'\n" +
        "3. Toca 'Añadir' en la parte superior derecha\n\n" +
        "Una vez instalada, podrás recibir notificaciones push."
      );
    } else {
      alert(
        "Para instalar la aplicación:\n\n" +
        "1. Busca el icono de instalación en la barra de direcciones\n" +
        "2. Haz clic en 'Instalar' cuando aparezca la opción"
      );
    }
  };

  return (
    <PushContext.Provider value={{ 
      subscribeAndRegister, 
      scheduleForProgram, 
      promptInstall,
      isIOSDevice: isIOS,
      isPWAInstalled: isPWA,
      notificationPermission
    }}>
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