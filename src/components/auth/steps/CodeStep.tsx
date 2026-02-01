
import React, { useRef, useEffect } from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Typography, Button, TextField, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface CodeStepProps {
  code: string;
  setCode: (value: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  isLoading: boolean;
  error: string;
  identifier: string;
  onBack: () => void;
  codeSent: boolean;
}

export default function CodeStep({
  code,
  setCode,
  onSubmit,
  onResend,
  isLoading,
  error,
  identifier,
  onBack,
  codeSent
}: CodeStepProps) {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant="h6" align="center" gutterBottom>
        Verifica tu cuenta
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Ingresa el código de 6 dígitos enviado a <strong>{identifier}</strong>.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
        <OtpInput
          value={code}
          onChange={setCode}
          numInputs={6}
          isLoading={isLoading}
          error={!!error}
        />
      </Box>

      {error && (
        <Typography color="error" variant="caption" align="center" display="block" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={onSubmit}
        disabled={isLoading || code.length !== 6}
        sx={{ mb: 2 }}
      >
        {isLoading ? 'Verificando...' : 'Verificar'}
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button onClick={onBack} disabled={isLoading} size="small" sx={{ textTransform: 'none' }}>
          Cambiar destino
        </Button>
        <Link
          component="button"
          variant="body2"
          onClick={onResend}
          disabled={isLoading}
          sx={{ textTransform: 'none', cursor: 'pointer' }}
        >
          {codeSent ? 'Reenviar código' : 'Enviar código'}
        </Link>
      </Box>
    </Box>
  );
}

// Simple OTP Input component
const OtpInput = ({ value, onChange, numInputs, isLoading, error }: any) => {
  const theme = useTheme();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (value.length === 0 && inputsRef.current[0]) {
      inputsRef.current[0]?.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const newValue = value.split('');
    newValue[index] = val.substring(val.length - 1);
    const nextValue = newValue.join('');

    onChange(nextValue);

    if (val && index < numInputs - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <>
      {Array.from({ length: numInputs }).map((_, i) => (
        <TextField
          key={i}
          inputRef={(el) => (inputsRef.current[i] = el)}
          value={value[i] || ''}
          onChange={(e) => handleChange(e as any, i)}
          onKeyDown={(e) => handleKeyDown(e as any, i)}
          disabled={isLoading}
          error={error}
          variant="outlined"
          size="small"
          inputProps={{
            maxLength: 1,
            style: {
              textAlign: 'center',
              fontSize: 20,
              width: 12,
              height: 20,
              background: '#16213A', // Hardcoded dark mode background
              color: '#fff', // Hardcoded dark mode text
              borderRadius: 8,
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            }
          }}
        />
      ))}
    </>
  );
};
