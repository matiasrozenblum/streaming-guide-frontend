'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, LinearProgress,
  IconButton, Box, Stepper, Step, StepLabel, useTheme
} from '@mui/material';
import { X, Mail, KeyRound, User, LockKeyhole } from 'lucide-react';
import { signIn } from 'next-auth/react';
import EmailStep from './steps/EmailStep';
import CodeStep from './steps/CodeStep';
import ProfileStep from './steps/ProfileStep';
import PasswordStep from './steps/PasswordStep';
import ExistingUserStep from './steps/ExistingUserStep';

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
  email: <Mail size={20} />,
  code: <KeyRound size={20} />,
  profile: <User size={20} />,
  password: <LockKeyhole size={20} />,
  'existing-user': <KeyRound size={20} />
};

export default function LoginModal({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const theme = useTheme();
  const [step, setStep] = useState<StepKey>('email');
  const [isUserExisting, setIsUserExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep('email'); setIsUserExisting(false);
      setEmail(''); setCode(''); setRegistrationToken('');
      setFirstName(''); setLastName(''); setError(''); setIsLoading(false);
      setForgotPassword(false);
    }
  }, [open]);

  const steps = isUserExisting ? ALL_STEPS.existing : ALL_STEPS.new;
  const activeStep = steps.indexOf(step);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      PaperProps={{ sx:{ borderRadius:2, bgcolor:theme.palette.background.paper } }}
    >
      <DialogTitle sx={{ display:'flex', justifyContent:'space-between', px:3, py:2 }}>
        { isUserExisting && step==='existing-user'
            ? 'Iniciar Sesión'
            : !isUserExisting && step==='email'
            ? 'Acceder / Registrarse'
            : step==='code'
            ? (forgotPassword ? 'Recuperar contraseña' : 'Verificar Correo')
            : step==='profile'
            ? 'Completa tu Perfil'
            : step==='password'
            ? (forgotPassword ? 'Nueva contraseña' : 'Crea tu Contraseña')
            : '' }
        <IconButton onClick={onClose}><X/></IconButton>
      </DialogTitle>

      <LinearProgress variant="determinate" value={((activeStep+1)/steps.length)*100}
        sx={{ height:4, bgcolor:theme.palette.divider }} />

      <Box sx={{ px:3, pt:2 }}>
        <Stepper nonLinear alternativeLabel activeStep={activeStep}>
          {steps.map((key, idx) => (
            <Step key={key} completed={idx < activeStep}>
              <StepLabel StepIconComponent={()=>STEP_ICONS[key]}>
                {STEP_LABELS[key]}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ px:3, py:2 }}>
        {step === 'email' && (
          <EmailStep
            initialEmail={email}
            isLoading={isLoading}
            error={error}
            onSubmit={async (e) => {
              setIsLoading(true); setError(''); setEmail(e);
              try {
                const res = await fetch(`/api/users/email/${e}`);
                if (res.ok) {
                  setIsUserExisting(true);
                  setStep('existing-user');
                } else if (res.status === 404) {
                  setIsUserExisting(false);
                  await fetch('/api/auth/send-code', {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ identifier: e }),
                  });
                  setStep('code');
                } else {
                  throw new Error('Error inesperado');
                }
              } catch (err: unknown) {
                setError(getErrorMessage(err));
              }
              setIsLoading(false);
            }}
          />
        )}

        {step === 'existing-user' && (
          <ExistingUserStep
            email={email}
            isLoading={isLoading}
            error={error}
            onBack={() => setStep('email')}
            onSubmit={async (pw) => {
              setIsLoading(true); setError('');
              const nxt = await signIn('credentials', {
                redirect: false,
                email,
                password: pw,
              });
              if (nxt?.error) {
                setError('Credenciales inválidas');
              } else {
                onClose(); window.location.reload();
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
            onBack={() => setStep('email')}
            onSubmit={async (c) => {
              setIsLoading(true); setError(''); setCode(c);
              try {
                const res = await fetch('/api/auth/verify-code', {
                  method:'POST',
                  headers:{'Content-Type':'application/json'},
                  body: JSON.stringify({ identifier: email, code: c }),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body.message || 'Error');
                if (body.isNew) {
                  setRegistrationToken(body.registration_token);
                  setStep('profile');
                } else {
                  const nxt = await signIn('credentials', {
                    redirect: false,
                    accessToken: body.access_token,
                  });
                  if (!nxt?.error) {
                    onClose(); window.location.reload();
                  }
                }
              } catch (err: unknown) {
                setError(getErrorMessage(err));
              }
              setIsLoading(false);
            }}
          />
        )}

        {step === 'profile' && (
          <ProfileStep
            initialFirst={firstName}
            initialLast={lastName}
            error={error}
            onBack={() => setStep('code')}
            onSubmit={(f,l) => { setFirstName(f); setLastName(l); setStep('password'); }}
          />
        )}

        {step === 'password' && forgotPassword && (
          <PasswordStep
            isLoading={isLoading}
            error={error}
            onBack={() => setStep('code')}
            submitLabel="Cambiar contraseña"
            onSubmit={async (pw) => {
              setIsLoading(true); setError('');
              try {
                // POST to reset-password endpoint with email, password, and code
                const resetRes = await fetch('/api/users/reset-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password: pw, code }),
                });
                const resetBody = await resetRes.json();
                if (!resetRes.ok) throw new Error(resetBody.message || 'Error al cambiar la contraseña');
                // Now try to login
                const nxt = await signIn('credentials', {
                  redirect: false,
                  email,
                  password: pw,
                });
                if (nxt?.error) throw new Error('No se pudo iniciar sesión');
                onClose(); window.location.reload();
              } catch (err: unknown) {
                setError(getErrorMessage(err));
              }
              setIsLoading(false);
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
                  }),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body.message || 'Error registro');
                const nxt = await signIn('credentials', {
                  redirect: false,
                  accessToken: body.access_token,
                });
                if (nxt?.error) throw new Error('No se pudo iniciar sesión');
                onClose(); window.location.reload();
              } catch (err: unknown) {
                setError(getErrorMessage(err));
              }
              setIsLoading(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}