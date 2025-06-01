import { useSessionContext } from '@/contexts/SessionContext';
import { SessionWithToken } from '@/types/session';

const { session } = useSessionContext();
const typedSession = session as SessionWithToken | null;

posthog.capture('minimize_youtube', { user_id: typedSession?.user?.id });
gaEvent({
  action: 'minimize_youtube',
  params: {},
  userData: typedSession?.user
});

posthog.capture('maximize_youtube', { user_id: typedSession?.user?.id });
gaEvent({
  action: 'maximize_youtube',
  params: {},
  userData: typedSession?.user
}); 