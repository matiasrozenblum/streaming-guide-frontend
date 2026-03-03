'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Card,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
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

// Reusable Tile Component
const SubscriptionTile = ({
  id,
  title,
  subtitle,
  imageUrl,
  imageColor,
  isStreamer,
  activeDeleteId,
  onToggleDelete,
  onDelete,
  deleteTooltip,
  onClick,
  services,
  onServiceClick
}: {
  id: string | number,
  title: string,
  subtitle?: React.ReactNode,
  imageUrl?: string,
  imageColor?: string,
  isStreamer?: boolean,
  activeDeleteId: string | number | null,
  onToggleDelete: (id: string | number) => void,
  onDelete: (e: React.MouseEvent) => void,
  deleteTooltip: string,
  onClick?: () => void,
  services?: { service: StreamingService, url: string }[],
  onServiceClick?: (service: StreamingService, url: string) => void
}) => {
  const { mode } = useThemeContext();
  const showDelete = activeDeleteId === id;

  return (
    <MotionCard
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onClick={() => {
        if (onClick) onClick();
        else onToggleDelete(id);
      }}
      onMouseLeave={() => {
        if (showDelete) onToggleDelete(id);
      }}
      sx={{
        height: 80, // Compact fixed height
        display: 'flex',
        alignItems: 'center',
        background: mode === 'light' ? '#ffffff' : '#1e293b', // Darker surface
        borderRadius: 2,
        border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s',
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover .delete-btn': { opacity: '1 !important' }
        },
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: mode === 'light' ? '#cbd5e1' : '#475569',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}
    >
      {/* Visual / Avatar Area */}
      <Box
        sx={{
          width: 80,
          height: 80,
          flexShrink: 0,
          background: imageColor || (mode === 'light' ? '#f1f5f9' : '#0f172a'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: isStreamer ? 'cover' : 'contain', // Streamers use cover, Programs use contain
              p: isStreamer ? 0 : 0.5 // Streamers have no padding, channels have 4px padding
            }}
          />
        ) : (
          <Typography fontWeight={700} sx={{ color: '#fff', fontSize: '1.5rem' }}>
            {title.charAt(0).toUpperCase()}
          </Typography>
        )}
      </Box>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, px: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1" fontWeight={600} noWrap title={title} sx={{ fontSize: '1.1rem' }}>
            {title}
          </Typography>
        </Box>

        {subtitle && (
          <Box display="flex" alignItems="center" gap={1} overflow="hidden">
            {subtitle}
          </Box>
        )}

        {/* Small Service Icons for Streamers */}
        {services && services.length > 0 && (
          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>
              EN
            </Typography>
            {services.map((s, idx) => {
              const icon = getServiceIconUrl(s.service);
              if (!icon) return null;
              return (
                <Tooltip key={idx} title={`Watch on ${getServiceName(s.service)}`}>
                  <Box
                    component="img"
                    src={icon}
                    sx={{ width: 14, height: 14, opacity: 0.7, '&:hover': { opacity: 1, cursor: 'pointer' } }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onServiceClick?.(s.service, s.url);
                    }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Action Area (Hover Reveal) */}
      <Box
        className="delete-btn"
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          opacity: showDelete ? 1 : 0, // Visible if active
          transition: 'opacity 0.2s',
          zIndex: 10
        }}
      >
        <Tooltip title={deleteTooltip}>
          <Box
            onClick={onDelete}
            sx={{
              color: '#ef4444', // Literal red cross
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              cursor: 'pointer',
              transition: 'transform 0.1s ease-in-out',
              '&:hover': {
                transform: 'scale(1.15)'
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Box>
        </Tooltip>
      </Box>
    </MotionCard>
  );
};

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





  const [isProgramsExpanded, setIsProgramsExpanded] = useState(true);
  const [isStreamersExpanded, setIsStreamersExpanded] = useState(true);
  const [activeDeleteId, setActiveDeleteId] = useState<string | number | null>(null);

  // existing hook usages like useThemeContext and useSessionContext are above in the file

  // Skip to rendering part to replace the grid

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 1, sm: 2 } }}>
      <Header />
      <Box component="main" sx={{ pt: 4, pb: 4 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 3 } }}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            sx={{ maxWidth: '100%' }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton onClick={() => router.back()} color="inherit">
                  <ArrowBack />
                </IconButton>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: mode === 'light'
                      ? 'linear-gradient(to right, #1a237e, #0d47a1)'
                      : 'linear-gradient(to right, #90caf9, #42a5f5)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Programs Sections */}
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      mb: isProgramsExpanded ? 2 : 0,
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => setIsProgramsExpanded(!isProgramsExpanded)}
                  >
                    <Typography variant="h6" component="h2" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                      Programas
                    </Typography>
                    <IconButton size="small" disableRipple sx={{ color: 'text.secondary' }}>
                      <Box
                        component="svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        sx={{
                          transform: isProgramsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </Box>
                    </IconButton>
                  </Box>

                  {isProgramsExpanded && (
                    <MotionBox
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {subscriptions.length > 0 ? (
                        <Grid container spacing={2}>
                          {subscriptions.map((subscription) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={subscription.id}>
                              <SubscriptionTile
                                id={subscription.id}
                                activeDeleteId={activeDeleteId}
                                onToggleDelete={(id) => setActiveDeleteId(activeDeleteId === id ? null : id)}
                                title={subscription.program.name}
                                subtitle={
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                    en <Box component="span" fontWeight={600} color="text.primary">{subscription.program.channel.name.toUpperCase()}</Box>
                                  </Typography>
                                }
                                imageUrl={subscription.program.channel.logo_url}
                                imageColor={subscription.program.channel.background_color || '#ffffff'}
                                onDelete={(e) => { e.stopPropagation(); removeSubscription(subscription.id); }}
                                deleteTooltip="Cancelar suscripción"
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>No tienes suscripciones a programas.</Typography>
                      )}
                    </MotionBox>
                  )}
                </Box>

                {/* Streamers Section */}
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      mb: isStreamersExpanded ? 2 : 0,
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => setIsStreamersExpanded(!isStreamersExpanded)}
                  >
                    <Typography variant="h6" component="h2" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                      Streamers
                    </Typography>
                    <IconButton size="small" disableRipple sx={{ color: 'text.secondary' }}>
                      <Box
                        component="svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        sx={{
                          transform: isStreamersExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </Box>
                    </IconButton>
                  </Box>

                  {isStreamersExpanded && (
                    <MotionBox
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {streamerSubscriptions.length > 0 ? (
                        <Grid container spacing={2}>
                          {streamerSubscriptions.map((streamer) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={streamer.id}>
                              <SubscriptionTile
                                id={streamer.id}
                                activeDeleteId={activeDeleteId}
                                onToggleDelete={(id) => setActiveDeleteId(activeDeleteId === id ? null : id)}
                                title={streamer.name}
                                imageUrl={streamer.logo_url || undefined}
                                imageColor={getColorForChannel((streamer.order ?? 1) - 1, mode)}
                                isStreamer={true}
                                onDelete={(e) => { e.stopPropagation(); removeStreamerSubscription(streamer.id); }}
                                deleteTooltip="Dejar de seguir"
                                services={streamer.services.filter(s => s.service === StreamingService.TWITCH || s.service === StreamingService.KICK)}
                                onServiceClick={(service, url) => handleServiceClick(streamer, service, url)}
                                subtitle={
                                  streamer.categories && streamer.categories.length > 0 ? (
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {streamer.categories.map(c => c.name).join(', ')}
                                    </Typography>
                                  ) : undefined
                                }
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>No sigues a ningún streamer.</Typography>
                      )}
                    </MotionBox>
                  )}
                </Box>
              </Box>
            )}
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
}