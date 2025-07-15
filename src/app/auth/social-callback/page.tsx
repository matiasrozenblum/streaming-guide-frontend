'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import ProfileStep from '@/components/auth/steps/ProfileStep';

export default function SocialCallback() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const provider = searchParams.get('provider');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [registrationToken, setRegistrationToken] = useState('');

  const handleSocialLogin = useCallback(async () => {
    if (!provider || !session) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          accessToken: session.accessToken,
          user: session.user,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Social login failed');
      }

      if (data.profileIncomplete) {
        setProfileIncomplete(true);
        setRegistrationToken(data.registrationToken);
        setIsLoading(false);
        return;
      }

      // Profile is complete, redirect to main app
      window.location.href = '/';
    } catch (error) {
      console.error('Social login error:', error);
      setError('Failed to complete social login. Please try again.');
      setIsLoading(false);
    }
  }, [provider, session]);

  const handleProfileCompletion = async (firstName: string, lastName: string, birthDate: string, gender: string, password: string) => {
    if (!registrationToken) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationToken,
          firstName,
          lastName,
          birthDate,
          gender,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile completion failed');
      }

      // Profile completed successfully, redirect to main app
      window.location.href = '/';
    } catch (error) {
      console.error('Profile completion error:', error);
      setError('Failed to complete profile. Please try again.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (provider && session) {
      handleSocialLogin();
    }
  }, [provider, session, handleSocialLogin]);

  if (status === 'loading' || isLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <CircularProgress />
          <Typography variant="h6">Procesando autenticación...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      </Container>
    );
  }

  if (profileIncomplete) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h4" component="h1" align="center">
            Completa tu perfil
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary">
            Necesitamos algunos datos adicionales para completar tu registro.
          </Typography>
          <ProfileStep
            requirePassword={true}
            isLoading={isLoading}
            error={error}
            onSubmit={(firstName, lastName, birthDate, gender, password) => {
              handleProfileCompletion(firstName, lastName, birthDate, gender, password ?? '');
            }}
            onBack={() => router.push('/')}
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <CircularProgress />
        <Typography variant="h6">Redirigiendo...</Typography>
      </Box>
    </Container>
  );
} 