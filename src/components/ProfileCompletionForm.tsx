'use client';

import React, { useState } from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProfileStep from './auth/steps/ProfileStep';
import { useDeviceId } from '@/hooks/useDeviceId';

interface ProfileCompletionFormProps {
  registrationToken: string;
  initialUser: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: string;
    birthDate: string;
  };
}

export default function ProfileCompletionForm({ registrationToken, initialUser }: ProfileCompletionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const deviceId = useDeviceId();

  const handleProfileCompletion = async (firstName: string, lastName: string, birthDate: string, gender: string, password?: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_token: registrationToken,
          firstName,
          lastName,
          password: password || '',
          gender,
          birthDate,
          deviceId,
        }),
      });
      
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || 'Error al completar el perfil');
      }
      
      const data = await res.json();
      
      // After successful profile completion, establish backend session
      await signIn('credentials', {
        redirect: false,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      
      // Redirect to home page
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al completar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb:3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Completa tu perfil
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Necesitamos algunos datos adicionales para completar tu registro
          </Typography>
        </Box>
        
        <ProfileStep
          initialFirst={initialUser.firstName}
          initialLast={initialUser.lastName}
          initialBirthDate={initialUser.birthDate}
          initialGender={initialUser.gender}
          requirePassword={true}
          isLoading={isLoading}
          error={error}
          onSubmit={handleProfileCompletion}
          onBack={() => {
            // Prevent going back - user must complete profile
            setError('Debes completar tu perfil para continuar');
          }}
        />
      </Paper>
    </Container>
  );
} 