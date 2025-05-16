'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, LinearProgress,
  IconButton, Box, Stepper, Step, StepLabel, useTheme
} from '@mui/material';
import { X, Mail, KeyRound, User, LockKeyhole } from 'lucide-react';
import EmailStep from './steps/EmailStep';
import CodeStep from './steps/CodeStep';
import ProfileStep from './steps/ProfileStep';
import PasswordStep from './steps/PasswordStep';
import ExistingUserStep from './steps/ExistingUserStep';
import { AuthService } from '@/services/auth';
import { signIn } from 'next-auth/react'

type StepKey = 'email' | 'code' | 'profile' | 'password' | 'existing-user';

const ALL_STEPS: Record<'new' | 'existing', StepKey[]> = {
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
  const [email, setEmail] = useState('');            // para pasar a CodeStep etc.
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setStep('email');
      setIsUserExisting(false);
      setEmail('');
      setCode('');
      setFirstName('');
      setLastName('');
      setError('');
      setIsLoading(false);
    }
  }, [open]);

  const steps = isUserExisting ? ALL_STEPS.existing : ALL_STEPS.new;
  const activeStep = steps.indexOf(step);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth maxWidth="xs"
      PaperProps={{
        sx: { borderRadius:2, bgcolor: theme.palette.background.paper }
      }}
    >
      <DialogTitle
        sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', px:3, py:2 }}
      >
        { isUserExisting && step==='existing-user' ? 'Iniciar Sesión' :
          !isUserExisting && step==='email'       ? 'Acceder / Registrarse' :
          step==='code'                           ? 'Verificar Correo' :
          step==='profile'                        ? 'Completa tu Perfil' :
          step==='password'                       ? 'Crea tu Contraseña' :
          '' }
        <IconButton onClick={onClose}><X/></IconButton>
      </DialogTitle>

      <LinearProgress
        variant="determinate"
        value={((activeStep+1)/steps.length)*100}
        sx={{ height:4, bgcolor: theme.palette.divider }}
      />

      <Box sx={{ px:3, pt:2 }}>
        <Stepper nonLinear alternativeLabel activeStep={activeStep}>
          {steps.map((key, idx) => (
            <Step key={key} completed={idx < activeStep}>
              <StepLabel
                StepIconComponent={() => STEP_ICONS[key]}
              >
                {STEP_LABELS[key]}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ px:3, py:2 }}>
        {/* ===== SWITCH DE STEPS ===== */}
        {step === 'email' && (
          <EmailStep
            initialEmail={email}
            onSubmit={async e => {
              setIsLoading(true); setError('');
              setEmail(e);
              try {
                const { exists } = await AuthService.checkUserExists(e);
                setIsUserExisting(exists);
                if (exists) setStep('existing-user');
                else {
                  await AuthService.sendCode(e);
                  setStep('code');
                }
              } catch (err:unknown) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message || 'Error desconocido');
              }
              setIsLoading(false);
            }}
            isLoading={isLoading}
            error={error}
          />
        )}
        {step === 'existing-user' && (
          <ExistingUserStep
            email={email}
            onSubmit={async p => {
              setIsLoading(true); setError('');
              try {
                await signIn('credentials', {
                  email,
                  password: p,
                });
                onClose(); window.location.reload();
              } catch (err:unknown) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message || 'Error desconocido');
              }
              setIsLoading(false);
            }}
            onBack={() => setStep('email')}
            isLoading={isLoading}
            error={error}
          />
        )}
        {step === 'code' && (
          <CodeStep
            email={email}
            initialCode={code}
            onSubmit={async c => {
              setIsLoading(true); setError('');
              try {
                const { isNew } = await AuthService.verifyCode(email, c);
                if (isNew) setStep('profile');
                else { onClose(); window.location.reload(); }
              } catch (err:unknown) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message || 'Error desconocido');
              }
              setIsLoading(false);
            }}
            onBack={() => setStep('email')}
            isLoading={isLoading}
            error={error}
          />
        )}
        {step === 'profile' && (
          <ProfileStep
            initialFirst={firstName}
            initialLast={lastName}
            onSubmit={(f,l) => {
              setFirstName(f); setLastName(l);
              setStep('password');
            }}
            onBack={() => setStep('code')}
            error={error}
          />
        )}
        {step === 'password' && (
          <PasswordStep
            onSubmit={async pass => {
              setIsLoading(true); setError('');
              try {
                await AuthService.register({ firstName, lastName, password: pass });
                onClose(); window.location.reload();
              } catch (err:unknown) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message || 'Error desconocido');
              }
              setIsLoading(false);
            }}
            onBack={() => setStep('profile')}
            isLoading={isLoading}
            error={error}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}