'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import { api } from '@/services/api';

const KEYS = {
  player: 'tooltip_zapping_player_v1',
  panel: 'tooltip_zapping_panel_v1',
} as const;

export function useZappingTooltip() {
  const { session } = useSessionContext();
  const [showPlayer, setShowPlayer] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(KEYS.player)) setShowPlayer(true);
    if (!localStorage.getItem(KEYS.panel)) setShowPanel(true);
  }, []);

  const markSeen = useCallback(async (key: keyof typeof KEYS) => {
    const storageKey = KEYS[key];
    if (key === 'player') setShowPlayer(false);
    else setShowPanel(false);
    localStorage.setItem(storageKey, 'true');
    if (session?.user) {
      api.post('/users/me/seen-features', { feature: storageKey }).catch(() => {});
    }
  }, [session]);

  const markPlayerSeen = useCallback(() => markSeen('player'), [markSeen]);
  const markPanelSeen = useCallback(() => markSeen('panel'), [markSeen]);

  return { showPlayer, showPanel, markPlayerSeen, markPanelSeen };
}
