import { useSessionContext } from '@/contexts/SessionContext';
import { SessionWithToken } from '@/types/session';

const { session } = useSessionContext();
const typedSession = session as SessionWithToken | null;

gaEvent({
  action: 'theme_change',
  params: {
    new_mode: newMode,
    old_mode: prevMode,
  },
  userData: typedSession?.user
}); 