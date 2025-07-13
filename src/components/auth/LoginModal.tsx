'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Box, useTheme, Stepper, Step, StepLabel, StepConnector, stepConnectorClasses, StepIconProps
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { signIn } from 'next-auth/react';
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
import FacebookIcon from '@mui/icons-material/Facebook';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

export default function LoginModal({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const theme = useTheme();
  const deviceId = useDeviceId();
  const { closeTooltip } = useTooltip();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
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
    }
  }, [open]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user) {
      // If user logged in via social, upsert user in backend
      const { email, firstName, lastName, gender, birthDate } = session.user;
      if (email && (firstName || session.user.name)) {
        (async () => {
          try {
            await fetch('/api/users/social-upsert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                firstName: firstName || (session.user.name?.split(' ')[0] ?? ''),
                lastName: lastName || (session.user.name?.split(' ').slice(1).join(' ') ?? ''),
                gender: gender || '',
                birthDate: birthDate || '',
              }),
            });
          } catch {
            // Ignore errors for now, fallback to profile step
          }
        })();
        setEmail(email);
        setFirstName(firstName || (session.user.name?.split(' ')[0] ?? ''));
        setLastName(lastName || (session.user.name?.split(' ').slice(1).join(' ') ?? ''));
        setGender(gender || '');
        setBirthDate(birthDate || '');
        setPhase('flow');
        setStep('profile');
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

  // Add a function to handle profile completion after social login
  async function handleSocialProfileSubmit(f: string, l: string, b: string, g: string) {
    setIsLoading(true);
    setError('');
    try {
      // Try to create or update the user
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: f,
          lastName: l,
          email,
          gender: g,
          birthDate: b,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || 'Error al completar el perfil');
      }
      // After successful profile completion, close modal and reload session
      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al completar el perfil');
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
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
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

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
                    setStep('existing-user');
                    setPhase('flow');
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
              <button
                type="button"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#222', borderRadius: 6, border: '1px solid #e0e0e0', padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                onClick={async () => {
                  setIsLoading(true);
                  await signIn('google', { callbackUrl: window.location.href });
                  setIsLoading(false);
                }}
                disabled={isLoading}
              >
                <GoogleIcon sx={{ color: '#4285F4' }} />
                Conectate con Google
              </button>
              <button
                type="button"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#222', borderRadius: 6, border: '1px solid #e0e0e0', padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                onClick={async () => {
                  setIsLoading(true);
                  await signIn('facebook', { callbackUrl: window.location.href });
                  setIsLoading(false);
                }}
                disabled={isLoading}
              >
                <FacebookIcon sx={{ color: '#1877F3' }} />
                Conectate con Meta
              </button>
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

        {step === 'profile' && (
          <ProfileStep
            initialFirst={firstName}
            initialLast={lastName}
            initialBirthDate={birthDate}
            initialGender={gender}
            error={error}
            onBack={() => setStep('code')}
            onSubmit={session?.user ? handleSocialProfileSubmit : (f, l, b, g) => {
              setFirstName(f);
              setLastName(l);
              setBirthDate(b);
              setGender(g);
              setCompletedSteps(prev => new Set([...prev, 'profile']));
              trackSignupStep('profile', { has_first_name: !!f, has_last_name: !!l, has_birth_date: !!b, has_gender: !!g });
              setStep('password');
            }}
          />
        )}

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
    </Dialog>
  );
}