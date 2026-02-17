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
  LiveTv,
} from '@mui/icons-material';
import { Streamer, StreamingService } from '@/types/streamer';
import { extractTwitchChannel, extractKickChannel } from '@/utils/extractStreamChannel';
import { extractVideoId } from '@/utils/extractVideoId';
import { useYouTubePlayer } from '@/contexts/YouTubeGlobalPlayerContext';
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

const getServiceColor = (service: StreamingService, mode: 'light' | 'dark'): string => {
  switch (service) {
    case StreamingService.TWITCH:
      return mode === 'light' ? '#9146FF' : '#A970FF';
    case StreamingService.KICK:
      return mode === 'light' ? '#53FC18' : '#6AFF3A';
    case StreamingService.YOUTUBE:
      return mode === 'light' ? '#FF0000' : '#FF4444';
    default:
      return mode === 'light' ? '#1976d2' : '#42a5f5';
  }
};

const getServiceName = (service: StreamingService): string => {
  switch (service) {
    case StreamingService.TWITCH:
      return 'Twitch';
    case StreamingService.KICK:
      return 'Kick';
    case StreamingService.YOUTUBE:
      return 'YouTube';
    default:
      return service;
  }
};

const getServiceIconUrl = (service: StreamingService): string | null => {
  switch (service) {
    case StreamingService.TWITCH:
      return 'https://dwtkmfahaokhtpuafhsc.supabase.co/storage/v1/object/sign/streaming-services-logos/twitch_glitch_flat_purple.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84ZWQzMzdmNy04YmEwLTQxYjAtYmJjOS05YjI2NjVhZWYwYzIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHJlYW1pbmctc2VydmljZXMtbG9nb3MvdHdpdGNoX2dsaXRjaF9mbGF0X3B1cnBsZS5wbmciLCJpYXQiOjE3NjM1MjA4NTUsImV4cCI6MTc5NTA1Njg1NX0.9nqfLHXQIsExihVdeGIaAnhWqlW9zRnx0FPFqHarVpA';
    case StreamingService.KICK:
      return 'https://dwtkmfahaokhtpuafhsc.supabase.co/storage/v1/object/sign/streaming-services-logos/Kick%20Icon%20(Green).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84ZWQzMzdmNy04YmEwLTQxYjAtYmJjOS05YjI2NjVhZWYwYzIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHJlYW1pbmctc2VydmljZXMtbG9nb3MvS2ljayBJY29uIChHcmVlbikucG5nIiwiaWF0IjoxNzYzNTIwODQyLCJleHAiOjE3OTUwNTY4NDJ9.3cqNHCk9mYT4k6E7mUiIDIA8CWXWIKTUQK1iThtSrmo';
    case StreamingService.YOUTUBE:
      return null; // YouTube doesn't have an icon in the requirements
    default:
      return null;
  }
};

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
  initialStreamerSubscriptions?: Streamer[];
}

export default function SubscriptionsClient({ initialSubscriptions, initialStreamerSubscriptions = [] }: SubscriptionsClientProps) {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const router = useRouter();
  const { mode } = useThemeContext();
  const { isIOSDevice, isPWAInstalled } = usePush();
  const { openVideo, openStream } = useYouTubePlayer();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>(initialSubscriptions);
  const [streamerSubscriptions, setStreamerSubscriptions] = useState<Streamer[]>(initialStreamerSubscriptions);
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

  const removeStreamerSubscription = async (streamerId: number) => {
    if (!typedSession?.accessToken) return;
    if (!confirm('¿Estás seguro de que deseas dejar de seguir a este streamer?')) {
      return;
    }
    try {
      setLoading(true);
      const streamer = streamerSubscriptions.find(s => s.id === streamerId);
      await fetch(`/api/streamers/${streamerId}/unsubscribe`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${typedSession.accessToken}` },
      });

      setStreamerSubscriptions(prev => prev.filter(s => s.id !== streamerId));
      setSuccess('Has dejado de seguir al streamer');
      setTimeout(() => setSuccess(null), 3000);

      // Track
      gaEvent({
        action: 'streamer_unsubscribe',
        params: {
          streamer_id: streamerId,
          streamer_name: streamer?.name,
          location: 'subscriptions_page',
        },
        userData: typedSession?.user
      });
    } catch {
      setError('Error al cancelar la suscripción');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (streamer: Streamer, service: StreamingService, url: string) => {
    const isLive = streamer.is_live || false;

    // Track the click event
    gaEvent({
      action: isLive ? 'click_streamer_live' : 'click_streamer_offline',
      params: {
        category: 'streamer',
        streamer_name: streamer.name,
        streamer_id: streamer.id,
        platform: service, // 'twitch', 'kick', 'youtube'
      },
      userData: typedSession?.user
    });

    if (service === StreamingService.YOUTUBE) {
      // For YouTube, extract video ID and use openVideo
      // Note: YouTube only supports embedding videos, not channel pages
      const videoId = extractVideoId(url);
      if (videoId && !videoId.startsWith('http') && !videoId.includes('@')) {
        // It's a valid video ID - use it
        openVideo(videoId);
      } else {
        window.open(url, '_blank');
      }
      // If it's a channel URL, we can't embed it directly
      // The URL should be a video URL for embedding to work
    } else if (service === StreamingService.TWITCH) {
      const channelName = extractTwitchChannel(url);
      if (channelName) {
        openStream('twitch', channelName);
      }
    } else if (service === StreamingService.KICK) {
      const channelName = extractKickChannel(url);
      if (channelName) {
        openStream('kick', channelName);
      }
    }
  };


  // Track subscriptions page visit
  useEffect(() => {
    gaEvent({
      action: 'subscriptions_page_visit',
      params: {
        subscription_count: subscriptions.length,
        streamer_subscription_count: streamerSubscriptions.length,
        has_active_subscriptions: subscriptions.some(s => s.notificationMethod) || streamerSubscriptions.length > 0,
      },
      userData: typedSession?.user
    });
  }, [subscriptions, streamerSubscriptions, typedSession]);

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

          {subscriptions.length === 0 && streamerSubscriptions.length === 0 ? (
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
            <Box>
              {/* Programs Section */}
              {subscriptions.length > 0 && (
                <Box mb={6}>
                  <Typography variant="h5" component="h2" gutterBottom fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsActive color="primary" /> Programas
                  </Typography>
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
                </Box>
              )}

              {/* Streamers Section */}
              {streamerSubscriptions.length > 0 && (
                <Box>
                  <Typography variant="h5" component="h2" gutterBottom fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LiveTv color="primary" /> Streamers
                  </Typography>
                  <Grid container spacing={3}>
                    {streamerSubscriptions.map((streamer, index) => (
                      <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={streamer.id}>
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
                          <CardContent sx={{ p: 0, position: 'relative' }}>
                            {/* Streamer Header Image/Bg */}
                            <Box
                              sx={{
                                width: '100%',
                                aspectRatio: '16/9',
                                backgroundColor: getColorForChannel((streamer.order ?? 1) - 1, mode),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                            >
                              {streamer.logo_url ? (
                                <Box
                                  component="img"
                                  src={streamer.logo_url}
                                  alt={streamer.name}
                                  sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                              ) : (
                                <Typography
                                  sx={{
                                    fontSize: '3rem',
                                    fontWeight: 700,
                                    color: 'white',
                                  }}
                                >
                                  {streamer.name.charAt(0).toUpperCase()}
                                </Typography>
                              )}

                              {/* Live Badge */}
                              {streamer.is_live && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  }}
                                >
                                  LIVE
                                </Box>
                              )}
                            </Box>
                          </CardContent>

                          <CardContent sx={{ flexGrow: 1, p: 3 }}>
                            <Typography variant="h6" component="h3" fontWeight={600} sx={{ mb: 1 }}>
                              {streamer.name}
                            </Typography>

                            {streamer.categories && streamer.categories.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                {streamer.categories.map(cat => (
                                  <Chip
                                    key={cat.id}
                                    label={cat.name}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      borderRadius: 1.5,
                                      borderColor: cat.color ? `${cat.color}60` : undefined,
                                      color: cat.color,
                                    }}
                                  />
                                ))}
                              </Box>
                            )}

                            <Typography variant="body2" color="text.secondary">
                              Recibirás notificaciones cuando {streamer.name} inicie transmisión.
                            </Typography>

                            {/* Service Buttons */}
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.75,
                                mt: 2,
                              }}
                            >
                              {streamer.services
                                .filter(service => service.service === StreamingService.TWITCH || service.service === StreamingService.KICK || service.service === StreamingService.YOUTUBE)
                                .map((service, serviceIndex) => {
                                  const serviceIconUrl = getServiceIconUrl(service.service);

                                  return (
                                    <Button
                                      key={serviceIndex}
                                      variant="outlined"
                                      size="small"
                                      fullWidth
                                      onClick={() => handleServiceClick(streamer, service.service, service.url)}
                                      sx={{
                                        justifyContent: 'center',
                                        borderRadius: 1.5,
                                        borderColor: getServiceColor(service.service, mode),
                                        color: getServiceColor(service.service, mode),
                                        textTransform: 'none',
                                        gap: 1,
                                        py: 0.75,
                                        px: 1.5,
                                        minHeight: 36,
                                        '&:hover': {
                                          borderColor: getServiceColor(service.service, mode),
                                          backgroundColor: mode === 'light'
                                            ? `${getServiceColor(service.service, mode)}15`
                                            : `${getServiceColor(service.service, mode)}25`,
                                        }
                                      }}
                                    >
                                      {serviceIconUrl && (
                                        <Box
                                          component="img"
                                          src={serviceIconUrl}
                                          alt={`${getServiceName(service.service)} icon`}
                                          sx={{
                                            width: 16,
                                            height: 16,
                                            objectFit: 'contain',
                                          }}
                                        />
                                      )}
                                      <Typography variant="caption" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
                                        Ver en {getServiceName(service.service)}
                                      </Typography>
                                    </Button>
                                  );
                                })}
                            </Box>
                          </CardContent>

                          <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3 }}>
                            <Tooltip title="Dejar de seguir">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeStreamerSubscription(streamer.id)}
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
                </Box>
              )}
            </Box>
          )}
        </MotionBox>
      </Container>
    </Box>
  );
} 