'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Box, useTheme, Stepper, Step, StepLabel, StepConnector, stepConnectorClasses, StepIconProps, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { signIn, useSession } from 'next-auth/react';
import EmailStep from './steps/EmailStep';
import CodeStep from './steps/CodeStep';
import ProfileStep from './steps/ProfileStep';
import PasswordStep from './steps/PasswordStep';
import ExistingUserStep from './steps/ExistingUserStep';
import { useDeviceId } from '@/hooks/useDeviceId';
import { event as gaEvent } from '@/lib/gtag';
import { useTooltip } from '@/contexts/TooltipContext';
import { styled, Theme } from '@mui/material/styles';
import GoogleIcon from '@mui/icons-material/Google';
// import FacebookIcon from '@mui/icons-material/Facebook'; // Temporarily disabled - requires app review
import CircularProgress from '@mui/material/CircularProgress';

// Helper para extraer mensaje de Error
function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

type StepKey = 'email' | 'code' | 'profile' | 'password' | 'existing-user';

const ALL_STEPS: Record<'new'|'existing', StepKey[]> = {
  new: ['email','code','profile','password'],
  existing: ['email','existing-user']
};
const STEP_LABELS: Record<StepKey,string> = {
  email: 'Correo',
  code: 'Verificar',
  profile: 'Perfil',
  password: 'Contraseña',
  'existing-user': 'Acceso'
};
const STEP_ICONS: Record<StepKey, React.ReactNode> = {
  email: <MailOutlineIcon fontSize="small" />,
  code: <VpnKeyIcon fontSize="small" />,
  profile: <PersonOutlineIcon fontSize="small" />,
  password: <LockOutlinedIcon fontSize="small" />,
  'existing-user': <VpnKeyIcon fontSize="small" />
};

// Custom StepConnector with loading animation
const BlueConnector = styled(StepConnector)<{ isLoading?: boolean }>(({ theme, isLoading }: { theme: Theme; isLoading?: boolean }) => ({
  [`& .${stepConnectorClasses.line}`]: {
    borderTopWidth: 3,
    borderRadius: 1,
    borderColor: theme.palette.divider,
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.3s',
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.primary.main,
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    borderColor: isLoading ? theme.palette.divider : theme.palette.primary.main,
    '&::after': isLoading ? {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      background: `linear-gradient(90deg, transparent 0%, ${theme.palette.primary.main} 50%, transparent 100%)`,
      animation: 'progress-wave 1.5s infinite',
    } : {},
  },
  '@keyframes progress-wave': {
    '0%': {
      transform: 'translateX(-100%)',
    },
    '100%': {
      transform: 'translateX(100%)',
    },
  },
}));

// Custom StepIcon that uses your icons and colors them blue for active/completed steps
function CustomStepIcon(props: StepIconProps & { stepKey?: StepKey; isLoading?: boolean; completedSteps?: Set<StepKey> }) {
  const { active, completed, icon, stepKey, isLoading, completedSteps } = props;
  const theme = useTheme();
  const iconKey = stepKey || (typeof icon === 'number' ? Object.keys(STEP_ICONS)[icon - 1] : icon);

  const isStepCompleted = completedSteps?.has(stepKey as StepKey) || completed;
  const shouldBeBlue = isStepCompleted || (active && !isLoading);
  const shouldAnimate = active && isLoading;

  return (
    <Box
      sx={{
        color: shouldBeBlue ? theme.palette.primary.main : theme.palette.text.disabled,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        fontSize: 22,
        transition: 'color 0.3s',
        animation: shouldAnimate ? 'pulse 1.5s infinite' : 'none',
        '@keyframes pulse': {
          '0%, 100%': {
            opacity: 0.5,
          },
          '50%': {
            opacity: 1,
          },
        },
      }}
    >
      {STEP_ICONS[iconKey as StepKey]}
    </Box>
  );
}

const mapGenderToBackend = (g: string) => {
  switch (g) {
    case 'masculino': return 'male';
    case 'femenino': return 'female';
    case 'no_binario': return 'non_binary';
    case 'prefiero_no_decir': return 'rather_not_say';
    default: return 'rather_not_say';
  }
};

// Add global type for window.__socialLoginHandled
declare global {
  interface Window {
    __socialLoginHandled?: boolean;
  }
}

export default function LoginModal({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const theme = useTheme();
  const deviceId = useDeviceId();
  const { closeTooltip } = useTooltip();
  const { data: session, status: sessionStatus } = useSession();
  const [step, setStep] = useState<StepKey>('email');
  const [isUserExisting, setIsUserExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set());
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userGender, setUserGender] = useState('');
  const [phase, setPhase] = useState<'email'|'flow'>('email');
  const [socialLoginPending, setSocialLoginPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep('email'); setIsUserExisting(false);
      setCompletedSteps(new Set());
      setEmail(''); setCode(''); setRegistrationToken('');
      setFirstName(''); setLastName(''); setError(''); setIsLoading(false);
      setForgotPassword(false);
      setBirthDate(''); setGender('');
      setUserFirstName(''); setUserGender('');
      setPhase('email');
      setSocialLoginPending(false);
      // Clean up sessionStorage
      sessionStorage.removeItem('lastSocialProvider');
    }
  }, [open]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user) {
      if (window.__socialLoginHandled) return;
      window.__socialLoginHandled = true;
      
      // Track social login success when session becomes authenticated
      const provider = sessionStorage.getItem('lastSocialProvider') || 'google';
      
      gaEvent({
        action: 'social_login_success',
        params: {
          provider: provider,
          method: 'social_signup',
          user_type: session.user.id ? 'existing' : 'new',
        }
      });
      
      setSocialLoginPending(true); // Block UI/modal
      const { email, firstName, lastName, gender, birthDate } = session.user;
      if (email && (firstName || session.user.name)) {
        (async () => {
          try {
            const res = await fetch('/api/auth/social-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                firstName: firstName || (session.user.name?.split(' ')[0] ?? ''),
                lastName: lastName || (session.user.name?.split(' ').slice(1).join(' ') ?? ''),
                provider: 'google',
                gender: gender || '',
                birthDate: birthDate || '',
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.profileIncomplete && data.registration_token) {
                setRegistrationToken(data.registration_token);
                setEmail(data.user.email);
                setFirstName(data.user.firstName || '');
                setLastName(data.user.lastName || '');
                setStep('profile');
                setPhase('flow');
                setIsUserExisting(false);
                setCompletedSteps(new Set(['email']));
                setIsLoading(false);
                setSocialLoginPending(false);
                return;
              } else if (data.access_token && data.refresh_token) {
                await signIn('credentials', {
                  redirect: false,
                  accessToken: data.access_token,
                  refreshToken: data.refresh_token,
                });
                setSocialLoginPending(false);
                // Optionally: close modal or redirect here
              }
            } else {
              setSocialLoginPending(false);
            }
          } catch {
            setSocialLoginPending(false);
          }
        })();
      } else {
        setSocialLoginPending(false);
      }
    }
  }, [session, sessionStatus]);

  // Track modal open and close tooltips
  useEffect(() => {
    if (open) {
      closeTooltip(); // Close all tooltips when modal opens
      gaEvent({
        action: 'auth_modal_open',
        params: {
          is_existing_user: isUserExisting,
        }
      });
    }
  }, [open, isUserExisting, closeTooltip]);

  // Track step changes (for funnel analysis)
  useEffect(() => {
    if (open) {
      gaEvent({
        action: 'auth_step_change',
        params: {
          step,
          is_existing_user: isUserExisting,
          has_error: !!error,
        }
      });
    }
  }, [step, open, isUserExisting, error]);

  const steps = isUserExisting ? ALL_STEPS.existing : ALL_STEPS.new;
  const activeStep = steps.indexOf(step);

  // Track signup step complete (for funnel)
  const trackSignupStep = (stepName: string, extraParams = {}) => {
    gaEvent({
      action: 'signup_step_complete',
      params: {
        step: stepName,
        email_provided: !!email,
        has_first_name: !!firstName,
        has_last_name: !!lastName,
        has_birth_date: !!birthDate,
        has_gender: !!gender,
        ...extraParams
      }
    });
  };





  // Remove popup-based social login handler
  // const handleSocialLogin = async (provider: 'google' | 'facebook') => { ... };

  return (
    <Dialog open={open} onClose={socialLoginPending ? undefined : onClose} fullWidth maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : theme.palette.background.paper
          }
        }
      }}
    >
      <DialogTitle sx={{ display:'flex', justifyContent:'space-between', px:3, py:2, backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : theme.palette.background.paper }}>
        {phase === 'email' ? '¡Bienvenid@ a La Guía!' : (
          isUserExisting && step==='existing-user'
            ? 'Iniciar Sesión'
            : !isUserExisting && step==='email'
            ? 'Acceder / Registrarse'
            : step==='code'
            ? (forgotPassword ? 'Recuperar contraseña' : 'Verificar correo')
            : step==='profile'
            ? 'Completa tu perfil'
            : step==='password'
            ? (forgotPassword ? 'Nueva contraseña' : 'Creá tu contraseña')
            : ''
        )}
        <IconButton onClick={socialLoginPending ? undefined : onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      {socialLoginPending ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <CircularProgress sx={{ my: 3 }} />
          <Box sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}>Conectando con el backend...</Box>
        </Box>
      ) : (
        <>
          {phase === 'flow' && (
            <Box sx={{ px: 3, pt: 2, backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : theme.palette.background.paper }}>
              <Stepper
                nonLinear
                alternativeLabel
                activeStep={activeStep}
                connector={<BlueConnector isLoading={isLoading} />}
                sx={{
                  width: '100%',
                  minWidth: 0,
                  backgroundColor: 'transparent',
                  '.MuiStepConnector-line': {
                    minWidth: 24,
                  },
                }}
              >
                {steps.map((key) => {
                  const isCompleted = completedSteps.has(key);
                  const isActive = step === key;
                  const isCurrentlyLoading = isActive && isLoading;
                  return (
                    <Step key={key} completed={isCompleted} active={isActive}>
                      <StepLabel
                        sx={{
                          mt: 0,
                          mb: 0,
                          '.MuiStepLabel-label': {
                            marginTop: '0px',
                            marginBottom: '0px',
                            lineHeight: 1.1,
                            color: (theme) => theme.palette.text.secondary,
                            fontWeight: 600,
                            fontSize: 13,
                          },
                          '.MuiStepLabel-label.Mui-active, .MuiStepLabel-label.Mui-completed': {
                            color: (theme) => theme.palette.primary.main,
                            marginTop: '0px',
                            marginBottom: '0px',
                          },
                          '.MuiStepLabel-label.MuiStepLabel-alternativeLabel': {
                            marginTop: '0px !important',
                            marginBottom: '0px !important',
                          },
                        }}
                        StepIconComponent={(props) => (
                          <CustomStepIcon 
                            {...props} 
                            stepKey={key}
                            isLoading={isCurrentlyLoading}
                            completedSteps={completedSteps}
                          />
                        )}
                      >
                        {STEP_LABELS[key]}
                      </StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            </Box>
          )}

          <DialogContent sx={{ px:3, py:2, backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : theme.palette.background.paper }}>
            {phase === 'email' && (
              <>
                <EmailStep
                  initialEmail={email}
                  isLoading={isLoading}
                  error={error}
                  onSubmit={async (e) => {
                    setIsLoading(true); setError(''); setEmail(e);
                    try {
                      const res = await fetch(`/api/users/email/${e}`);
                      if (res.ok) {
                        const userData = await res.json();
                        setUserFirstName(userData.firstName || '');
                        setUserGender(userData.gender || '');
                        setCompletedSteps(prev => new Set([...prev, 'email']));
                        setIsUserExisting(true);
                        
                        // Check if user registered via social login
                        if (userData.origin && userData.origin !== 'traditional') {
                          // Automatically trigger social login for the detected provider
                          const provider = userData.origin === 'google' ? 'google' : 'facebook';
                          setIsLoading(true);
                          // Store provider in sessionStorage for persistence across redirects
                          sessionStorage.setItem('lastSocialProvider', provider);
                          // Track social login attempt
                          gaEvent({
                            action: 'social_login_attempt',
                            params: {
                              provider: provider,
                              method: 'auto_redirect',
                            }
                          });
                          // Automatically trigger the social login
                          await signIn(provider, { callbackUrl: '/profile-completion' });
                          setIsLoading(false);
                          return; // Exit early to prevent further processing
                        } else {
                          // Regular email user, proceed to password step
                          setStep('existing-user');
                          setPhase('flow');
                        }
                      } else if (res.status === 404) {
                        setCompletedSteps(prev => new Set([...prev, 'email']));
                        setIsUserExisting(false);
                        await fetch('/api/auth/send-code', {
                          method:'POST',
                          headers:{'Content-Type':'application/json'},
                          body: JSON.stringify({ identifier: e }),
                        });
                        setStep('code');
                        setPhase('flow');
                      } else {
                        throw new Error('Error inesperado');
                      }
                    } catch (err: unknown) {
                      setError(getErrorMessage(err));
                    }
                    setIsLoading(false);
                  }}
                />
                {/* Social login separator */}
                <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                  <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                  <Box sx={{ mx: 2, color: 'text.secondary', fontWeight: 600 }}>o</Box>
                  <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                </Box>
                {/* Social login buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={async () => {
                      setIsLoading(true);
                      // Store provider in sessionStorage for persistence across redirects
                      sessionStorage.setItem('lastSocialProvider', 'google');
                      // Track social login attempt
                      gaEvent({
                        action: 'social_login_attempt',
                        params: {
                          provider: 'google',
                          method: 'social_signup',
                        }
                      });
                      await signIn('google', { callbackUrl: '/profile-completion' });
                      setIsLoading(false);
                    }}
                    disabled={isLoading}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      py: 1.5,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontSize: 16,
                      fontWeight: 600,
                      borderColor: 'text.primary',
                      color: 'text.primary',
                      backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : theme.palette.background.paper,
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                      '&:disabled': {
                        opacity: 0.6,
                      }
                    }}
                  >
                    <GoogleIcon sx={{ color: '#4285F4' }} />
                    Conectate con Google
                  </Button>
                  {/* Facebook login temporarily disabled - requires app review
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={async () => {
                      setIsLoading(true);
                      // Store provider in sessionStorage for persistence across redirects
                      sessionStorage.setItem('lastSocialProvider', 'meta');
                      // Track social login attempt
                      gaEvent({
                        action: 'social_login_attempt',
                        params: {
                          provider: 'meta',
                          method: 'social_signup',
                        }
                      });
                      await signIn('facebook', { callbackUrl: '/profile-completion' });
                      setIsLoading(false);
                    }}
                    disabled={isLoading}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      py: 1.5,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontSize: 16,
                      fontWeight: 600,
                      borderColor: 'text.primary',
                      color: 'text.primary',
                      backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : theme.palette.background.paper,
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                      '&:disabled': {
                        opacity: 0.6,
                      }
                    }}
                  >
                    <FacebookIcon sx={{ color: '#1877F3' }} />
                    Conectate con Meta
                  </Button>
                  */}
                </Box>
              </>
            )}

            {step === 'existing-user' && (
              <ExistingUserStep
                email={email}
                firstName={userFirstName}
                gender={userGender}
                isLoading={isLoading}
                error={error}
                onBack={() => { setStep('email'); setPhase('email'); }}
                onSubmit={async (pw) => {
                  setIsLoading(true); setError('');
                  try {
                    // Call the login API route
                    const res = await fetch('/api/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, password: pw }),
                    });
                    if (!res.ok) {
                      setError('Credenciales inválidas');
                      gaEvent({
                        action: 'login_error',
                        params: {
                          method: 'password',
                          error: 'invalid_credentials',
                          email_provided: !!email,
                        }
                      });
                      setIsLoading(false);
                      return;
                    }
                    const data = await res.json();
                    const nxt = await signIn('credentials', {
                      redirect: false,
                      accessToken: data.access_token,
                      refreshToken: data.refresh_token,
                    });
                    if (nxt?.error) {
                      setError('Credenciales inválidas');
                      gaEvent({
                        action: 'login_error',
                        params: {
                          method: 'password',
                          error: 'invalid_credentials',
                          email_provided: !!email,
                        }
                      });
                    } else {
                      setCompletedSteps(prev => new Set([...prev, 'existing-user']));
                      gaEvent({
                        action: 'login_success',
                        params: {
                          method: 'password',
                        }
                      });
                      onClose();
                    }
                  } catch (err: unknown) {
                    setError(getErrorMessage(err));
                  }
                  setIsLoading(false);
                }}
                onForgotPassword={() => {
                  setForgotPassword(true);
                  setIsLoading(true);
                  fetch('/api/auth/send-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: email }),
                  })
                    .then(() => {
                      setStep('code');
                      setError('');
                    })
                    .catch((err) => {
                      setError(getErrorMessage(err));
                    })
                    .finally(() => setIsLoading(false));
                }}
              />
            )}

            {step === 'code' && forgotPassword && (
              <CodeStep
                email={email}
                initialCode={code}
                isLoading={isLoading}
                error={error}
                onBack={() => { setStep('existing-user'); setForgotPassword(false); }}
                onSubmit={async (c) => {
                  setCode(c);
                  setStep('password');
                }}
              />
            )}

            {step === 'code' && !forgotPassword && (
              <CodeStep
                email={email}
                initialCode={code}
                isLoading={isLoading}
                error={error}
                onBack={() => { setStep('email'); setPhase('email'); }}
                onSubmit={async (c) => {
                  setIsLoading(true); setError(''); setCode(c);
                  try {
                    const res = await fetch('/api/auth/verify-code', {
                      method:'POST',
                      headers:{'Content-Type':'application/json'},
                      body: JSON.stringify({ identifier: email, code: c, deviceId }),
                    });
                    const body = await res.json();
                    if (!res.ok) throw new Error(body.message || 'Error');
                    if (body.isNew) {
                      setCompletedSteps(prev => new Set([...prev, 'code']));
                      trackSignupStep('email_verification');
                      setRegistrationToken(body.registration_token);
                      setStep('profile');
                    } else {
                      setCompletedSteps(prev => new Set([...prev, 'code']));
                      gaEvent({
                        action: 'login_success',
                        params: {
                          method: 'otp',
                        }
                      });
                      const nxt = await signIn('credentials', {
                        redirect: false,
                        accessToken: body.access_token,
                        refreshToken: body.refresh_token,
                      });
                      if (!nxt?.error) {
                        onClose();
                      }
                    }
                  } catch (err: unknown) {
                    setError(getErrorMessage(err));
                    gaEvent({
                      action: 'login_error',
                      params: {
                        method: 'otp',
                        error: err instanceof Error ? err.message : 'otp_verification_failed',
                        email_provided: !!email,
                      }
                    });
                  }
                  setIsLoading(false);
                }}
              />
            )}

            {step === 'profile' && registrationToken ? (
              <ProfileStep
                initialFirst={firstName}
                initialLast={lastName}
                initialBirthDate={birthDate}
                initialGender={gender}
                requirePassword={true}
                isLoading={isLoading}
                error={error}
                onSubmit={async (f, l, b, g) => {
                  setFirstName(f);
                  setLastName(l);
                  setBirthDate(b);
                  setGender(g);
                  setCompletedSteps(prev => new Set([...prev, 'profile']));
                  setStep('password');
                }}
                onBack={() => { setStep('email'); setPhase('email'); }}
              />
            ) : null}

            {step === 'password' && forgotPassword && (
              <CodeStep
                email={email}
                initialCode={code}
                isLoading={isLoading}
                error={error}
                onBack={() => { setStep('existing-user'); setForgotPassword(false); }}
                onSubmit={async (c) => {
                  setCode(c);
                  setStep('password');
                }}
              />
            )}

            {step === 'password' && !forgotPassword && (
              <PasswordStep
                isLoading={isLoading}
                error={error}
                onBack={() => setStep('profile')}
                submitLabel="Registrarme"
                onSubmit={async (pw) => {
                  setIsLoading(true); setError('');
                  try {
                    const res = await fetch('/api/auth/register', {
                      method:'POST',
                      headers:{'Content-Type':'application/json'},
                      body: JSON.stringify({
                        registration_token: registrationToken,
                        firstName,
                        lastName,
                        password: pw,
                        deviceId,
                        birthDate: birthDate || undefined,
                        gender: mapGenderToBackend(gender)
                      }),
                    });
                    const body = await res.json();
                    if (!res.ok) throw new Error(body.message || 'Error registro');
                    const nxt = await signIn('credentials', {
                      redirect: false,
                      accessToken: body.access_token,
                      refreshToken: body.refresh_token,
                    });
                    if (nxt?.error) throw new Error('No se pudo iniciar sesión');
                    setCompletedSteps(prev => new Set([...prev, 'password']));
                    gaEvent({
                      action: 'signup_success',
                      params: {
                        has_first_name: !!firstName,
                        has_last_name: !!lastName,
                        has_birth_date: !!birthDate,
                        has_gender: !!gender,
                      }
                    });
                    onClose();
                  } catch (err: unknown) {
                    setError(getErrorMessage(err));
                    gaEvent({
                      action: 'signup_error',
                      params: {
                        step: 'final_registration',
                        error: err instanceof Error ? err.message : 'unknown',
                      }
                    });
                  }
                  setIsLoading(false);
                }}
              />
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}