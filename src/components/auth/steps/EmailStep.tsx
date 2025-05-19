import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  AlertTitle,
  InputAdornment
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

interface EmailStepProps {
  initialEmail?: string;
  onSubmit: (email: string) => void;
  isLoading: boolean;
  error?: string;
}

export default function EmailStep({
  initialEmail = '',
  onSubmit,
  isLoading,
  error
}: EmailStepProps) {
  const [email, setEmail] = useState(initialEmail);
  const [localErr, setLocalErr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLocalErr('Por favor ingresa tu correo electrónico');
      return;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setLocalErr('Correo electrónico inválido');
      return;
    }
    setLocalErr('');
    onSubmit(email.trim());
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Correo electrónico"
        type="email"
        fullWidth
        value={email}
        onChange={e => setEmail(e.target.value)}
        disabled={isLoading}
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <MailOutlineIcon fontSize="small" />
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
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={isLoading}
      >
        {isLoading ? 'Enviando…' : 'Continuar'}
      </Button>
    </Box>
  );
}
