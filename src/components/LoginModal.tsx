'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AuthService } from '@/services/auth';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [step, setStep] = useState<'email' | 'code' | 'profile' | 'password'>('email');
  const [identifier, setIdentifier] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleEmail = async () => {
    try {
      await AuthService.sendCode(identifier);
      setError('');
      setStep('code');
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
      else setError('Error sending code');
    }
  };

  const handleCode = async () => {
    try {
      const { isNew } = await AuthService.verifyCode(identifier, code);
      setError('');
      if (isNew) {
        setStep('profile');
      } else {
        onClose();
        window.location.reload();
      }
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
      else setError('Error verifying code');
    }
  };

  const handleProfile = () => {
    if (!firstName || !lastName) {
      setError('Nombre y apellido son obligatorios');
      return;
    }
    setError('');
    setStep('password');
  };

  const handleSubmit = async () => {
    if (password.length < 6 || password !== confirm) {
      setError('Contraseñas inválidas');
      return;
    }
    try {
      await AuthService.register({ firstName, lastName, password });
      onClose();
      window.location.reload();
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
      else setError('Error registering user');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        Acceder / Registrarse
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {step === 'email' && (
          <TextField
            label="Email"
            fullWidth
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoFocus
            sx={{ mt: 2 }}
          />
        )}
        {step === 'code' && (
          <TextField
            label="Código"
            fullWidth
            value={code}
            onChange={(e) => setCode(e.target.value)}
            sx={{ mt: 2 }}
          />
        )}
        {step === 'profile' && (
          <>
            <TextField
              label="Nombre"
              fullWidth
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              sx={{ mt: 2 }}
            />
            <TextField
              label="Apellido"
              fullWidth
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              sx={{ mt: 2 }}
            />
          </>
        )}
        {step === 'password' && (
          <>
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mt: 2 }}
            />
            <TextField
              label="Confirmar contraseña"
              type="password"
              fullWidth
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              sx={{ mt: 2 }}
            />
          </>
        )}
        {!!error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        {step === 'email' && <Button onClick={handleEmail}>Enviar código</Button>}
        {step === 'code' && <Button onClick={handleCode}>Verificar código</Button>}
        {step === 'profile' && <Button onClick={handleProfile}>Siguiente</Button>}
        {step === 'password' && <Button onClick={handleSubmit}>Registrarme</Button>}
      </DialogActions>
    </Dialog>
  );
}