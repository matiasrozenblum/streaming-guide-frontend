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
      isBackoffice: 'false',  // tiene que ser string
      callbackUrl:  '/',      // dónde redirigir tras OK
    });

    if (res?.error) {
      setError('Contraseña incorrecta');
      return;
    }

    // 1) Esperamos a que NextAuth escriba su propia cookie de sesión
    // 2) Le pedimos la sesión para extraer el JWT que NextAuth guardó en ella
    const session = await getSession();
    const token   = session?.accessToken;
    if (token) {
      // 3) Seteamos justo aquí la cookie legacy que tu código antiguo consume
      document.cookie = `public_token=${token}; path=/; SameSite=Strict`;
    }

    // 4) Ahora sí redirigimos al /
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