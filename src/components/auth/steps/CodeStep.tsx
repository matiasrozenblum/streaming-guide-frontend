import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  AlertTitle,
  InputAdornment,
  Typography
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

interface CodeStepProps {
  email: string;
  initialCode?: string;
  onSubmit: (code: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}

export default function CodeStep({
  email,
  initialCode = '',
  onSubmit,
  onBack,
  isLoading,
  error
}: CodeStepProps) {
  const [code, setCode] = useState(initialCode);
  const [localErr, setLocalErr] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setLocalErr('Ingresa el código de verificación');
      return;
    }
    if (code.length < 6) {
      setLocalErr('El código debe tener 6 caracteres');
      return;
    }
    setLocalErr('');
    onSubmit(code.trim());
  };

  const handleResend = () => {
    setCanResend(false);
    setCountdown(30);
    // aquí puedes llamar a tu API para reenviar
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" textAlign="center">
        Hemos enviado un código a <strong>{email}</strong>
      </Typography>
      <TextField
        label="Código de 6 dígitos"
        fullWidth
        value={code}
        onChange={e => setCode(e.target.value)}
        disabled={isLoading}
        inputProps={{ maxLength: 6 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <VpnKeyIcon fontSize="small" />
            </InputAdornment>
          )
        }}
        autoFocus
      />
      {(localErr || error) && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {localErr || error}
        </Alert>
      )}
      <Box textAlign="center">
        <Button
          variant="text"
          disabled={!canResend}
          onClick={handleResend}
        >
          {canResend
            ? 'Reenviar código'
            : `Reenviar en ${countdown}s`}
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
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
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
        >
          Verificar
        </Button>
      </Box>
    </Box>
  );
}
