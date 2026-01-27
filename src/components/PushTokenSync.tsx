'use client';

import { usePushTokenSync } from '@/hooks/usePushTokenSync';

/**
 * Component that runs the push token sync hook.
 * Must be placed inside PushProvider and SessionProviderWrapper.
 * 
 * This component has no visual output - it only ensures that when the app
 * launches with a logged-in user who previously granted notification permission,
 * the current device's push token is synced to the backend.
 */
export function PushTokenSync() {
    usePushTokenSync();
    return null;
}
