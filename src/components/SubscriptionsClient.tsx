'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Delete,
  ArrowBack,
} from '@mui/icons-material';
import { Streamer, StreamingService } from '@/types/streamer';


import { useSessionContext } from '@/contexts/SessionContext';
import { api } from '@/services/api';
import type { SessionWithToken } from '@/types/session';
import { useRouter } from 'next/navigation';
import { useThemeContext } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import IOSPushGuide from '@/components/IOSPushGuide';
import { getColorForChannel } from '@/utils/colors';
import { event as gaEvent } from '@/lib/gtag';


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

// Enum removed

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
      logo_url?: string;
      background_color?: string;
    };
  };
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

  // isIOSDevice, isPWAInstalled removed as they were only used for notification method logic
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

  // updateNotificationMethod removed as it's no longer supported

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
      await api.delete(`/streamers/${streamerId}/unsubscribe`, {
        headers: { Authorization: `Bearer ${typedSession.accessToken}` },
      });
      setStreamerSubscriptions(prev => prev.filter(s => s.id !== streamerId));
      setSuccess('Has dejado de seguir al streamer correctamente');
      setTimeout(() => setSuccess(null), 3000);

      gaEvent({
        action: 'streamer_unsubscribe',
        params: {
          streamer_id: streamerId,
          location: 'subscriptions_page',
        },
        userData: typedSession?.user
      });
    } catch {
      setError('Error al dejar de seguir');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (streamer: Streamer, service: StreamingService, url: string) => {
    window.open(url, '_blank');

    gaEvent({
      action: 'streamer_service_click',
      params: {
        streamer_id: streamer.id,
        streamer_name: streamer.name,
        service: service,
        location: 'subscriptions_page',
      },
      userData: typedSession?.user
    });
  };

  // Track subscriptions page visit
  useEffect(() => {
    gaEvent({
      action: 'subscriptions_page_visit',
      params: {
        subscription_count: subscriptions.length,
        streamer_subscription_count: streamerSubscriptions.length,
        has_active_subscriptions: subscriptions.length > 0 || streamerSubscriptions.length > 0,
      },
      userData: typedSession?.user
    });
  }, [subscriptions, streamerSubscriptions, typedSession]);


  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 1, sm: 2 } }}>
      <Header />
      <Box component="main" sx={{ pt: 4, pb: 4 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 3 } }}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton onClick={() => router.back()} color="inherit">
                  <ArrowBack />
                </IconButton>
                <Typography variant="h4" component="h1" fontWeight={700}>
                  Mis Suscripciones
                </Typography>
              </Box>
            </Box>

            <IOSPushGuide />

            {loading && (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 4 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            {!loading && (
              <Grid container spacing={4}>
                {/* Programs Column */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h5" component="h2" gutterBottom fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    Programas
                  </Typography>

                  {subscriptions.length > 0 ? (
                    <Grid container spacing={2}>
                      {subscriptions.map((subscription, index) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={subscription.id}>
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
                            <CardContent sx={{ flexGrow: 1, p: 2 }}>
                              <Box display="flex" flexDirection="column" gap={1}>

                                <Typography variant="subtitle1" component="h3" fontWeight={700} lineHeight={1.2}>
                                  {subscription.program.name}
                                </Typography>

                                <Box display="flex" alignItems="center" gap={1} mt={1}>
                                  <Typography variant="body2" color="text.secondary">
                                    en
                                  </Typography>
                                  <Box
                                    sx={{
                                      width: 80,
                                      height: 36,
                                      borderRadius: 1,
                                      bgcolor: subscription.program.channel.background_color || '#ffffff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      overflow: 'hidden',
                                      position: 'relative',
                                      boxShadow: mode === 'light'
                                        ? '0 1px 2px rgba(0,0,0,0.1)'
                                        : '0 1px 2px rgba(0,0,0,0.2)',
                                    }}
                                  >
                                    {subscription.program.channel.logo_url ? (
                                      <Box
                                        component="img"
                                        src={subscription.program.channel.logo_url}
                                        alt={subscription.program.channel.name}
                                        sx={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'contain',
                                          p: 0.5
                                        }}
                                      />
                                    ) : (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: 700,
                                          color: 'white',
                                          fontSize: '0.7rem',
                                          textAlign: 'center',
                                          lineHeight: 1.1,
                                          px: 0.5
                                        }}
                                      >
                                        {subscription.program.channel.name}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </Box>

                              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.7rem' }}>
                                  Desde {new Date(subscription.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </Typography>
                                <Tooltip title="Cancelar suscripción">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => removeSubscription(subscription.id)}
                                    sx={{ p: 0.5 }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </CardContent>
                          </MotionCard>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No tienes suscripciones a programas.</Typography>
                  )}
                </Grid>

                {/* Streamers Column */}
                < Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h5" component="h2" gutterBottom fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    Streamers
                  </Typography>

                  {
                    streamerSubscriptions.length > 0 ? (
                      <Grid container spacing={2}>
                        {streamerSubscriptions.map((streamer, index) => (
                          <Grid size={{ xs: 12, sm: 6 }} key={streamer.id}>
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
                              <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
                                {/* ID Photo Style Image */}
                                <Box
                                  sx={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: 3,
                                    backgroundColor: getColorForChannel((streamer.order ?? 1) - 1, mode),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    position: 'relative'
                                  }}
                                >
                                  {streamer.logo_url ? (
                                    <Box
                                      component="img"
                                      src={streamer.logo_url}
                                      alt={streamer.name}
                                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                                      {streamer.name.charAt(0).toUpperCase()}
                                    </Typography>
                                  )}

                                  {/* Live dot for ID style */}
                                  {streamer.is_live && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        bottom: 4,
                                        right: 4,
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        backgroundColor: '#f44336',
                                        border: '2px solid white',
                                      }}
                                    />
                                  )}
                                </Box>

                                {/* Info */}
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="h6" component="h3" fontWeight={700} noWrap lineHeight={1.2}>
                                      {streamer.name}
                                    </Typography>
                                    {streamer.is_live && (
                                      <Chip
                                        label="LIVE"
                                        size="small"
                                        color="error"
                                        sx={{ height: 16, fontSize: '0.6rem', fontWeight: 'bold' }}
                                      />
                                    )}
                                  </Box>

                                  {streamer.categories && streamer.categories.length > 0 && (
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                      {streamer.categories.slice(0, 2).map(cat => (
                                        <Chip
                                          key={cat.id}
                                          label={cat.name}
                                          size="small"
                                          variant="outlined"
                                          sx={{ height: 18, fontSize: '0.65rem', borderRadius: 1, borderColor: cat.color ? `${cat.color}60` : undefined, color: cat.color }}
                                        />
                                      ))}
                                    </Box>
                                  )}
                                </Box>

                                {/* Trash Button */}
                                <Tooltip title="Dejar de seguir">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => removeStreamerSubscription(streamer.id)}
                                    sx={{
                                      alignSelf: 'flex-start',
                                      mt: -0.5,
                                      mr: -0.5,
                                      opacity: 0.7,
                                      '&:hover': { opacity: 1, bgcolor: 'error.lighter' }
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </CardContent>

                              {/* Service Buttons - Compact Row at bottom */}
                              <Box sx={{ px: 2, pb: 2, pt: 0, display: 'flex', gap: 1 }}>
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
                                          borderRadius: 2,
                                          borderColor: getServiceColor(service.service, mode),
                                          color: getServiceColor(service.service, mode),
                                          textTransform: 'none',
                                          gap: 0.5,
                                          py: 0.25,
                                          minHeight: 28,
                                          fontSize: '0.75rem',
                                          flex: 1,
                                          '&:hover': {
                                            borderColor: getServiceColor(service.service, mode),
                                            backgroundColor: mode === 'light'
                                              ? `${getServiceColor(service.service, mode)}15`
                                              : `${getServiceColor(service.service, mode)}25`,
                                          }
                                        }}
                                      >
                                        {serviceIconUrl && (
                                          <Box component="img" src={serviceIconUrl} alt="" sx={{ width: 14, height: 14, objectFit: 'contain' }} />
                                        )}
                                        {getServiceName(service.service)}
                                      </Button>
                                    );
                                  })}
                              </Box>
                            </MotionCard>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No sigues a ningún streamer.</Typography>
                    )
                  }
                </Grid >
              </Grid >
            )}
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
}