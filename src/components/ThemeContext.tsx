import { useSessionContext } from '@/contexts/SessionContext';
import { SessionWithToken } from '@/types/session';
import { useEffect } from 'react';
import { event as gaEvent } from '@/lib/gtag';

interface ThemeChangeAnalyticsProps {
  newMode: string;
  prevMode: string;
}

export function ThemeChangeAnalytics({ newMode, prevMode }: ThemeChangeAnalyticsProps) {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  useEffect(() => {
    gaEvent({
      action: 'theme_change',
      params: {
        new_mode: newMode,
        old_mode: prevMode,
      },
      userData: typedSession?.user
    });
  }, [newMode, prevMode, typedSession?.user]);
  return null;
} 