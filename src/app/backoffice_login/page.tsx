'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';

export default function BackofficeLoginPage() {
  const router = useRouter();
  const { session, status } = useSessionContext();
  const typedSession = session as SessionWithToken | null;

  // If already authenticated as backoffice, redirect
  useEffect(() => {
    if (status === 'authenticated' && typedSession?.user.role === 'admin') {
      router.push('/backoffice');
    }
  }, [status, typedSession?.user.role, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      const result = await signIn('credentials', {
        redirect: false,
        accessToken: data.access_token,
      });

      if (result?.error) {
        setError('Invalid credentials');
        return;
      }

      router.push('/backoffice');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <Box sx={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default'
    }}>
      <Paper elevation={3} sx={{
        p: 4,
        width: '100%',
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h4" align="center">Backoffice Login</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={!!error}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={!!error}
            helperText={error}
          />
          <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
}