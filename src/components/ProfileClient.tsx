'use client';

import React, { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  IconButton,
  Typography,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Stack,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Collapse,
  Snackbar,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { useThemeContext } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { event as gaEvent } from '@/lib/gtag';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { CookiePreferencesModal } from '@/components/CookiePreferencesModal';
import { useDeviceId } from '@/hooks/useDeviceId';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import dayjs from 'dayjs';
import MuiAlert from '@mui/material/Alert';
import { SxProps, Theme } from '@mui/material/styles';

const MotionBox = motion(Box);

const getPasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength++;
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

const ProfileSection = ({ title, value, onEdit, sx }: { title: string; value: React.ReactNode; onEdit?: () => void; sx?: SxProps<Theme> }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      mb: 2,
      background: (theme) => theme.palette.mode === 'light'
        ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
        : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
      backdropFilter: 'blur(8px)',
      borderRadius: 2,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: (theme) => theme.palette.mode === 'light'
          ? '0 8px 16px rgba(0,0,0,0.1)'
          : '0 8px 16px rgba(0,0,0,0.3)',
      },
      ...sx,
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
      <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</Typography>
      {onEdit && (
        <IconButton
          onClick={onEdit}
          size="small"
          sx={{
            color: 'primary.main',
            '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' }
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
    {value}
  </Paper>
);

interface ProfileClientProps {
  initialUser: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: string;
    birthDate: string;
  };
  isProfileIncomplete?: boolean;
  registrationToken?: string;
}

const genderTranslations: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  non_binary: 'No binario',
  rather_not_say: 'Prefiero no decir'
};

const mapGenderToBackend = (g: string) => {
  switch (g) {
    case 'masculino': return 'male';
    case 'femenino': return 'female';
    case 'no_binario': return 'non_binary';
    case 'prefiero_no_decir': return 'rather_not_say';
    default: return 'rather_not_say';
  }
};

export default function ProfileClient({ initialUser, isProfileIncomplete = false, registrationToken }: ProfileClientProps) {
  const { session, status } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const router = useRouter();
  const { mode } = useThemeContext();
  const { consent, openPreferences } = useCookieConsent();
  const deviceId = useDeviceId();

  // Track profile page visit
  useEffect(() => {
    gaEvent({
      action: 'profile_page_visit',
      params: {
        has_initial_data: !!initialUser.firstName || !!initialUser.lastName,
        is_profile_incomplete: isProfileIncomplete,
      },
      userData: typedSession?.user
    });
  }, [initialUser.firstName, initialUser.lastName, typedSession?.user, isProfileIncomplete]);

  useEffect(() => {
    // If there is no real user, redirect to home
    if (!typedSession?.user || !typedSession.user.id) {
      router.push('/');
    }
  }, [typedSession, router]);

  // If profile is incomplete, show a message and prevent navigation
  useEffect(() => {
    if (isProfileIncomplete) {
      setSuccessMessage('Por favor completa tu perfil para continuar');
      
      // Block navigation when profile is incomplete
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        window.history.pushState(null, '', '/profile');
        setErrorMessage('Por favor completa tu perfil antes de salir');
      };
      
      // Add event listeners
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      
      // Push current state to prevent back button
      window.history.pushState(null, '', '/profile');
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isProfileIncomplete]);

  // Fetch user data when component mounts and profile is complete
  useEffect(() => {
    if (!isProfileIncomplete && typedSession?.user?.id && typedSession.accessToken) {
      const fetchUserData = async () => {
        try {
          const res = await fetch(`/api/users/${typedSession.user.id}`, {
            headers: {
              Authorization: `Bearer ${typedSession.accessToken}`,
              'Content-Type': 'application/json'
            },
          });
          
          if (res.ok) {
            const data = await res.json();
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setEmail(data.email || '');
            setPhone(data.phone || '');
            setGender(data.gender || '');
            setBirthDate(data.birthDate ? data.birthDate.slice(0, 10) : '');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      
      fetchUserData();
    }
  }, [isProfileIncomplete, typedSession]);

  // sección en edición
  const [editSection, setEditSection] =
    useState<'none' | 'personal' | 'email' | 'phone' | 'password'>(isProfileIncomplete ? 'personal' : 'none');
  // (Removed) const [passwordEditMode, setPasswordEditMode] = useState(isProfileIncomplete);

  // datos de usuario
  const [firstName, setFirstName] = useState(initialUser.firstName);
  const [lastName, setLastName] = useState(initialUser.lastName);
  const [email, setEmail] = useState(initialUser.email);
  const [phone, setPhone] = useState(initialUser.phone);
  const [gender, setGender] = useState(initialUser.gender || '');
  const [birthDate, setBirthDate] = useState(
    initialUser.birthDate ? initialUser.birthDate.slice(0, 10) : ''
  );
  const [personalError, setPersonalError] = useState('');

  // códigos de verificación
  const [codeSent, setCodeSent] = useState({ email: false, phone: false, password: false });
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [passwordCode, setPasswordCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input');
  const [newEmail, setNewEmail] = useState('');
  const [passwordStep, setPasswordStep] = useState<'verify' | 'change'>('verify');

  // diálogo cancelar cuenta
  const [openCancel, setOpenCancel] = useState(false);

  // password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // cookies section collapse
  const [cookiesOpen, setCookiesOpen] = useState(false);

  // Snackbar for success and error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- All handlers from original ProfilePage ---
  const savePersonalData = async () => {
    if (!typedSession) return;
    setPersonalError('');
    // Validate birthDate (must be 18+)
    if (!birthDate) {
      setPersonalError('La fecha de nacimiento es obligatoria');
      setErrorMessage('La fecha de nacimiento es obligatoria');
      return;
    }
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) {
      setPersonalError('Debes ser mayor de 18 años para registrarte');
      setErrorMessage('Debes ser mayor de 18 años para registrarte');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[ProfileClient] savePersonalData - isProfileIncomplete:', isProfileIncomplete);
      console.log('[ProfileClient] savePersonalData - registrationToken:', registrationToken);
      if (isProfileIncomplete && registrationToken) {
        // Complete the profile for social login user (personal data only)
        const res = await fetch('/api/auth/complete-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registration_token: registrationToken,
            firstName,
            lastName,
            gender: mapGenderToBackend(gender),
            birthDate,
            deviceId,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Error al completar el perfil');
        }
        setSuccessMessage('Datos personales completados correctamente');
        setEditSection('none');
        // Refresh the session to update the profile incomplete status
        window.location.reload();
      } else {
        // Regular profile update
        const id = typedSession.user.id;
        const res = await fetch(`/api/users/${id}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, gender, birthDate }),
          });
        if (res.ok) {
          setSuccessMessage('Datos actualizados correctamente');
          setEditSection('none');
        } else {
          setPersonalError('Error al actualizar');
          setErrorMessage('Error al actualizar los datos');
        }
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setPersonalError('Error al actualizar');
      setErrorMessage(error instanceof Error ? error.message : 'Error al actualizar los datos');
    } finally {
      setIsLoading(false);
    }

    // Track successful profile update
    type ProfileFields = { firstName: string; lastName: string; gender: string; birthDate: string };
    gaEvent({
      action: 'profile_update',
      params: {
        fields_updated: ['firstName', 'lastName', 'gender', 'birthDate']
          .filter(key => ({ firstName, lastName, gender, birthDate })[key as keyof ProfileFields] !== initialUser[key as keyof ProfileFields])
          .join(','),
        has_password_change: false,
        was_profile_incomplete: isProfileIncomplete,
      },
      userData: typedSession?.user
    });
  };

  const savePassword = async () => {
    if (!typedSession || !registrationToken) return;
    
    if (!newPassword) {
      setErrorMessage('La contraseña es obligatoria');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[ProfileClient] savePassword - setting password for social user');
      // Set password for social login user (bypass email verification)
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_token: registrationToken,
          password: newPassword,
          deviceId,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al establecer la contraseña');
      }
      setSuccessMessage('Contraseña establecida correctamente');
      setNewPassword('');
      setConfirmPassword('');
      setEditSection('none');
    } catch (error) {
      console.error('Password set error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error al establecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  // Keep the old saveNames function for backward compatibility but redirect to savePersonalData
  const saveNames = savePersonalData;

  const sendCode = async (field: 'email' | 'phone' | 'password') => {
    try {
      const identifier = field === 'email' ? newEmail : email;
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al enviar el código');
      }

      setCodeSent(prev => ({ ...prev, [field]: true }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al enviar el código');
      setErrorMessage(error instanceof Error ? error.message : 'Error al enviar el código');
    }
  };

  const verifyAndUpdate = async (field: 'email' | 'phone' | 'password') => {
    if (field === 'password') {
      if (passwordStep === 'verify') {
        try {
          // First verify the code
          const verifyRes = await fetch('/api/auth/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: email, code: passwordCode }),
          });

          if (!verifyRes.ok) {
            const error = await verifyRes.json();
            throw new Error(error.message || 'Error al verificar el código');
          }

          // If verification successful, move to password change step
          setPasswordStep('change');
          setPasswordCode('');
        } catch (error) {
          alert(error instanceof Error ? error.message : 'Error al verificar el código');
          setErrorMessage(error instanceof Error ? error.message : 'Error al verificar el código');
        }
      } else if (passwordStep === 'change') {
        if (newPassword !== confirmPassword) {
          alert('Las contraseñas no coinciden');
          setErrorMessage('Las contraseñas no coinciden');
          return;
        }

        try {
          // Update the password using PATCH /api/users/:id
          const updateRes = await fetch(`/api/users/${typedSession?.user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword }),
          });

          if (!updateRes.ok) {
            const error = await updateRes.json();
            throw new Error(error.message || 'Error al actualizar la contraseña');
          }

          // Update successful
          setEditSection('none');
          setPasswordStep('verify');
          setNewPassword('');
          setConfirmPassword('');
          setCodeSent(prev => ({ ...prev, password: false }));
          alert('Contraseña actualizada exitosamente');
        } catch (error) {
          alert(error instanceof Error ? error.message : 'Error al cambiar la contraseña');
          setErrorMessage(error instanceof Error ? error.message : 'Error al cambiar la contraseña');
        }
      }
    } else if (field === 'email') {
      try {
        // First verify the code
        const verifyRes = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: newEmail, code: emailCode }),
        });

        if (!verifyRes.ok) {
          const error = await verifyRes.json();
          throw new Error(error.message || 'Error al verificar el código');
        }

        // Then update the email using the users endpoint
        const updateRes = await fetch(`/api/users/${typedSession?.user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newEmail }),
        });

        if (!updateRes.ok) {
          const error = await updateRes.json();
          throw new Error(error.message || 'Error al actualizar el email');
        }

        // Update successful
        setEmail(newEmail);
        setEditSection('none');
        setEmailStep('input');
        setNewEmail('');
        setEmailCode('');
        setCodeSent(prev => ({ ...prev, email: false }));
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error al cambiar el email');
        setErrorMessage(error instanceof Error ? error.message : 'Error al cambiar el email');
      }
    } else if (field === 'phone') {
      try {
        const res = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: phone }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Error al enviar el código');
        }

        setCodeSent(prev => ({ ...prev, phone: true }));
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error al enviar el código');
        setErrorMessage(error instanceof Error ? error.message : 'Error al enviar el código');
      }
    }
  };

  const cancelAccount = async () => {
    if (!typedSession) return;
    const id = typedSession.user.id;
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      await signOut({ callbackUrl: '/' });
    } else {
      alert('Error al cancelar la cuenta');
      setErrorMessage('Error al cancelar la cuenta');
    }
  };

  if (status !== 'authenticated') return null;

  // Add orange border to personal data section if missing required fields
  const personalSectionError = isProfileIncomplete && (!birthDate || !gender || !firstName || !lastName);
  // Password is optional, so no orange border needed
  const passwordSectionError = false;

  // --- Full UI from original ProfilePage ---
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: mode === 'light'
          ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
          : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
          py: { xs: 1, sm: 2 },
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
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 4,
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  background: mode === 'light'
                    ? 'linear-gradient(to right, #1a237e, #0d47a1)'
                    : 'linear-gradient(to right, #90caf9, #42a5f5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Mi cuenta
              </Typography>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/')}
                variant="outlined"
                size="large"
                disabled={isProfileIncomplete}
                title={isProfileIncomplete ? 'Completa tu perfil para continuar' : ''}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                Volver
              </Button>
            </Box>
            {isProfileIncomplete && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  background: (theme) => theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)'
                    : 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
                  border: '2px solid',
                  borderColor: 'warning.main',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <LockOutlinedIcon color="warning" />
                  <Typography variant="h6" color="warning.dark" sx={{ fontWeight: 600 }}>
                    Perfil incompleto
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  Para continuar usando la aplicación, necesitas completar tu perfil con tu fecha de nacimiento y género.
                </Typography>
              </Paper>
            )}
            
            <Stack spacing={2}>
              <ProfileSection
                title="Datos personales"
                value={
                  editSection !== 'personal' ? (
                    <Grid container spacing={2}>
                      <Grid component="div" size={6}>
                        <Typography color="text.secondary" gutterBottom>
                          Nombre
                        </Typography>
                        <Typography variant="body1">
                          {firstName || '—'}
                        </Typography>
                      </Grid>
                      <Grid component="div" size={6}>
                        <Typography color="text.secondary" gutterBottom>
                          Apellido
                        </Typography>
                        <Typography variant="body1">
                          {lastName || '—'}
                        </Typography>
                      </Grid>
                      <Grid component="div" size={6}>
                        <Typography color="text.secondary" gutterBottom>
                          Fecha de nacimiento
                        </Typography>
                        <Typography variant="body1">
                          {birthDate ? dayjs(birthDate).format('DD/MM/YYYY') : '—'}
                        </Typography>
                      </Grid>
                      <Grid component="div" size={6}>
                        <Typography color="text.secondary" gutterBottom>
                          Género
                        </Typography>
                        <Typography variant="body1">
                          {gender ? genderTranslations[gender] || gender : '—'}
                        </Typography>
                      </Grid>
                    </Grid>
                  ) : (
                    <Box
                      component="form"
                      onSubmit={e => {
                        e.preventDefault();
                        saveNames();
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid component="div" size={6}>
                          <TextField
                            label="Nombre"
                            fullWidth
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid component="div" size={6}>
                          <TextField
                            label="Apellido"
                            fullWidth
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid component="div" size={6}>
                          <TextField
                            label="Fecha de nacimiento"
                            type="date"
                            fullWidth
                            value={birthDate}
                            onChange={e => setBirthDate(e.target.value)}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid component="div" size={6}>
                          <TextField
                            label="Género"
                            select
                            fullWidth
                            value={gender}
                            onChange={e => setGender(e.target.value)}
                            variant="outlined"
                            size="small"
                          >
                            <MenuItem value="male">Masculino</MenuItem>
                            <MenuItem value="female">Femenino</MenuItem>
                            <MenuItem value="non_binary">No binario</MenuItem>
                            <MenuItem value="rather_not_say">Prefiero no decir</MenuItem>
                          </TextField>
                        </Grid>
                        {personalError && (
                          <Grid component="div" size={12}>
                            <Typography color="error" variant="body2" sx={{ mt: 1 }}>{personalError}</Typography>
                          </Grid>
                        )}
                        <Grid component="div" size={12}>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                            <Button 
                              onClick={() => setEditSection('none')}
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
                        </Grid>
                      </Grid>
                    </Box>
                  )
                }
                onEdit={() => setEditSection('personal')}
                sx={{ border: personalSectionError ? '2px solid orange' : undefined }}
              />
              <ProfileSection
                title="Correo electrónico"
                value={
                  editSection === 'email' ? (
                    emailStep === 'input' ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          label="Nuevo correo electrónico"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          fullWidth
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            onClick={() => {
                              if (!newEmail) {
                                alert('Por favor ingresa un correo electrónico');
                                return;
                              }
                              const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                              if (!re.test(newEmail)) {
                                alert('Correo electrónico inválido');
                                return;
                              }
                              sendCode('email');
                              setEmailStep('verify');
                            }}
                          >
                            Enviar código
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setEditSection('none');
                              setEmailStep('input');
                              setNewEmail('');
                            }}
                          >
                            Cancelar
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Se ha enviado un código de verificación a {newEmail}
                        </Typography>
                        <TextField
                          label="Código de verificación"
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value)}
                          fullWidth
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            onClick={() => verifyAndUpdate('email')}
                          >
                            Verificar y actualizar
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setEmailStep('input');
                              setEmailCode('');
                            }}
                          >
                            Volver
                          </Button>
                        </Box>
                      </Box>
                    )
                  ) : (
                    <Typography>{email}</Typography>
                  )
                }
                onEdit={() => setEditSection('email')}
              />
              <ProfileSection
                title="Teléfono"
                value={
                  <Typography variant="body1">{phone || '—'}</Typography>
                }
                onEdit={() => setEditSection('phone')}
              />
              <ProfileSection
                title={isProfileIncomplete ? "Contraseña (opcional)" : "Contraseña"}
                value={
                  isProfileIncomplete ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Establece una contraseña para mayor seguridad (opcional)
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Nueva contraseña"
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          fullWidth
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
                        {newPassword && (
                          <>
                            <Box>
                              <LinearProgress
                                variant="determinate"
                                value={(getPasswordStrength(newPassword) / 4) * 100}
                                color={getPasswordStrengthColor(newPassword)}
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                              <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                Fuerza: {getPasswordStrength(newPassword) === 1 ? 'Débil' : 
                                         getPasswordStrength(newPassword) === 2 ? 'Media' : 
                                         getPasswordStrength(newPassword) === 3 ? 'Buena' : 'Excelente'}
                              </Typography>
                            </Box>
                            <TextField
                              label="Confirmar contraseña"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              fullWidth
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
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button 
                                onClick={() => {
                                  setNewPassword('');
                                  setConfirmPassword('');
                                }}
                                variant="outlined"
                                size="small"
                              >
                                Cancelar
                              </Button>
                              <Button 
                                onClick={savePassword}
                                variant="contained"
                                size="small"
                                disabled={isLoading || !newPassword || !confirmPassword}
                              >
                                {isLoading ? 'Guardando...' : 'Establecer contraseña'}
                              </Button>
                            </Box>
                          </>
                        )}
                      </Stack>
                    </Box>
                  ) : (
                    <Typography variant="body1">••••••••</Typography>
                  )
                }
                onEdit={isProfileIncomplete ? undefined : () => setEditSection('password')}
                sx={{ border: passwordSectionError ? '2px solid orange' : undefined }}
              />
              
              <ProfileSection
                title="Preferencias de Cookies"
                value={
                  <>
                    <Button
                      onClick={() => setCookiesOpen((open) => !open)}
                      endIcon={
                        <ExpandMoreIcon
                          style={{
                            transform: cookiesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                          }}
                        />
                      }
                      sx={{ mb: 1, textTransform: 'none' }}
                      size="small"
                    >
                      {cookiesOpen ? 'Ocultar detalles' : 'Ver detalles'}
                    </Button>
                    <Collapse in={cookiesOpen}>
                      <Grid container spacing={2}>
                        <Grid component="div" size={6}>
                          <Typography color="text.secondary" gutterBottom>
                            Cookies de Análisis
                          </Typography>
                          <Typography variant="body1">
                            {consent?.analytics ? '✅ Habilitadas' : '❌ Deshabilitadas'}
                          </Typography>
                        </Grid>
                        <Grid component="div" size={6}>
                          <Typography color="text.secondary" gutterBottom>
                            Cookies de Marketing
                          </Typography>
                          <Typography variant="body1">
                            {consent?.marketing ? '✅ Habilitadas' : '❌ Deshabilitadas'}
                          </Typography>
                        </Grid>
                        <Grid component="div" size={6}>
                          <Typography color="text.secondary" gutterBottom>
                            Cookies de Preferencias
                          </Typography>
                          <Typography variant="body1">
                            {consent?.preferences ? '✅ Habilitadas' : '❌ Deshabilitadas'}
                          </Typography>
                        </Grid>
                        <Grid component="div" size={6}>
                          <Typography color="text.secondary" gutterBottom>
                            Cookies Necesarias
                          </Typography>
                          <Typography variant="body1">
                            ✅ Siempre habilitadas
                          </Typography>
                        </Grid>
                      </Grid>
                    </Collapse>
                  </>
                }
                onEdit={() => openPreferences()}
              />
            </Stack>
            <Box sx={{ mt: 6, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="error"
                onClick={() => setOpenCancel(true)}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                Cancelar mi usuario
              </Button>
            </Box>
          </MotionBox>
        </Box>
      </Container>
      <Dialog 
        open={editSection === 'phone'} 
        onClose={() => setEditSection('none')}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: '90%', sm: 400 }
          }
        }}
      >
        <DialogTitle>Cambiar teléfono</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Ingresá el nuevo teléfono para enviar un código de verificación.
          </DialogContentText>
          <TextField
            label="Nuevo teléfono"
            fullWidth
            value={phone}
            onChange={e => setPhone(e.target.value)}
            variant="outlined"
          />
          <Button
            sx={{ mt: 3 }}
            variant="contained"
            disabled={codeSent.phone}
            onClick={() => sendCode('phone')}
            fullWidth
          >
            {codeSent.phone ? 'Reenviar código' : 'Enviar código'}
          </Button>
          {codeSent.phone && (
            <>
              <TextField
                label="Código de verificación"
                fullWidth
                value={phoneCode}
                onChange={e => setPhoneCode(e.target.value)}
                sx={{ mt: 3 }}
                variant="outlined"
              />
              <Button 
                sx={{ mt: 2 }} 
                onClick={() => verifyAndUpdate('phone')}
                variant="contained"
                fullWidth
              >
                Confirmar
              </Button>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditSection('none')} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog 
        open={editSection === 'password'} 
        onClose={() => {
          setEditSection('none');
          setPasswordStep('verify');
          setPasswordCode('');
          setNewPassword('');
          setConfirmPassword('');
          setCodeSent(prev => ({ ...prev, password: false }));
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: '90%', sm: 400 }
          }
        }}
      >
        <DialogTitle>
          {passwordStep === 'verify' ? 'Verificar identidad' : 'Cambiar contraseña'}
        </DialogTitle>
        <DialogContent>
          {passwordStep === 'verify' ? (
            <>
              <DialogContentText sx={{ mb: 3 }}>
                Envía un código para verificar tu identidad antes de cambiar la contraseña.
              </DialogContentText>
              <Button
                variant="contained"
                disabled={codeSent.password}
                onClick={() => sendCode('password')}
                fullWidth
              >
                {codeSent.password ? 'Reenviar código' : 'Enviar código'}
              </Button>
              {codeSent.password && (
                <TextField
                  label="Código de verificación"
                  fullWidth
                  value={passwordCode}
                  onChange={e => setPasswordCode(e.target.value)}
                  sx={{ mt: 3 }}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKeyIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            </>
          ) : (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Nueva contraseña"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(s => !s)}>
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {newPassword && (
                <>
                  <LinearProgress 
                    variant="determinate" 
                    value={(getPasswordStrength(newPassword)/4)*100} 
                    color={getPasswordStrengthColor(newPassword)} 
                  />
                  <Typography variant="caption">
                    Fuerza: {['Muy débil','Débil','Media','Fuerte','Muy fuerte'][getPasswordStrength(newPassword)]}
                  </Typography>
                </>
              )}
              <TextField
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                variant="outlined"
                error={confirmPassword !== '' && newPassword !== confirmPassword}
                helperText={confirmPassword !== '' && newPassword !== confirmPassword ? 'Las contraseñas no coinciden' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowConfirmPassword(s => !s)}>
                        {showConfirmPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          {passwordStep === 'verify' ? (
            <>
              <Button onClick={() => setEditSection('none')} variant="outlined">
                Cancelar
              </Button>
              <Button
                onClick={() => verifyAndUpdate('password')}
                variant="contained"
                disabled={!passwordCode}
              >
                Verificar
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => setPasswordStep('verify')} 
                variant="outlined"
              >
                Volver
              </Button>
              <Button 
                onClick={() => verifyAndUpdate('password')}
                variant="contained"
                disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || getPasswordStrength(newPassword) < 2}
              >
                Cambiar contraseña
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      <Dialog 
        open={openCancel} 
        onClose={() => setOpenCancel(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: '90%', sm: 400 }
          }
        }}
      >
        <DialogTitle>Confirmar cancelación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro que deseas cancelar tu usuario? Esta acción es irreversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenCancel(false)} variant="outlined">
            Volver
          </Button>
          <Button 
            onClick={cancelAccount}
            variant="contained"
            color="error"
          >
            Sí, cancelar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Cookie Preferences Modal */}
      <CookiePreferencesModal />
      {/* Snackbar for success and error messages */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </MuiAlert>
      </Snackbar>
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={5000}
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