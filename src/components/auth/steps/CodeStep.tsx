import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  AlertTitle,
  Typography,
  CircularProgress
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
  const inputs = React.useRef<(HTMLInputElement | null)[]>([]);

  // `value` keeps one char per slot, with ' ' for empty slots, so digits
  // stay in their position even if the user fills the boxes out of order.
  const slots = Array.from({ length }, (_, i) => (value[i] ?? ' ').replace(/[^0-9]/, ' '));

  const setSlot = (idx: number, digit: string) => {
    const next = [...slots];
    next[idx] = digit || ' ';
    onChange(next.join(''));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/[^0-9]/g, ''); // Only numbers
    if (!val) {
      // Allows clearing the box (e.g. selecting the digit and deleting it)
      setSlot(idx, '');
      return;
    }
    // When typing over an existing digit the box holds two chars; keep the new
    // one regardless of whether the caret was before or after the old digit.
    const prev = slots[idx].trim();
    const digit = val.length > 1 && val[val.length - 1] === prev ? val[0] : val[val.length - 1];
    setSlot(idx, digit);
    // Move to next input
    if (idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key !== 'Backspace') return;
    e.preventDefault();
    if (slots[idx] !== ' ') {
      // Box has a digit: clear it and stay here
      setSlot(idx, '');
    } else if (idx > 0) {
      // Box is empty: clear the previous one and move back
      setSlot(idx - 1, '');
      inputs.current[idx - 1]?.focus();
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
          value={slots[idx].trim()}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e, idx)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, idx)}
          inputProps={{
            maxLength: 2, // lets a new digit replace the existing one
            style: {
              textAlign: 'center',
              fontSize: 20,
              width: 12,
              height: 20,
              background: '#16213A',
              color: '#fff',
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
    const digits = code.replace(/[^0-9]/g, '');
    if (digits.length < 6) {
      setLocalErr('El código debe tener 6 dígitos');
      return;
    }
    setLocalErr('');
    onSubmit(digits);
  };

  const handleResend = async () => {
    setCanResend(false);
    setCountdown(30);
    
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al reenviar el código');
      }
      
      console.log('✅ Código reenviado exitosamente');
    } catch (error) {
      console.error('❌ Error al reenviar código:', error);
      setLocalErr(error instanceof Error ? error.message : 'Error al reenviar el código');
    }
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
          aria-label={isLoading ? 'Verificando' : undefined}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verificar'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIosNewIcon fontSize="small" />}
          fullWidth
          disabled={isLoading}
          onClick={onBack}
          aria-label="Volver al paso anterior"
        >
          Volver
        </Button>
      </Box>
    </Box>
  );
}
