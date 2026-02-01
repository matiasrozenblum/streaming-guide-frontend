import React, { useState, useEffect } from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  IconButton,
  InputAdornment,
  CircularProgress,
  useTheme,
  Theme,
  Divider,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  VpnKey as VpnKeyIcon,
  Visibility,
  VisibilityOff,
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { signIn } from 'next-auth/react';
import { event as gaEvent } from '@/lib/gtag';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

// Import our separated step components
import IdentifierStep from './steps/IdentifierStep';
import PasswordStep from './steps/PasswordStep';
import CodeStep from './steps/CodeStep';
import RegisterStep from './steps/RegisterStep'; // New step for registration details
import SimplePasswordStep from './steps/SimplePasswordStep';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

type AuthMethod = 'email' | 'phone';
type AuthStep = 'identifier' | 'password' | 'code' | 'register';

// Interfaces for component props
export interface IdentifierStepProps {
  identifier: string;
  setIdentifier: (value: string) => void;
  method: AuthMethod;
  setMethod: (method: AuthMethod) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
}

export interface PasswordStepProps {
  password: string;
  setPassword: (value: string) => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
  isLoading: boolean;
  error: string;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  onBack: () => void;
  identifier: string;
}

export interface CodeStepProps {
  code: string;
  setCode: (value: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  isLoading: boolean;
  error: string;
  identifier: string;
  onBack: () => void;
  codeSent: boolean;
}

export interface RegisterStepProps {
  userData: {
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
    password?: string;
    confirmPassword?: string;
  };
  setUserData: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
  onBack: () => void;
}

// Styled components for the stepper
const QontoConnector = (theme: Theme, isLoading: boolean) => ({
  [`& .${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`& .${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main, // Always use primary color
    },
  },
  [`& .${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main, // Always use primary color
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider, // Use default divider color
    borderTopWidth: 3,
    borderRadius: 1,
  },
});

const BlueConnector = ({ isLoading }: { isLoading: boolean }) => {
  const theme = useTheme();
  return (
    <StepConnector sx={{
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
    }} />
  );
};

// 1. Icono del paso (StepIcon)
function CustomStepIcon(props: { active?: boolean; completed?: boolean; icon: React.ReactNode; isLoading?: boolean }) {
  const theme = useTheme();
  const { active = false, completed = false, icon, isLoading } = props;

  // Always use primary color for active/completed in dark mode
  const shouldBeBlue = active || completed;
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
          '0%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.1)', opacity: 0.8 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        }
      }}
    >
      {completed ? <CheckIcon fontSize="inherit" /> : icon}
    </Box>
  );
}

export default function LoginModal({ open, onClose, initialView = 'login' }: LoginModalProps) {
  const theme = useTheme();
  const [step, setStep] = useState<AuthStep>('identifier');
  const [method, setMethod] = useState<AuthMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // Registration data
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    birthDate: dayjs().subtract(18, 'year').format('YYYY-MM-DD'),
    gender: 'rather_not_say',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('identifier');
      setMethod('email'); // Default to email
      // Not clearing identifier to persist user input if they close and reopen quickly
      setPassword('');
      setCode('');
      setCodeSent(false);
      setError('');
      setIsLoading(false);
      setIsNewUser(false);
      setTempUserId(null);
      setRegisterData({
        firstName: '',
        lastName: '',
        birthDate: dayjs().subtract(18, 'year').format('YYYY-MM-DD'),
        gender: 'rather_not_say',
        password: '',
        confirmPassword: ''
      });
    }
  }, [open]);

  // Handle step transitions
  const handleNext = () => {
    // Current validation logic based on step
    if (step === 'identifier') {
      checkIdentifier();
    } else if (step === 'password') {
      handleLogin();
    } else if (step === 'code') {
      verifyCode();
    } else if (step === 'register') {
      handleRegister();
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 'password' || step === 'code') {
      setStep('identifier');
    } else if (step === 'register') {
      setStep('code');
    }
  };

  // API Interactions
  const checkIdentifier = async () => {
    if (!identifier) {
      setError('Por favor ingresa tu ' + (method === 'email' ? 'email' : 'número'));
      return;
    }

    if (method === 'email' && !/\S+@\S+\.\S+/.test(identifier)) {
      setError('Email inválido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Check if user exists
      const res = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, method }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Error al verificar usuario');

      if (data.exists) {
        // User exists, ask for password
        setIsNewUser(false);
        // If the user has a password set, go to password step.
        // If they don't (e.g. social login only before), we might need a flow for that,
        // but typically we'll ask for password or offer forgot password.
        setStep('password');
      } else {
        // New user, send verification code
        setIsNewUser(true);
        await sendCode();
        setStep('code');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setIsLoading(false);
    }
  };

  const sendCode = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, method }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al enviar código');

      setCodeSent(true);
      // Don't clear loading here if we're transitioning immediately, 
      // but in this flow we stay on 'code' step or move to it.
    } catch (err: any) {
      setError(err.message || 'Error enviando código');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Código inválido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code, method }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Código inválido');

      if (isNewUser) {
        // Code verified, move to registration details
        // We might get a temp token or session here if needed, 
        // for now let's assume we proceed to client-side register form
        setStep('register');
      } else {
        // If existing user and verifying code (e.g. forgot password flow - not implemented in this simplified view yet)
        // For now, this path is mostly for new users. 
        // If we implement passwordless login, this would log them in.
        // Assuming passwordless login for existing users via code:
        const signInRes = await signIn('credentials', {
          redirect: false,
          identifier,
          code, // specific credential provider for code login if exists, or handle differently
          // Actually, standard credentials provider usually takes password.
          // We'll stick to 'if existing user, use password' for now.
          // If this was a reset password flow, we'd handle it.
        });

        // For simplicity in this refactor, if existing user verified code (maybe recovery), 
        // we can log them in or let them reset password. 
        // Let's assume this code path is primarily for new users registration flow.
      }
    } catch (err: any) {
      setError(err.message || 'Error verificando código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) {
      setError('Ingresa tu contraseña');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        identifier,
        password,
      });

      if (result?.error) {
        throw new Error('Credenciales inválidas');
      }

      gaEvent({
        action: 'login',
        params: { method: 'credentials' }
      });

      onClose();
      // Optional: Redirect or refresh
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validate register data
    if (!registerData.firstName || !registerData.lastName || !registerData.password) {
      setError('Completa todos los campos obligatorios');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          method,
          ...registerData
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error en registro');

      // Auto login after register
      const result = await signIn('credentials', {
        redirect: false,
        identifier,
        password: registerData.password,
      });

      if (result?.error) throw new Error('Error al iniciar sesión automáticamente');

      gaEvent({
        action: 'sign_up',
        params: { method: 'credentials' }
      });

      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Error creando cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    await signIn(provider, { callbackUrl: window.location.href });
  };

  // Stepper props helper
  const getStepIndex = () => {
    switch (step) {
      case 'identifier': return 0;
      case 'password': return 1;
      case 'code': return 1;
      case 'register': return 2;
      default: return 0;
    }
  };

  // Render content based on step
  const renderStepContent = () => {
    switch (step) {
      case 'identifier':
        return (
          <IdentifierStep
            identifier={identifier}
            setIdentifier={setIdentifier}
            method={method}
            setMethod={setMethod}
            onSubmit={handleNext}
            isLoading={isLoading}
            error={error}
          />
        );
      case 'password':
        return (
          <SimplePasswordStep
            password={password}
            setPassword={setPassword}
            onSubmit={handleNext}
            onForgotPassword={() => {
              // Handle forgot password
              alert('Funcionalidad de "Olvidé mi contraseña" pendiente de implementación completa');
            }}
            isLoading={isLoading}
            error={error}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onBack={handleBack}
            identifier={identifier}
          />
        );
      case 'code':
        return (
          <CodeStep
            code={code}
            setCode={setCode}
            onSubmit={handleNext}
            onResend={sendCode}
            isLoading={isLoading}
            error={error}
            identifier={identifier}
            onBack={handleBack}
            codeSent={codeSent}
          />
        );
      case 'register':
        return (
          <RegisterStep
            userData={registerData}
            setUserData={(data) => setRegisterData({ ...registerData, ...data })}
            onSubmit={handleNext}
            isLoading={isLoading}
            error={error}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            backgroundColor: '#0F172A' // Always dark mode background
          }
        }
      }}
    >
      {/* Header with Stepper */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', px: 3, py: 2, backgroundColor: '#0F172A' }}> {/* Dark mode background */}
        <Box sx={{ width: '100%' }}>
          {/* Stepper logic */}
          <Box sx={{ width: '100%', mb: 1 }}>
            <Stepper
              alternativeLabel
              activeStep={getStepIndex()}
              connector={<BlueConnector isLoading={isLoading} />}
            >
              <Step>
                <StepLabel StepIconComponent={(p) => <CustomStepIcon {...p} icon={<PersonIcon />} isLoading={isLoading} />} />
              </Step>
              <Step>
                <StepLabel StepIconComponent={(p) => <CustomStepIcon {...p} icon={step === 'password' ? <VpnKeyIcon /> : <EmailIcon />} isLoading={isLoading} />} />
              </Step>
              {isNewUser && (
                <Step>
                  <StepLabel StepIconComponent={(p) => <CustomStepIcon {...p} icon={<CheckIcon />} isLoading={isLoading} />} />
                </Step>
              )}
            </Stepper>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content Area */}
      <Box sx={{ px: 3, pt: 2, backgroundColor: '#0F172A' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Social Login (Only show on identifier step) */}
      {step === 'identifier' && (
        <DialogContent sx={{ px: 3, py: 2, backgroundColor: '#0F172A' }}>
          <Divider sx={{ my: 2 }}><Typography variant="caption" color="text.secondary">O continúa con</Typography></Divider>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<GoogleIcon />}
            onClick={() => handleSocialLogin('google')}
            sx={{
              py: 1.5,
              borderColor: 'divider',
              color: 'text.primary',
              backgroundColor: '#0F172A',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(255,255,255,0.05)',
              },
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            Google
          </Button>
        </DialogContent>
      )}
    </Dialog>
  );
}