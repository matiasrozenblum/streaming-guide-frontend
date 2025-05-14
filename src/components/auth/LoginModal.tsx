'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  IconButton,
  Box,
  Stack,
  useTheme,
} from '@mui/material';
import { X } from 'lucide-react';
import StepIndicator from './StepIndicator';
import EmailStep from './steps/EmailStep';
import CodeStep from './steps/CodeStep';
import ProfileStep from './steps/ProfileStep';
import PasswordStep from './steps/PasswordStep';
import ExistingUserStep from './steps/ExistingUserStep';
import { AuthService } from '@/services/auth';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'email' | 'code' | 'profile' | 'password' | 'existing-user';

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const theme = useTheme();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUserExisting, setIsUserExisting] = useState<boolean>(false);

  useEffect(() => {
    if (!open) {
      setStep('email');
      setEmail('');
      setCode('');
      setFirstName('');
      setLastName('');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setIsLoading(false);
      setIsUserExisting(false);
    }
  }, [open]);

  const getProgress = () => {
    const steps = isUserExisting
      ? ['email', 'existing-user']
      : ['email', 'code', 'profile', 'password'];
    const idx = steps.indexOf(step);
    return ((idx + 1) / steps.length) * 100;
  };

  // Title based on step
  const titles: Record<Step, string> = {
    email: 'Acceder / Registrarse',
    'existing-user': 'Iniciar Sesión',
    code: 'Verificar Correo',
    profile: 'Completa tu Perfil',
    password: 'Crea tu Contraseña',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[24],
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
        }}
      >
        <Box component="span" sx={{ typography: 'h6' }}>
          {titles[step]}
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <LinearProgress
        variant="determinate"
        value={getProgress()}
        sx={{ height: 4, backgroundColor: theme.palette.divider }}
      />

      <Box sx={{ px: 3, pt: 2 }}>
        <StepIndicator currentStep={step} isUserExisting={isUserExisting} />
      </Box>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={3}>
          {step === 'email' && (
            <EmailStep
              email={email}
              onSubmit={async (e) => {
                setIsLoading(true);
                setError('');
                setEmail(e);
                try {
                  const { exists } = await AuthService.checkUserExists(e);
                  setIsUserExisting(exists);
                  if (exists) setStep('existing-user');
                  else {
                    await AuthService.sendCode(e);
                    setStep('code');
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Error');
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
              onSubmit={async (p) => {
                setIsLoading(true);
                setError('');
                try {
                  await AuthService.login(email, p);
                  onClose();
                  window.location.reload();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Error');
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
              code={code}
              onSubmit={async (c) => {
                setIsLoading(true);
                setError('');
                try {
                  const { isNew } = await AuthService.verifyCode(email, c);
                  if (isNew) setStep('profile');
                  else {
                    onClose();
                    window.location.reload();
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Error');
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
              firstName={firstName}
              lastName={lastName}
              onSubmit={(f, l) => {
                setFirstName(f);
                setLastName(l);
                setStep('password');
              }}
              onBack={() => setStep('code')}
              error={error}
            />
          )}

          {step === 'password' && (
            <PasswordStep
              password={password}
              confirmPassword={confirmPassword}
              onSubmit={async (p) => {
                setIsLoading(true);
                setError('');
                try {
                  await AuthService.register({ firstName, lastName, password: p });
                  onClose();
                  window.location.reload();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Error');
                }
                setIsLoading(false);
              }}
              onBack={() => setStep('profile')}
              isLoading={isLoading}
              error={error}
            />
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}