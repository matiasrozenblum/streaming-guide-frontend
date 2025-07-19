'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@/contexts/SessionContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import Header from './Header';
import { CookiePreferencesModal } from './CookiePreferencesModal';
import { event as gaEvent } from '@/lib/gtag';
import dayjs from 'dayjs';

interface SessionWithToken {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    gender?: string;
    birthDate?: string;
    firstName?: string;
    lastName?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  profileIncomplete?: boolean;
  registrationToken?: string;
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
  console.log('mapGenderToBackend', g);
  switch (g.toLowerCase()) {
    case 'masculino': return 'male';
    case 'femenino': return 'female';
    case 'no binario': return 'non_binary';
    case 'prefiero no decir': return 'rather_not_say';
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

  // Form state
  const [firstName, setFirstName] = useState(initialUser.firstName);
  const [lastName, setLastName] = useState(initialUser.lastName);
  const [email] = useState(initialUser.email);
  const [phone, setPhone] = useState(initialUser.phone || '');
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
  const [editSection, setEditSection] = useState<'none' | 'phone'>('none');
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);

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

  // Redirect if no session
  useEffect(() => {
    if (!typedSession?.user || !typedSession.user.id) {
      router.push('/');
    }
  }, [typedSession, router]);

  // Block navigation when profile is incomplete
  useEffect(() => {
    if (isProfileIncomplete) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        window.history.pushState(null, '', '/profile');
        setErrorMessage('Por favor completa tu perfil antes de salir');
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      window.history.pushState(null, '', '/profile');
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isProfileIncomplete]);

  // Complete profile with all data
  const completeProfile = async () => {
    if (!typedSession || !registrationToken) return;
    
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
          gender: mapGenderToBackend(gender),
          birthDate,
          password,
          deviceId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al completar el perfil');
      }

      await res.json();
      
      setSuccessMessage('Perfil completado correctamente');
      
      // Update session with new tokens
      // Note: In a real app, you'd update the session here
      // For now, we'll redirect to home after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);

      gaEvent({
        action: 'profile_completed_all',
        params: {
          fields_completed: 'firstName,lastName,gender,birthDate,password',
          was_social_signup: true,
        },
        userData: typedSession?.user
      });

    } catch (error) {
      console.error('Profile completion error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error al completar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  // Regular profile update (for complete profiles)
  const updateProfile = async () => {
    if (!typedSession) return;
    
    if (!firstName || !lastName || !birthDate || !gender) {
      setErrorMessage('Todos los campos son obligatorios');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${typedSession.user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, gender, birthDate }),
      });

      if (res.ok) {
        setSuccessMessage('Datos actualizados correctamente');
      } else {
        setErrorMessage('Error al actualizar los datos');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error al actualizar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel account
  const cancelAccount = async () => {
    if (!typedSession) return;
    const id = typedSession.user.id;
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      // Redirect to home after account deletion
      router.push('/');
    } else {
      setErrorMessage('Error al cancelar la cuenta');
    }
  };

  if (status !== 'authenticated') return null;

  // If profile is incomplete, show the simplified completion form
  if (isProfileIncomplete) {
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
        <Container maxWidth="xs" sx={{ py: 4 }}>
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

  // Regular profile page for complete users
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
      <Container maxWidth="xs" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <IconButton
              onClick={() => router.push('/')}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Mi cuenta
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 1.5,
                background: (theme) => theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
                  : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: (theme) => theme.palette.mode === 'light'
                    ? '0 4px 8px rgba(0,0,0,0.1)'
                    : '0 4px 8px rgba(0,0,0,0.3)',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  Datos personales
                </Typography>
                <IconButton
                  onClick={() => updateProfile()}
                  size="small"
                  sx={{
                    color: 'primary.main',
                    '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
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
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 1.5,
                background: (theme) => theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
                  : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: (theme) => theme.palette.mode === 'light'
                    ? '0 4px 8px rgba(0,0,0,0.1)'
                    : '0 4px 8px rgba(0,0,0,0.3)',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  Correo electrónico
                </Typography>
              </Box>
              <Typography variant="body1">
                {email}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 1.5,
                background: (theme) => theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
                  : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: (theme) => theme.palette.mode === 'light'
                    ? '0 4px 8px rgba(0,0,0,0.1)'
                    : '0 4px 8px rgba(0,0,0,0.3)',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  Teléfono
                </Typography>
                <IconButton
                  onClick={() => setEditSection('phone')}
                  size="small"
                  sx={{
                    color: 'primary.main',
                    '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body1">
                {phone || '—'}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 1.5,
                background: (theme) => theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
                  : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: (theme) => theme.palette.mode === 'light'
                    ? '0 4px 8px rgba(0,0,0,0.1)'
                    : '0 4px 8px rgba(0,0,0,0.3)',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  Preferencias de Cookies
                </Typography>
                <IconButton
                  onClick={() => openPreferences()}
                  size="small"
                  sx={{
                    color: 'primary.main',
                    '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
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
            </Paper>
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
        </motion.div>
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
            Ingresa tu número de teléfono.
          </DialogContentText>
          <TextField
            label="Teléfono"
            fullWidth
            value={phone}
            onChange={e => setPhone(e.target.value)}
            variant="outlined"
            placeholder="+54 9 11 1234-5678"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditSection('none')} variant="outlined">
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              setEditSection('none');
              setSuccessMessage('Teléfono actualizado correctamente');
            }} 
            variant="contained"
          >
            Guardar
          </Button>
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
        <DialogTitle>Cancelar cuenta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres cancelar tu cuenta? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenCancel(false)} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={cancelAccount} variant="contained" color="error">
            Sí, cancelar cuenta
          </Button>
        </DialogActions>
      </Dialog>

      <CookiePreferencesModal />
    </Box>
  );
} 