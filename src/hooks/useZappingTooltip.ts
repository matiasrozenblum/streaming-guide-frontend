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
    if (!localStorage.getItem(PLAYER_KEY)) setShowPlayer(true);
  }, []);

  const markPlayerSeen = useCallback(() => {
    setShowPlayer(false);
    localStorage.setItem(PLAYER_KEY, 'true');
    if (status === 'authenticated') {
      api.post('/users/me/seen-features', { feature: PLAYER_KEY }).catch(() => {});
    }
  }, [status]);

  return { showPlayer, markPlayerSeen };
}
