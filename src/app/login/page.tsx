'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // le pasamos callbackUrl explícito para que NextAuth sepa dónde volver
    const res = await signIn('legacy', {
      redirect:     false,
      password,
      isBackoffice: 'false',     // ojo: debe ser string
      callbackUrl:  '/'
    })

    if (res?.error) {
      setError('Contraseña incorrecta')
    } else {
      // si no hay error, redirigimos manualmente al /
      router.push(res?.url || '/')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Acceso Público
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            helperText={error}
            margin="normal"
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            size="large"
            sx={{ mt: 2 }}
          >
            Ingresar
          </Button>
        </form>
      </Paper>
    </Box>
  );
} 