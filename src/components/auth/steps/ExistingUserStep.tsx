import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  AlertTitle,
  InputAdornment,
  IconButton,
  Typography
} from '@mui/material';
import { LockKeyhole, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface ExistingUserStepProps {
  email: string;
  onSubmit: (password: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
  onForgotPassword: () => void;
}

export default function ExistingUserStep({
  email,
  onSubmit,
  onBack,
  isLoading,
  error,
  onForgotPassword
}: ExistingUserStepProps) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setLocalErr('Ingresa tu contraseña');
      return;
    }
    setLocalErr('');
    onSubmit(password);
  };

  return (
    <Box component="form" onSubmit={handle} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" textAlign="center">
        Bienvenido de nuevo, <strong>{email}</strong>
      </Typography>
      <TextField
        label="Contraseña"
        type={show ? 'text' : 'password'}
        fullWidth
        value={password}
        onChange={e => setPassword(e.target.value)}
        disabled={isLoading}
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockKeyhole size={20} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShow(s => !s)} edge="end" size="small">
                {show ? <EyeOff size={18}/> : <Eye size={18}/>}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      {(localErr || error) && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {localErr || error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
        >
          Iniciar sesión
        </Button>
        <Button
          variant="outlined"
          startIcon={<ArrowLeft size={16} />}
          fullWidth
          disabled={isLoading}
          onClick={onBack}
        >
          Volver
        </Button>
        <Button
          variant="text"
          color="primary"
          fullWidth
          disabled={isLoading}
          onClick={onForgotPassword}
        >
          ¿Olvidaste tu contraseña?
        </Button>
      </Box>
    </Box>
  );
}
