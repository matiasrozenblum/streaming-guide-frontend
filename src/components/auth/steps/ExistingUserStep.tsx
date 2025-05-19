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
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

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
              <LockOutlinedIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShow(s => !s)} edge="end" size="small">
                {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
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
          startIcon={<ArrowBackIosNewIcon fontSize="small" />}
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
