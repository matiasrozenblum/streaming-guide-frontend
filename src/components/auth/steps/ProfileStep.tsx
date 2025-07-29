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
import { useSession } from 'next-auth/react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

interface ProfileStepProps {
  initialFirst?: string;
  initialLast?: string;
  initialBirthDate?: string;
  initialGender?: string;
  onSubmit: (first: string, last: string, birthDate: string, gender: string, password?: string) => void;
  onBack: () => void;
  error?: string;
  requirePassword?: boolean;
  isLoading?: boolean;
  showBackButton?: boolean;
}

export default function ProfileStep({
  initialFirst = '',
  initialLast = '',
  initialBirthDate = '',
  initialGender = '',
  error,
  onSubmit,
  onBack,
  requirePassword = false,
  isLoading = false,
  showBackButton = true,
}: ProfileStepProps) {
  const { data: session } = useSession();
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  const [birthDate, setBirthDate] = useState<Dayjs | null>(initialBirthDate ? dayjs(initialBirthDate) : null);
  const [gender, setGender] = useState(initialGender);
  const [localErr, setLocalErr] = useState('');
  // If user is from social provider, disable name fields if present
  const isSocial = !!session?.user && (session.user.firstName || session.user.lastName || session.user.email);
  const [birthDateError, setBirthDateError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
    if (!birthDate) {
      setLocalErr('Ingresa tu fecha de nacimiento');
      return;
    }
    if (requirePassword && !password) {
      setPasswordError('La contraseña es obligatoria');
      return;
    }
    if (requirePassword && password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLocalErr('');
    setPasswordError('');
    const birthDateString = birthDate ? birthDate.format('YYYY-MM-DD') : '';
    if (requirePassword) {
      onSubmit(first.trim(), last.trim(), birthDateString, gender, password);
    } else {
      onSubmit(first.trim(), last.trim(), birthDateString, gender);
    }
  };

  const handleBirthDateChange = (value: Dayjs | null) => {
    setBirthDate(value);
    if (!value) {
      setBirthDateError('La fecha de nacimiento es obligatoria');
      return;
    }
    const birth = value.toDate();
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
          ),
        }}
        disabled={Boolean(isSocial && first)}
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
          ),
        }}
        disabled={Boolean(isSocial && last)}
      />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <DatePicker
            label="Fecha de nacimiento"
            value={birthDate}
            onChange={handleBirthDateChange}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!birthDateError,
                helperText: birthDateError,
                placeholder: "DD/MM/AAAA",
                InputLabelProps: {
                  shrink: true,
                },
              },
            }}
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
      </LocalizationProvider>
      {requirePassword && (
        <TextField
          label="Contraseña"
          type="password"
          fullWidth
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={!!passwordError}
          helperText={passwordError || 'Mínimo 6 caracteres'}
          sx={{ mt: 1 }}
        />
      )}
      {(localErr || error) && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {localErr || error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {showBackButton && (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIosNewIcon fontSize="small" />}
            fullWidth
            onClick={onBack}
          >
            Volver
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!first || !last || !birthDate || !gender || !!birthDateError || (requirePassword && (!password || password.length < 6)) || isLoading}
        >
          Continuar
        </Button>
      </Box>
    </Box>
  );
}
