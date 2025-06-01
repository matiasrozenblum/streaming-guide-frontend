import { useSessionContext } from '@/contexts/SessionContext';
import { SessionWithToken } from '@/types/session';
import { event as gaEvent } from '@/lib/gtag';
import posthog from 'posthog-js';

export function YouTubeAnalyticsEvents() {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const handleMinimize = () => {
    posthog.capture('minimize_youtube', { user_id: typedSession?.user?.id });
    gaEvent({
      action: 'minimize_youtube',
      params: {},
      userData: typedSession?.user
    });
  };
  const handleMaximize = () => {
    posthog.capture('maximize_youtube', { user_id: typedSession?.user?.id });
    gaEvent({
      action: 'maximize_youtube',
      params: {},
      userData: typedSession?.user
    });
  };
  return { handleMinimize, handleMaximize };
} 