'use client';

import { useEffect, useState } from 'react';

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem('device_id');
    if (!id) {
      // crypto.randomUUID() funciona en navegadores modernos
      id = crypto.randomUUID();
      localStorage.setItem('device_id', id);

      // opcional: registra el device en tu backend
      /*fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: id }),
      });*/
    }
    setDeviceId(id);
  }, []);

  return deviceId;
}