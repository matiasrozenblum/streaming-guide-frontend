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
import MenuItem from '@mui/material/MenuItem';

interface ProfileStepProps {
  initialFirst?: string;
  initialLast?: string;
  initialBirthDate?: string;
  initialGender?: string;
  onSubmit: (first: string, last: string, birthDate: string, gender: string) => void;
  onBack: () => void;
  error?: string;
}

export default function ProfileStep({
  initialFirst = '',
  initialLast = '',
  initialBirthDate = '',
  initialGender = '',
  onSubmit,
  onBack,
  error
}: ProfileStepProps) {
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [gender, setGender] = useState(initialGender);
  const [localErr, setLocalErr] = useState('');
  const [birthDateError, setBirthDateError] = useState('');

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
    if (!gender) {
      setLocalErr('Selecciona tu género');
      return;
    }
    setLocalErr('');
    onSubmit(first.trim(), last.trim(), birthDate, gender);
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBirthDate(value);
    if (!value) {
      setBirthDateError('La fecha de nacimiento es obligatoria');
      return;
    }
    const birth = new Date(value);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) {
      setBirthDateError('Debés ser mayor de 18 años para registrarte');
    } else {
      setBirthDateError('');
    }
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
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Fecha de nacimiento"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={birthDate}
          onChange={handleBirthDateChange}
          error={!!birthDateError}
          helperText={birthDateError}
        />
        <TextField
          label="Género"
          select
          fullWidth
          value={gender}
          onChange={e => setGender(e.target.value)}
        >
          <MenuItem value="masculino">Masculino</MenuItem>
          <MenuItem value="femenino">Femenino</MenuItem>
          <MenuItem value="no_binario">No binario</MenuItem>
          <MenuItem value="prefiero_no_decir">Prefiero no decir</MenuItem>
        </TextField>
      </Box>
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
          disabled={!first || !last || !birthDate || !gender || !!birthDateError}
        >
          Continuar
        </Button>
      </Box>
    </Box>
  );
}
