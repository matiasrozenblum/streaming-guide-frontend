import { useSessionContext } from '@/contexts/SessionContext';
import { SessionWithToken } from '@/types/session';

const { session } = useSessionContext();
const typedSession = session as SessionWithToken | null;

gaEvent({
  action: 'auth_modal_open',
  params: {
    is_existing_user: isUserExisting,
  },
  userData: typedSession?.user
});

gaEvent({
  action: 'auth_step_change',
  params: {
    step,
    is_existing_user: isUserExisting,
    has_error: !!error,
  },
  userData: typedSession?.user
});

gaEvent({
  action: 'login_error',
  params: {
    method: 'password',
    error: 'invalid_credentials',
    email_provided: !!email,
  },
  userData: typedSession?.user
});

gaEvent({
  action: 'login_success',
  params: {
    method: 'password',
  },
  userData: typedSession?.user
});

gaEvent({
  action: 'signup_step_complete',
  params: {
    step: 'email_verification',
    email_provided: !!email,
  },
  userData: typedSession?.user
});

gaEvent({
  action: 'login_success',
  params: {
    method: 'otp',
  },
  userData: typedSession?.user
});

gaEvent({
  action: 'login_error',
  params: {
    method: 'otp',
    error: err instanceof Error ? err.message : 'otp_verification_failed',
    email_provided: !!email,
  },
  userData: typedSession?.user
});

gaEvent({
  action: 'signup_step_complete',
  params: {
    step: 'profile',
    has_first_name: !!f,
    has_last_name: !!l,
    has_birth_date: !!b,
    has_gender: !!g,
  },
  userData: typedSession?.user
});

gaEvent({
  action: 'signup_success',
  params: {
    has_first_name: !!firstName,
    has_last_name: !!lastName,
    has_birth_date: !!birthDate,
    has_gender: !!gender,
  },
  userData: typedSession?.user
});

gaEvent({
  action: 'signup_error',
  params: {
    step: 'final_registration',
    error: err instanceof Error ? err.message : 'unknown',
  },
  userData: typedSession?.user
}); 