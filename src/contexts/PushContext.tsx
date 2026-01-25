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
import { useDeviceId } from '@/hooks/useDeviceId';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

// Base64 conversion utility
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PushContextValue {
  subscribeAndRegister: () => Promise<PushSubscription | { endpoint: string; keys: undefined } | null>; // Updated return type
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

  const isIOSDeviceCheck = isIOSDevice();

  // Primary detection methods (most reliable)
  const isIOSStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // URL parameter detection (set by manifest start_url when launching from home screen)
  const urlParams = new URLSearchParams(window.location.search);
  const isPWAFromURL = urlParams.get('pwa') === 'true';
  const isManualPWATest = urlParams.get('manual_pwa') === 'true';

  // Additional display modes
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;

  // For iOS: Only consider it a PWA if we have strong indicators
  let result = false;

  if (isIOSDeviceCheck) {
    // For iOS, be strict: require either standalone mode OR URL parameter from manifest
    result = isIOSStandalone || isPWAFromURL || isManualPWATest;
  } else {
    // For other platforms, use standard PWA detection
    result = isStandalone || isMinimalUI || isFullscreen || isPWAFromURL || isManualPWATest;
  }

  return result;
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

    // More frequent checks for iOS devices since PWA installation can happen
    const checkInterval = isIOSDevice() ? 1000 : 3000; // Check every 1s for iOS, 3s for others
    const interval = setInterval(checkPWAStatus, checkInterval);

    // Also check when the page becomes visible (user returns from installing)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(checkPWAStatus, 500); // Slight delay to ensure state is ready
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    if (!enabled) return;

    // 1) Registro del Service Worker para PWA (next-pwa se encarga automáticamente)
    // 2) Registro del Service Worker para push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/push-sw.js')
        .then((registration) => {
          // For iOS, ensure service worker is active
          const currentIsIOS = isIOSDevice();
          if (currentIsIOS && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch((err) => console.error('Push SW registration failed:', err));
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

    // 4) Native Push Listeners
    if (Capacitor.isNativePlatform()) {
      PushNotifications.addListener('registration', (token) => {
        console.log('🔥 Native Push Token:', token.value);
        // We don't auto-send to backend here, we wait for the subscribe() flow to resolve
      });
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('🔔 Push Received:', notification);
        // Optional: Show an alert if you want to be 100% sure the user sees it while testing
        // alert(`Notificación: ${notification.title}\n${notification.body}`);
      });
    }

    // Cleanup interval and event listeners
    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
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

  const subscribeAndRegister = async (): Promise<PushSubscription | { endpoint: string; keys: undefined } | null> => {
    if (!enabled) {
      console.warn('Push disabled: subscribeAndRegister no-op');
      return null;
    }

    // Native Platform Logic
    if (Capacitor.isNativePlatform()) {
      try {
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive === 'granted') {
          // Wrap registration in a promise to return the token
          return new Promise((resolve, reject) => {
            PushNotifications.addListener('registration', (token) => {
              // Return structure compatible with Backend DTO (endpoint = token)
              resolve({
                endpoint: token.value,
                keys: undefined, // Optional in DTO now
              });
            });
            PushNotifications.addListener('registrationError', (err) => {
              reject(err);
            });

            PushNotifications.register();
          });
        } else {
          throw new Error('Permission not granted for push notifications');
        }
      } catch (e) {
        console.error('Native push registration failed', e);
        throw e;
      }
    }

    // iOS Safari Web requires PWA installation for push notifications
    if (isIOS && !isPWA) {
      throw new Error('iOS requires app to be installed to home screen for push notifications');
    }

    if (!vapidKey) {
      console.warn('VAPID key not loaded yet');
      return null;
    }

    if (hasSubscribedRef.current) {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      return existingSubscription;
    }

    if (!deviceId) {
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
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
        } catch (subscribeError) {
          throw subscribeError;
        }
      }

      hasSubscribedRef.current = true;

      return subscription;
    } catch (error) {

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