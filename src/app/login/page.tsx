'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import {
  Box, Paper, Typography,
  TextField, Button
} from '@mui/material';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // llamamos al provider "legacy"
    const res = await signIn('legacy', {
      redirect:     false,
      password,
      isBackoffice: 'false',
      callbackUrl:  '/',
    });

    if (res?.error) {
      setError('Contraseña incorrecta');
      return;
    }

    router.push(res?.url || '/');
  };

  return (
    <Box sx={{
      minHeight:'100dvh',
      display:'flex', alignItems:'center', justifyContent:'center',
      bgcolor:'background.default'
    }}>
      <Paper elevation={3} sx={{
        p:4, width:'100%', maxWidth:400,
        display:'flex', flexDirection:'column', gap:2
      }}>
        <Typography variant="h4" align="center">Acceso Público</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Contraseña" type="password"
            value={password} onChange={e => setPassword(e.target.value)}
            error={!!error} helperText={error}
          />
          <Button fullWidth variant="contained" type="submit" sx={{mt:2}}>
            Ingresar
          </Button>
        </form>
      </Paper>
    </Box>
  );
}