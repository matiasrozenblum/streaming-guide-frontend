'use client';

import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Alert
} from '@mui/material';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { mode } = useThemeContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (err) {
      console.error('Error in login page:', err);
      setError('Error al autenticar');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: mode === 'light' 
          ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
          : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
          background: mode === 'light' ? 'white' : '#1e293b',
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{
            textAlign: 'center',
            color: mode === 'light' ? '#374151' : '#f1f5f9',
            mb: 3,
          }}
        >
          Acceso Restringido
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            size="large"
          >
            Ingresar
          </Button>
        </form>
      </Paper>
    </Box>
  );
} 