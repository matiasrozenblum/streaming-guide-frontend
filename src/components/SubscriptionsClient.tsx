'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  Delete,
  NotificationsActive,
  ArrowBack,
} from '@mui/icons-material';
import { useSessionContext } from '@/contexts/SessionContext';
import { api } from '@/services/api';
import type { SessionWithToken } from '@/types/session';
import { useRouter } from 'next/navigation';
import { useThemeContext } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import { getColorForChannel } from '@/utils/colors';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

export enum NotificationMethod {
  PUSH = 'push',
  EMAIL = 'email',
  BOTH = 'both',
}

export interface UserSubscription {
  id: string;
  program: {
    id: number;
    name: string;
    description?: string;
    logoUrl?: string;
    channel: {
      id: number;
      name: string;
    };
  };
  notificationMethod: NotificationMethod;
  isActive: boolean;
  createdAt: string;
}

interface SubscriptionsClientProps {
  initialSubscriptions: UserSubscription[];
}

export default function SubscriptionsClient({ initialSubscriptions }: SubscriptionsClientProps) {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const router = useRouter();
  const { mode } = useThemeContext();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>(initialSubscriptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateNotificationMethod = async (subscriptionId: string, notificationMethod: NotificationMethod) => {
    if (!typedSession?.accessToken) return;
    try {
      setLoading(true);
      await api.put(`/subscriptions/${subscriptionId}`, 
        { notificationMethod },
        { headers: { Authorization: `Bearer ${typedSession.accessToken}` } }
      );
      setSubscriptions(prev => prev.map(sub => 
        sub.id === subscriptionId 
          ? { ...sub, notificationMethod }
          : sub
      ));
      setSuccess('Preferencias de notificación actualizadas');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Error al actualizar las preferencias');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const removeSubscription = async (subscriptionId: string) => {
    if (!typedSession?.accessToken) return;
    if (!confirm('¿Estás seguro de que deseas cancelar esta suscripción?')) {
      return;
    }
    try {
      setLoading(true);
      await api.delete(`/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${typedSession.accessToken}` },
      });
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
      setSuccess('Suscripción cancelada correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Error al cancelar la suscripción');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          background: mode === 'light'
            ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
            : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
          py: { xs: 1, sm: 2 },
        }}
      >
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress size={60} />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: mode === 'light'
          ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
          : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
        py: { xs: 1, sm: 2 },
      }}
    >
      <Header />
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: 4, 
          mb: 6,
          px: { xs: 2, sm: 3 },
        }}
      >
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 4,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Mis suscripciones
            </Typography>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.push('/')}
              variant="outlined"
              size="large"
              sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
            >
              Volver
            </Button>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {subscriptions.length === 0 ? (
            <Typography variant="h6" align="center" color="text.secondary" sx={{ mt: 8 }}>
              No tienes suscripciones activas.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {subscriptions.map(sub => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={sub.id}>
                  <MotionCard
                    whileHover={{ scale: 1.03 }}
                    sx={{
                      borderRadius: 3,
                      boxShadow: 3,
                      background: mode === 'light'
                        ? 'linear-gradient(135deg,#fff 0%,#f3f6fa 100%)'
                        : 'linear-gradient(135deg,#1e293b 0%,#334155 100%)',
                      minHeight: 220,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <CardContent sx={{ flex: 1 }}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar
                          src={sub.program.logoUrl || ''}
                          alt={sub.program.name}
                          sx={{ width: 48, height: 48, bgcolor: getColorForChannel(sub.program.channel.id - 1) }}
                        >
                          {sub.program.name?.[0] || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={600}>{sub.program.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {sub.program.channel.name}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {sub.program.description || 'Sin descripción'}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          icon={<NotificationsActive fontSize="small" />}
                          label={
                            sub.notificationMethod === NotificationMethod.BOTH
                              ? 'Push + Email'
                              : sub.notificationMethod === NotificationMethod.PUSH
                                ? 'Push'
                                : 'Email'
                          }
                          color="primary"
                          variant="outlined"
                        />
                        <FormControl size="small">
                          <Select
                            value={sub.notificationMethod}
                            onChange={e => updateNotificationMethod(sub.id, e.target.value as NotificationMethod)}
                          >
                            <MenuItem value={NotificationMethod.BOTH}>Push + Email</MenuItem>
                            <MenuItem value={NotificationMethod.PUSH}>Push</MenuItem>
                            <MenuItem value={NotificationMethod.EMAIL}>Email</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                    </CardContent>
                    <CardActions>
                      <Button
                        startIcon={<Delete />}
                        color="error"
                        onClick={() => removeSubscription(sub.id)}
                        sx={{ borderRadius: 2 }}
                      >
                        Cancelar
                      </Button>
                    </CardActions>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          )}
        </MotionBox>
      </Container>
    </Box>
  );
} 