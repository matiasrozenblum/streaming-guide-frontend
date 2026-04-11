import { useSessionContext } from '@/contexts/SessionContext';
import { SessionWithToken } from '@/types/session';
import { event as gaEvent } from '@/lib/gtag';

export function YouTubeAnalyticsEvents() {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const handleMinimize = () => {
    gaEvent({
      action: 'minimize_youtube',
      params: {},
      userData: typedSession?.user
    });
  };
  const handleMaximize = () => {
    gaEvent({
      action: 'maximize_youtube',
      params: {},
      userData: typedSession?.user
    });
  };
  return { handleMinimize, handleMaximize };
}
