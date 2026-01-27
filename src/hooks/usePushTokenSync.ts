'use client';

import { useEffect, useRef } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import { usePush } from '@/contexts/PushContext';
import type { SessionWithToken } from '@/types/session';

/**
 * Hook that syncs push tokens to the backend on app launch.
 * 
 * This ensures that when a user opens the app on a device where they previously
 * granted notification permission, the current push token is registered with the backend.
 * 
 * This solves the "multi-device gap" problem where a user subscribed on Device A
 * but opens on Device B - Device B's token would never get registered because
 * the user doesn't click the bell again (they're already subscribed).
 * 
 * Does NOT prompt for permission - only syncs if already granted.
 */
export function usePushTokenSync() {
    const { session } = useSessionContext();
    const typedSession = session as SessionWithToken | null;
    const { syncPushToken, notificationPermission } = usePush();
    const hasSynced = useRef(false);

    useEffect(() => {
        // Only sync once per session
        if (hasSynced.current) return;

        // Must have a valid session (logged in user)
        if (!typedSession?.accessToken) return;

        // Skip for legacy/test users
        const isLegacyUser =
            typedSession.user.id === 'public' ||
            typedSession.user.id === 'backoffice' ||
            isNaN(Number(typedSession.user.id));
        if (isLegacyUser) return;

        // Only sync if permission was already granted
        // Web: check Notification.permission
        // Native: syncPushToken will check internally
        const isNative = typeof window !== 'undefined' &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).Capacitor?.isNativePlatform?.();

        // For web, only sync if already granted
        if (!isNative && notificationPermission !== 'granted') {
            console.log('[usePushTokenSync] Web permission not granted, skipping');
            return;
        }

        // Mark as synced before calling to prevent duplicate calls
        hasSynced.current = true;

        // Sync with a small delay to ensure device registration completes first
        const timeoutId = setTimeout(() => {
            console.log('[usePushTokenSync] Syncing push token...');
            syncPushToken().catch((error) => {
                console.error('[usePushTokenSync] Failed to sync:', error);
                // Allow retry on next mount if failed
                hasSynced.current = false;
            });
        }, 2000); // 2 second delay after device registration (which has 1s delay)

        return () => clearTimeout(timeoutId);
    }, [typedSession?.accessToken, typedSession?.user?.id, syncPushToken, notificationPermission]);
}
