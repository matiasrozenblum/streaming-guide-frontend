import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  AlertTitle,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

interface EmailStepProps {
  initialEmail?: string;
  onSubmit: (email: string) => void;
  isLoading: boolean;
  error?: string;
  /**
   * Off where the form is a page rather than a dialog: on a phone the caret
   * brings the keyboard, and the keyboard covers everything the page was
   * trying to say before asking for an address.
   */
  autoFocus?: boolean;
}

export default function EmailStep({
  initialEmail = '',
  onSubmit,
  isLoading,
  error,
  autoFocus = true
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
    onSubmit(email.trim().toLowerCase());
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        placeholder="Correo electrónico"
        type="email"
        fullWidth
        value={email}
        onChange={e => setEmail(e.target.value)}
        disabled={isLoading}
        autoFocus={autoFocus}
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
        aria-label={isLoading ? 'Cargando' : undefined}
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Continuar'}
      </Button>
    </Box>
  );
}
