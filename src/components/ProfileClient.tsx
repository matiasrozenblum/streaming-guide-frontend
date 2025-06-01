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
  const { mode } = useThemeContext();

  // Track profile page visit
  useEffect(() => {
    gaEvent('profile_page_visit', {
      has_initial_data: !!initialUser.firstName || !!initialUser.lastName,
    });
  }, []);

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
  const [birthDate, setBirthDate] = useState(initialUser.birthDate || '');
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

  // --- All handlers from original ProfilePage ---
  const saveNames = async () => {
    if (!typedSession) return;
    setPersonalError('');
    // Validate birthDate (must be 18+)
    if (!birthDate) {
      setPersonalError('La fecha de nacimiento es obligatoria');
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
    alert(res.ok ? 'Datos actualizados' : 'Error al actualizar');
    if (res.ok) setEditSection('none');

    // Track successful profile update
    type ProfileFields = { firstName: string; lastName: string; gender: string; birthDate: string };
    gaEvent('profile_update', {
      fields_updated: ['firstName', 'lastName', 'gender', 'birthDate'].filter(key => ({ firstName, lastName, gender, birthDate })[key as keyof ProfileFields] !== initialUser[key as keyof ProfileFields]),
      has_password_change: false,
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
        }
      } else if (passwordStep === 'change') {
        if (newPassword !== confirmPassword) {
          alert('Las contraseñas no coinciden');
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
      await signOut({ callbackUrl: '/login' });
    } else {
      alert('Error al cancelar la cuenta');
    }
  };

  if (status !== 'authenticated') return null;

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
                          {birthDate ? new Date(birthDate).toLocaleDateString() : '—'}
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
    </Box>
  );
} 