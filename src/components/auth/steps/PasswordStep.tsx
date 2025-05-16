import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  AlertTitle,
  InputAdornment,
  IconButton,
  LinearProgress,
  Typography
} from '@mui/material';
import { LockKeyhole, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface PasswordStepProps {
  onSubmit: (password: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}

export default function PasswordStep({
  onSubmit,
  onBack,
  isLoading,
  error
}: PasswordStepProps) {
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [show2, setShow2] = useState(false);
  const [localErr, setLocalErr] = useState('');
  const [strength, setStrength] = useState(0);

  // Calcular fuerza
  useEffect(() => {
    let s = 0;
    if (pass.length >= 8) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    setStrength(Math.min(s, 4));
  }, [pass]);

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.length < 6) {
      setLocalErr('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (pass !== confirm) {
      setLocalErr('Las contraseñas no coinciden');
      return;
    }
    setLocalErr('');
    onSubmit(pass);
  };

  const getColor = () => {
    if (strength <= 1) return 'error';
    if (strength <= 2) return 'warning';
    return 'primary';
  };

  return (
    <Box component="form" onSubmit={handle} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Contraseña"
        type={show ? 'text' : 'password'}
        fullWidth
        value={pass}
        onChange={e => setPass(e.target.value)}
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
              <IconButton size="small" onClick={() => setShow(s => !s)}>
                {show ? <EyeOff size={18}/> : <Eye size={18}/>}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      {pass && (
        <>
          <LinearProgress variant="determinate" value={(strength/4)*100} color={getColor()} />
          <Typography variant="caption">Fuerza: {['Muy débil','Débil','Media','Fuerte','Muy fuerte'][strength]}</Typography>
        </>
      )}
      <TextField
        label="Confirmar contraseña"
        type={show2 ? 'text' : 'password'}
        fullWidth
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockKeyhole size={20} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setShow2(s => !s)}>
                {show2 ? <EyeOff size={18}/> : <Eye size={18}/>}
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
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
        >
          Registrarme
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
      </Box>
    </Box>
  );
}
