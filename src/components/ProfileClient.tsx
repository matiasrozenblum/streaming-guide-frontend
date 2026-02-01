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
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import Header from '@/components/Header';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { event as gaEvent } from '@/lib/gtag';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import dayjs from 'dayjs';
import MuiAlert from '@mui/material/Alert';

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

const ProfileSection = ({ title, value, onEdit }: { title: string; value: React.ReactNode; onEdit: () => void }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      mb: 2,
      background: 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
      backdropFilter: 'blur(8px)',
      borderRadius: 2,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      }
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
      <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</Typography>
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
}

const genderTranslations: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  non_binary: 'No binario',
  rather_not_say: 'Prefiero no decir'
};

export default function ProfileClient({ initialUser }: ProfileClientProps) {
  const { session, status } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const router = useRouter();
  const { consent, openPreferences } = useCookieConsent();

  // Track profile page visit
  useEffect(() => {
    gaEvent({
      action: 'profile_page_visit',
      params: {
        has_initial_data: !!initialUser.firstName || !!initialUser.lastName,
      },
      userData: typedSession?.user
    });
  }, [initialUser.firstName, initialUser.lastName, typedSession?.user]);

  useEffect(() => {
    // If there is no real user, redirect to home
    if (!typedSession?.user || !typedSession.user.id) {
      router.push('/');
    }
  }, [typedSession, router]);

  // sección en edición
  const [editSection, setEditSection] =
    useState<'none' | 'personal' | 'email' | 'phone' | 'password'>('none');

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

  // --- All handlers from original ProfilePage ---
  const saveNames = async () => {
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

    // Track successful profile update
    type ProfileFields = { firstName: string; lastName: string; gender: string; birthDate: string };
    gaEvent({
      action: 'profile_update',
      params: {
        fields_updated: ['firstName', 'lastName', 'gender', 'birthDate']
          .filter(key => ({ firstName, lastName, gender, birthDate })[key as keyof ProfileFields] !== initialUser[key as keyof ProfileFields])
          .join(','),
        has_password_change: false,
      },
      userData: typedSession?.user
    });
  };

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
            credentials: 'include',
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
          credentials: 'include',
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

  // --- Full UI from original ProfilePage ---
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
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
                  background: 'linear-gradient(to right, #90caf9, #42a5f5)',
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
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                Volver
              </Button>
            </Box>
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
                            >
                              Guardar
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )
                }
                onEdit={() => setEditSection('personal')}
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
                title="Contraseña"
                value={
                  <Typography variant="body1">••••••••</Typography>
                }
                onEdit={() => setEditSection('password')}
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
        <DialogActions>
          <Button onClick={() => setEditSection('none')}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={editSection === 'password'}
        onClose={() => setEditSection('none')}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: '90%', sm: 400 }
          }
        }}
      >
        <DialogTitle>Cambiar contraseña</DialogTitle>
        <DialogContent>
          {passwordStep === 'verify' ? (
            <>
              <DialogContentText sx={{ mb: 3 }}>
                Para tu seguridad, primero ingresá el código de verificación que acabamos de enviar a tu email.
              </DialogContentText>
              <Button
                variant="contained"
                fullWidth
                onClick={() => sendCode('password')}
                disabled={codeSent.password}
                sx={{ mb: 3 }}
              >
                {codeSent.password ? 'Código enviado' : 'Enviar código'}
              </Button>
              {codeSent.password && (
                <>
                  <TextField
                    label="Código de verificación"
                    fullWidth
                    value={passwordCode}
                    onChange={(e) => setPasswordCode(e.target.value)}
                    variant="outlined"
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => verifyAndUpdate('password')}
                  >
                    Verificar
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <DialogContentText sx={{ mb: 3 }}>
                Ingresá tu nueva contraseña. Debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.
              </DialogContentText>

              <TextField
                label="Nueva contraseña"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
                InputProps={{
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
                <Box sx={{ width: '100%', mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(getPasswordStrength(newPassword) / 4) * 100}
                    color={getPasswordStrengthColor(newPassword)}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
                    Fortaleza: {['Débil', 'Regular', 'Media', 'Fuerte', 'Muy fuerte'][getPasswordStrength(newPassword)]}
                  </Typography>
                </Box>
              )}

              <TextField
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
                InputProps={{
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

              <Button
                variant="contained"
                fullWidth
                onClick={() => verifyAndUpdate('password')}
                disabled={!newPassword || !confirmPassword || getPasswordStrength(newPassword) < 3}
              >
                Cambiar contraseña
              </Button>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSection('none')}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openCancel}
        onClose={() => setOpenCancel(false)}
      >
        <DialogTitle>¿Estás seguro?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta acción eliminará tu cuenta y todos tus datos (incluyendo historial de notificaciones y suscripciones). Esta acción es irreversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancel(false)}>No cancelar</Button>
          <Button onClick={() => { setOpenCancel(false); cancelAccount(); }} color="error" autoFocus>
            Sí, eliminar mi cuenta
          </Button>
        </DialogActions>
      </Dialog>

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