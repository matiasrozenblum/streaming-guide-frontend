'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@/contexts/SessionContext';
import { signIn } from 'next-auth/react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useDeviceId } from '@/hooks/useDeviceId';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Header from './Header';
import { event as gaEvent } from '@/lib/gtag';

interface ProfileCompletionFormProps {
  registrationToken: string;
  initialUser: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: string;
    birthDate: string;
  };
}

const getPasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return Math.min(strength, 4);
};

const getPasswordStrengthColor = (password: string): 'error' | 'warning' | 'primary' => {
  const strength = getPasswordStrength(password);
  if (strength <= 1) return 'error';
  if (strength <= 2) return 'warning';
  return 'primary';
};

export default function ProfileCompletionForm({ registrationToken, initialUser }: ProfileCompletionFormProps) {
  const { session, status } = useSessionContext();
  const typedSession = session as { user?: { id?: string; gender?: string; birthDate?: string; role?: string } };
  const router = useRouter();
  const { mode } = useThemeContext();
  const deviceId = useDeviceId();

  // Form state
  const [firstName, setFirstName] = useState(initialUser.firstName);
  const [lastName, setLastName] = useState(initialUser.lastName);
  const [gender, setGender] = useState(initialUser.gender || '');
  const [birthDate, setBirthDate] = useState(initialUser.birthDate ? initialUser.birthDate.slice(0, 10) : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track profile completion form visit
  useEffect(() => {
    gaEvent({
      action: 'profile_completion_form_visit',
      params: {
        has_initial_data: !!initialUser.firstName || !!initialUser.lastName,
        registration_token_provided: !!registrationToken,
      },
      userData: typedSession?.user || undefined
    });
  }, [initialUser.firstName, initialUser.lastName, registrationToken, typedSession?.user]);

  // Block navigation when profile is incomplete
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', '/profile-completion');
      setErrorMessage('Por favor completa tu perfil antes de salir');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', '/profile-completion');
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Complete profile with all data
  const completeProfile = async () => {
    if (!registrationToken) return;
    
    if (!firstName || !lastName || !birthDate || !gender || !password) {
      setErrorMessage('Todos los campos son obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/complete-profile-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_token: registrationToken,
          firstName,
          lastName,
          gender,
          birthDate,
          password,
          deviceId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al completar el perfil');
      }

      const data = await res.json();
      
      // Update the session with the new tokens
      await signIn('credentials', { 
        redirect: false, 
        accessToken: data.access_token,
        refreshToken: data.refresh_token 
      });
      
      setSuccessMessage('Perfil completado correctamente');
      
      // Track successful profile completion
      gaEvent({
        action: 'profile_completed_all',
        params: {
          fields_completed: 'firstName,lastName,gender,birthDate,password',
          was_social_signup: true,
        },
        userData: typedSession?.user || undefined
      });

      // Redirect to profile page after a short delay
      setTimeout(() => {
        router.push('/profile');
      }, 2000);

    } catch (error) {
      console.error('Profile completion error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error al completar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  if (status !== 'authenticated') return null;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: mode === 'light'
          ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
          : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
      }}
    >
      <Header />
      <Container 
        maxWidth="md" 
        sx={{ 
          mt: 4, 
          mb: 6,
          px: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 600 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <IconButton
                onClick={() => {
                  setErrorMessage('Por favor completa tu perfil antes de salir');
                }}
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Complete su perfil
              </Typography>
            </Box>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '2px solid',
              borderColor: 'warning.main',
              borderRadius: 2,
              background: (theme) => theme.palette.mode === 'light'
                ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
                : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Datos personales
            </Typography>
            
            <Box
              component="form"
              onSubmit={evt => {
                evt.preventDefault();
                completeProfile();
              }}
            >
              <Grid container spacing={2}>
                <Grid component="div" size={6}>
                  <TextField
                    label="Nombre*"
                    fullWidth
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    variant="outlined"
                    size="small"
                    required
                  />
                </Grid>
                <Grid component="div" size={6}>
                  <TextField
                    label="Apellido*"
                    fullWidth
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    variant="outlined"
                    size="small"
                    required
                  />
                </Grid>
                <Grid component="div" size={6}>
                  <TextField
                    label="Fecha de nacimiento*"
                    type="date"
                    fullWidth
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid component="div" size={6}>
                  <TextField
                    label="Género*"
                    select
                    fullWidth
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    variant="outlined"
                    size="small"
                    required
                  >
                    <MenuItem value="male">Masculino</MenuItem>
                    <MenuItem value="female">Femenino</MenuItem>
                    <MenuItem value="non_binary">No binario</MenuItem>
                    <MenuItem value="rather_not_say">Prefiero no decir</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 4, mb: 3, fontWeight: 600 }}>
                Contraseña
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Nueva contraseña*"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                {password && (
                  <Box>
                    <LinearProgress
                      variant="determinate"
                      value={(getPasswordStrength(password) / 4) * 100}
                      color={getPasswordStrengthColor(password)}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                      Fuerza: {getPasswordStrength(password) === 1 ? 'Débil' : 
                               getPasswordStrength(password) === 2 ? 'Media' : 
                               getPasswordStrength(password) === 3 ? 'Buena' : 'Excelente'}
                    </Typography>
                  </Box>
                )}
                
                <TextField
                  label="Confirmar contraseña*"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  onClick={() => {
                    setErrorMessage('Por favor completa tu perfil antes de salir');
                  }}
                  variant="outlined"
                  size="small"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained"
                  size="small"
                  disabled={isLoading}
                >
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </motion.div>
        </Box>
      </Container>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </MuiAlert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setErrorMessage(null)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
} 