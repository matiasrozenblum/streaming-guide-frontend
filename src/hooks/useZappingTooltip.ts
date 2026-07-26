'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import { api } from '@/services/api';

const PLAYER_KEY = 'tooltip_zapping_player_v1';

export function useZappingTooltip() {
  const { status } = useSessionContext();
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const localSeen = !!localStorage.getItem(PLAYER_KEY);

    if (status === 'authenticated') {
      // Reconcile local flag with the backend for cross-device persistence.
      api
        .get('/users/me/seen-features')
        .then((res) => {
          if (cancelled) return;
          const seen: string[] = Array.isArray(res.data) ? res.data : [];
          if (seen.includes(PLAYER_KEY)) {
            // Seen on another device → suppress here too.
            localStorage.setItem(PLAYER_KEY, 'true');
            setShowPlayer(false);
          } else if (localSeen) {
            // Seen locally (e.g. dismissed while logged out) → push to backend.
            api.post('/users/me/seen-features', { feature: PLAYER_KEY }).catch(() => {});
            setShowPlayer(false);
          } else {
            setShowPlayer(true);
          }
        })
        .catch(() => {
          // Network/endpoint error → fall back to local-only behaviour.
          if (!cancelled) setShowPlayer(!localSeen);
        });
    } else if (status === 'unauthenticated') {
      setShowPlayer(!localSeen);
    }
    // status === 'loading' → wait; this effect re-runs when it resolves.

    return () => {
      cancelled = true;
    };
  }, [status]);

  const markPlayerSeen = useCallback(() => {
    setShowPlayer(false);
    localStorage.setItem(PLAYER_KEY, 'true');
    if (status === 'authenticated') {
      api.post('/users/me/seen-features', { feature: PLAYER_KEY }).catch(() => {});
    }
  }, [status]);

  return { showPlayer, markPlayerSeen };
}
