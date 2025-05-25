import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  AlertTitle,
  InputAdornment
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

interface ProfileStepProps {
  initialFirst?: string;
  initialLast?: string;
  onSubmit: (first: string, last: string) => void;
  onBack: () => void;
  error?: string;
}

export default function ProfileStep({
  initialFirst = '',
  initialLast = '',
  onSubmit,
  onBack,
  error
}: ProfileStepProps) {
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  const [localErr, setLocalErr] = useState('');

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!first.trim()) {
      setLocalErr('Ingresa tu nombre');
      return;
    }
    if (!last.trim()) {
      setLocalErr('Ingresa tu apellido');
      return;
    }
    setLocalErr('');
    onSubmit(first.trim(), last.trim());
  };

  return (
    <Box component="form" onSubmit={handle} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Nombre"
        fullWidth
        value={first}
        onChange={e => setFirst(e.target.value)}
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonOutlineIcon fontSize="small" />
            </InputAdornment>
          )
        }}
      />
      <TextField
        label="Apellido"
        fullWidth
        value={last}
        onChange={e => setLast(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonOutlineIcon fontSize="small" />
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
          variant="outlined"
          startIcon={<ArrowBackIosNewIcon fontSize="small" />}
          fullWidth
          onClick={onBack}
        >
          Volver
        </Button>
        <Button
          type="submit"
          variant="contained"
          fullWidth
        >
          Continuar
        </Button>
      </Box>
    </Box>
  );
}
