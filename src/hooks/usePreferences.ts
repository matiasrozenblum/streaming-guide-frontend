import { useState, useEffect } from 'react';

export function usePreferences() {
  const [prefs, setPrefs] = useState<Set<string>>(new Set());
  const deviceId = localStorage.getItem('device_id')!;

  useEffect(() => {
    if (!deviceId) return;


    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/preferences?deviceId=${deviceId}`
    )
      .then((r) => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      })
      .then((arr: { programId: string }[]) => {
        setPrefs(new Set(arr.map((x) => x.programId)));
      })
      .catch((err) => {
        console.error('Error cargando preferencias', err);
      });
  }, [deviceId]);

  const toggle = async (programId: string) => {
    if (prefs.has(programId)) {
      // desuscribir
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/preferences/${programId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      setPrefs(s => { const t = new Set(s); t.delete(programId); return t; });
    } else {
      // suscribir
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/preferences/${programId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      setPrefs(s => new Set(s).add(programId));
    }
  };

  return { prefs, toggle };
}