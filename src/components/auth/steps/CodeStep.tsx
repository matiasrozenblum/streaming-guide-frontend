import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  AlertTitle,
  Typography,
  useTheme
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

interface CodeStepProps {
  email: string;
  initialCode?: string;
  onSubmit: (code: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}

// OtpInput component
interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
}
function OtpInput({ value, onChange, length = 6, disabled = false }: OtpInputProps) {
  const theme = useTheme();
  const inputs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/[^0-9]/g, ''); // Only numbers
    if (!val) return;
    const newValue = value.split('');
    newValue[idx] = val[val.length - 1]; // Only last digit if pasted multiple
    onChange(newValue.join(''));
    // Move to next input
    if (idx < length - 1 && val) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      const newValue = value.split('');
      newValue[idx - 1] = '';
      onChange(newValue.join(''));
      inputs.current[idx - 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (paste.length === length) {
      onChange(paste);
      inputs.current[length - 1]?.focus();
      e.preventDefault();
    }
  };

  return (
    <Box display="flex" gap={2} justifyContent="center" onPaste={handlePaste} mb={1}>
      {Array.from({ length }).map((_, idx) => (
        <TextField
          key={idx}
          inputRef={el => inputs.current[idx] = el}
          value={value[idx] || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e, idx)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, idx)}
          inputProps={{
            maxLength: 1,
            style: {
              textAlign: 'center',
              fontSize: 20,
              width: 12,
              height: 20,
              background: theme.palette.mode === 'dark' ? '#16213A' : '#fff',
              color: theme.palette.mode === 'dark' ? '#fff' : '#111',
              borderRadius: 8,
            },
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          disabled={disabled}
        />
      ))}
    </Box>
  );
}

export default function CodeStep({
  email,
  initialCode = '',
  onSubmit,
  onBack,
  isLoading,
  error
}: CodeStepProps) {
  const [code, setCode] = useState(initialCode.padEnd(6, ''));
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
    if (!code || code.length < 6) {
      setLocalErr('El código debe tener 6 dígitos');
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
        Ingresá el código que recibiste en <strong>{email}</strong>
      </Typography>
      <OtpInput value={code} onChange={setCode} length={6} disabled={isLoading} />
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
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
        >
          Verificar
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
      </Box>
    </Box>
  );
}
