'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

export default function BackofficeLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Si ya estamos autenticados como backoffice, redirigimos
  useEffect(() => {
    if (
      status === 'authenticated' &&
      session?.user.id === 'backoffice'
    ) {
      router.push('/backoffice');
    }
  }, [session, status, router]);

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1) Invocamos el provider "legacy"
    const res = await signIn('legacy', {
      redirect: false,
      password,
      isBackoffice: 'true',
      callbackUrl: '/backoffice',
    });

    if (res?.error) {
      setError('Contraseña incorrecta');
      return;
    }

    // 4) Redirigimos al panel de backoffice
    router.push(res?.url || '/backoffice');
  };

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
        <Typography variant="h4" align="center" gutterBottom>
          Acceso Backoffice
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={!!error}
            helperText={error}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
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