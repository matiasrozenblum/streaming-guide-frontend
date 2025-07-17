'use client';

import React, { useState } from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { signIn, signOut, useSession } from 'next-auth/react';
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

const mapGenderToBackend = (g: string) => {
  switch (g) {
    case 'masculino': return 'male';
    case 'femenino': return 'female';
    case 'no_binario': return 'non_binary';
    case 'prefiero_no_decir': return 'rather_not_say';
    default: return 'rather_not_say';
  }
};

export default function ProfileCompletionForm({ registrationToken, initialUser }: ProfileCompletionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const deviceId = useDeviceId();
  const { data: session, status } = useSession();

  const handleProfileCompletion = async (firstName: string, lastName: string, birthDate: string, gender: string, password?: string) => {
    setIsLoading(true);
    setError('');
    
    const requestBody = {
      registration_token: registrationToken,
      firstName,
      lastName,
      password: password || '',
      gender: mapGenderToBackend(gender),
      birthDate,
      deviceId,
    };
    
    console.log('[ProfileCompletionForm] Sending request:', requestBody);
    
    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      console.log('[ProfileCompletionForm] Response status:', res.status);
      
      if (!res.ok) {
        const body = await res.json();
        console.log('[ProfileCompletionForm] Error response:', body);
        throw new Error(body.message || 'Error al completar el perfil');
      }
      
      const data = await res.json();
      console.log('[ProfileCompletionForm] Success response:', data);
      
      // Sign out completely to clear the old session
      console.log('[ProfileCompletionForm] Signing out to clear old session...');
      await signOut({ redirect: false });
      
      // Wait a moment for sign out to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Sign in with the new backend credentials
      console.log('[ProfileCompletionForm] Signing in with new credentials...');
      const signInResult = await signIn('credentials', {
        redirect: false,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      
      console.log('[ProfileCompletionForm] SignIn result:', signInResult);
      
      if (signInResult?.error) {
        throw new Error('Error al establecer la sesión: ' + signInResult.error);
      }
      
      // Wait a moment for the session to update
      console.log('[ProfileCompletionForm] Waiting for session update...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force a page refresh to ensure session is updated
      console.log('[ProfileCompletionForm] Redirecting to home...');
      window.location.href = '/';
    } catch (err: unknown) {
      console.log('[ProfileCompletionForm] Error:', err);
      setError(err instanceof Error ? err.message : 'Error al completar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  // Log current session state
  console.log('[ProfileCompletionForm] Current session:', session);
  console.log('[ProfileCompletionForm] Session status:', status);

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
            // No going back - user must complete profile
          }}
          showBackButton={false}
        />
      </Paper>
    </Container>
  );
} 