'use client';

import React, { useEffect, useState } from 'react';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Delete,
  NotificationsActive,
  Notifications,
  Email,
  NotificationsOff,
  ArrowBack,
} from '@mui/icons-material';
import { useSessionContext } from '@/contexts/SessionContext';
import { api } from '@/services/api';
import type { SessionWithToken } from '@/types/session';
import { useRouter } from 'next/navigation';
import { useThemeContext } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import IOSPushGuide from '@/components/IOSPushGuide';
import { getColorForChannel } from '@/utils/colors';
import { event as gaEvent } from '@/lib/gtag';
import { usePush } from '@/contexts/PushContext';

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
      order?: number;
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
  const { isIOSDevice, isPWAInstalled } = usePush();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>(initialSubscriptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Only redirect if we're sure there's no session (not just loading)
    // Add a small delay to ensure session context has loaded
    const timer = setTimeout(() => {
      if (!typedSession?.user || !typedSession.user.id) {
        router.push('/');
      }
    }, 500); // Give session context time to load

    return () => clearTimeout(timer);
  }, [typedSession, router]);

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

      // Track notification method change
      gaEvent({
        action: 'notification_method_change',
        params: {
          subscription_id: subscriptionId,
          new_method: notificationMethod,
          program_name: subscriptions.find(s => s.id === subscriptionId)?.program.name,
          channel_name: subscriptions.find(s => s.id === subscriptionId)?.program.channel.name,
        },
        userData: typedSession?.user
      });
    } catch {
      setError('Error al actualizar las preferencias');
      setTimeout(() => setError(null), 3000);

      // Track notification method change error
      gaEvent({
        action: 'notification_method_change_error',
        params: {
          subscription_id: subscriptionId,
          attempted_method: notificationMethod,
          program_name: subscriptions.find(s => s.id === subscriptionId)?.program.name,
          channel_name: subscriptions.find(s => s.id === subscriptionId)?.program.channel.name,
        },
        userData: typedSession?.user
      });
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
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      await api.delete(`/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${typedSession.accessToken}` },
      });
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
      setSuccess('Suscripción cancelada correctamente');
      setTimeout(() => setSuccess(null), 3000);

      // Track successful subscription removal
      gaEvent({
        action: 'program_unsubscribe',
        params: {
          program_id: subscription?.program.id,
          program_name: subscription?.program.name,
          channel_name: subscription?.program.channel.name,
          location: 'subscriptions_page',
          notification_method: subscription?.notificationMethod,
        },
        userData: typedSession?.user
      });
    } catch {
      setError('Error al cancelar la suscripción');
      setTimeout(() => setError(null), 3000);

      // Track failed subscription removal
      gaEvent({
        action: 'subscription_error',
        params: {
          action: 'unsubscribe',
          location: 'subscriptions_page',
          error_message: 'Error al cancelar la suscripción',
        },
        userData: typedSession?.user
      });
    } finally {
      setLoading(false);
    }
  };

  // Track subscriptions page visit
  useEffect(() => {
    gaEvent({
      action: 'subscriptions_page_visit',
      params: {
        subscription_count: subscriptions.length,
        has_active_subscriptions: subscriptions.some(s => s.notificationMethod),
      },
      userData: typedSession?.user
    });
  }, [subscriptions, typedSession]);

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
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  background: mode === 'light'
                    ? 'linear-gradient(to right, #1a237e, #0d47a1)'
                    : 'linear-gradient(to right, #90caf9, #42a5f5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                Mis Favoritos
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gestiona tus suscripciones a programas y preferencias de notificación
              </Typography>
            </Box>
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
          
          {/* iOS Push Guide - only shown for iOS users */}
          <IOSPushGuide />
          {subscriptions.length === 0 ? (
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              sx={{ 
                textAlign: 'center', 
                py: 8,
                background: mode === 'light'
                  ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
                  : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
                backdropFilter: 'blur(8px)',
                borderRadius: 3,
                border: mode === 'light' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <CardContent>
                <NotificationsOff sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  No tienes suscripciones activas
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                  Suscríbete a tus programas favoritos haciendo clic en el ícono de campanita en la grilla de programación
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => router.push('/')} 
                  size="large"
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                  }}
                >
                  Ir a la programación
                </Button>
              </CardContent>
            </MotionCard>
          ) : (
            <Grid container spacing={3}>
              {subscriptions.map((subscription, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={subscription.id}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      background: mode === 'light'
                        ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
                        : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 3,
                      border: mode === 'light' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: mode === 'light'
                          ? '0 12px 24px rgba(0,0,0,0.15)'
                          : '0 12px 24px rgba(0,0,0,0.4)',
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        {subscription.program.logoUrl ? (
                          <Avatar
                            src={subscription.program.logoUrl}
                            alt={subscription.program.name}
                            sx={{ width: 56, height: 56, mr: 2 }}
                          />
                        ) : (
                          <Avatar 
                            sx={{ 
                              width: 56, 
                              height: 56, 
                              mr: 2,
                              backgroundColor: getColorForChannel((subscription.program.channel.order ?? 1) - 1, mode),
                              fontSize: '1.5rem',
                              fontWeight: 600,
                              color: 'white',
                            }}
                          >
                            {subscription.program.name.charAt(0)}
                          </Avatar>
                        )}
                        <Box flexGrow={1}>
                          <Typography variant="h6" component="h3" fontWeight={600} sx={{ mb: 0.5 }}>
                            {subscription.program.name}
                          </Typography>
                          <Chip
                            label={subscription.program.channel.name}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderRadius: 1.5,
                              fontWeight: 500,
                              borderColor: getColorForChannel((subscription.program.channel.order ?? 1) - 1, mode),
                              color: getColorForChannel((subscription.program.channel.order ?? 1) - 1, mode),
                            }}
                          />
                        </Box>
                      </Box>

                      {subscription.program.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.5,
                          }}
                        >
                          {subscription.program.description}
                        </Typography>
                      )}

                      <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600} sx={{ mb: 1.5 }}>
                          Notificaciones:
                        </Typography>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={subscription.notificationMethod}
                            onChange={(e) => updateNotificationMethod(
                              subscription.id, 
                              e.target.value as NotificationMethod
                            )}
                            sx={{ 
                              borderRadius: 2,
                              '& .MuiSelect-select': {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }
                            }}
                          >
                            {/* Always show all options first, then add restrictions for iOS without PWA */}
                            <MenuItem 
                              value={NotificationMethod.BOTH}
                              disabled={isIOSDevice && !isPWAInstalled && subscription.notificationMethod !== NotificationMethod.BOTH}
                            >
                              <Box display="flex" alignItems="center" gap={1}>
                                <NotificationsActive fontSize="small" />
                                Push y Email
                              </Box>
                            </MenuItem>
                            <MenuItem 
                              value={NotificationMethod.PUSH}
                              disabled={isIOSDevice && !isPWAInstalled && subscription.notificationMethod !== NotificationMethod.PUSH}
                            >
                              <Box display="flex" alignItems="center" gap={1}>
                                <Notifications fontSize="small" />
                                Solo Push
                              </Box>
                            </MenuItem>
                            <MenuItem value={NotificationMethod.EMAIL}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Email fontSize="small" />
                                Solo Email
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between', px: 3, pb: 3 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Desde {new Date(subscription.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                      <Tooltip title="Cancelar suscripción">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeSubscription(subscription.id)}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'error.main',
                              color: 'error.contrastText',
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
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